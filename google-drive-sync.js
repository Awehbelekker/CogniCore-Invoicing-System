/**
 * Google Drive Sync Module for Aweh Invoice System
 * 
 * Drop-in replacement for localStorage with automatic Google Drive sync
 * 
 * Features:
 * - Automatic sync to Google Drive
 * - Offline fallback to localStorage
 * - Sync queue for offline changes
 * - Same API as localStorage (easy migration)
 * 
 * Usage:
 *   await driveStorage.setItem('aweh_invoices', invoices);
 *   const invoices = await driveStorage.getItem('aweh_invoices', []);
 */

class GoogleDriveStorage {
    constructor() {
        // Load Client ID from localStorage (configured via setup guide)
        const savedClientId = localStorage.getItem('google_drive_client_id');
        this.CLIENT_ID = savedClientId || null; // No default - must be configured first
        this.API_KEY = ''; // Not required for Drive API with OAuth
        this.DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'];
        this.SCOPES = 'https://www.googleapis.com/auth/drive.file';

        this.isSignedIn = false;
        this.isOnline = navigator.onLine;
        this.syncQueue = [];
        this.folderName = 'Aweh Invoice System';
        this.folderId = null;
        this.disabled = !savedClientId; // Disabled until Client ID is configured
        this.lastError = null; // Track last error for diagnostics
        this.initAttempts = 0; // Track initialization attempts

        this.tokenClient = null;
        this._initPromise = null;
        this.pendingTokenResponse = null;

        // Listen for online/offline events
        window.addEventListener('online', () => this.handleOnline());
        window.addEventListener('offline', () => this.handleOffline());

        // Log initialization status for debugging
        console.log('[GoogleDriveStorage] Initialized with Client ID:', savedClientId ? 'Configured' : 'Not configured');
    }

    /**
     * Get detailed status for diagnostics
     */
    getStatus() {
        return {
            clientConfigured: this.isClientConfigured(),
            isSignedIn: this.isSignedIn,
            isOnline: this.isOnline,
            disabled: this.disabled,
            folderId: this.folderId,
            lastError: this.lastError,
            initAttempts: this.initAttempts,
            gapiLoaded: typeof gapi !== 'undefined',
            gisLoaded: typeof google !== 'undefined' && google.accounts?.oauth2 !== undefined
        };
    }

    async waitForIdentityServices(timeoutMs = 8000) {
        const started = Date.now();
        while (Date.now() - started < timeoutMs) {
            if (typeof google !== 'undefined' && google.accounts && google.accounts.oauth2) {
                return true;
            }
            await new Promise(r => setTimeout(r, 50));
        }
        return false;
    }

    getAccessToken() {
        const token = (gapi?.client?.getToken && gapi.client.getToken()) || (gapi?.auth?.getToken && gapi.auth.getToken());
        return token?.access_token || null;
    }

    isClientConfigured() {
        return Boolean(this.CLIENT_ID && this.CLIENT_ID !== 'YOUR_CLIENT_ID_HERE' && this.CLIENT_ID.endsWith('.apps.googleusercontent.com'));
    }

    /**
     * Initialize Google Drive API
     */
    async init() {
        if (this._initPromise) return this._initPromise;

        this.initAttempts++;
        console.log(`[GoogleDriveStorage] Init attempt ${this.initAttempts}`);

        this._initPromise = new Promise((resolve, reject) => {
            const timeoutMs = 8000; // Increased timeout for slower connections
            let settled = false;
            const doneResolve = () => {
                if (settled) return;
                settled = true;
                clearTimeout(timeoutId);
                this.lastError = null;
                console.log('[GoogleDriveStorage] Initialization successful');
                resolve();
            };
            const doneReject = (err) => {
                if (settled) return;
                settled = true;
                clearTimeout(timeoutId);
                // Allow retries after failure
                this._initPromise = null;
                this.lastError = err.message || String(err);
                console.error('[GoogleDriveStorage] Initialization failed:', this.lastError);
                reject(err);
            };

            const timeoutId = setTimeout(() => {
                const status = this.getStatus();
                const errMsg = `Google Drive init timed out after ${timeoutMs}ms. Status: GAPI=${status.gapiLoaded}, GIS=${status.gisLoaded}`;
                doneReject(new Error(errMsg));
            }, timeoutMs);

            if (typeof gapi === 'undefined') {
                doneReject(new Error('Google API library (gapi) not loaded. Please check your internet connection or try refreshing the page.'));
                return;
            }

            try {
                gapi.load('client', async () => {
                    try {
                        const apiKey = (this.API_KEY && this.API_KEY !== 'YOUR_API_KEY_HERE') ? this.API_KEY : undefined;
                        await gapi.client.init({
                            apiKey,
                            discoveryDocs: this.DISCOVERY_DOCS
                        });

                        const gisReady = await this.waitForIdentityServices();
                        if (!gisReady) {
                            console.warn('Google Identity Services (GIS) not loaded yet; sign-in will be unavailable until it loads.');
                        }

                        if (gisReady && this.isClientConfigured()) {
                            this.tokenClient = google.accounts.oauth2.initTokenClient({
                                client_id: this.CLIENT_ID,
                                scope: this.SCOPES,
                                callback: () => {}
                            });
                        }

                        // If we received a token before gapi was ready, apply it now.
                        if (this.pendingTokenResponse?.access_token && gapi?.client?.setToken) {
                            gapi.client.setToken(this.pendingTokenResponse);
                        }

                        // If a token is already set for this session, treat as signed in
                        this.isSignedIn = Boolean(this.getAccessToken());
                        this.updateSignInStatus();

                        if (this.isSignedIn) {
                            await this.ensureFolder();
                        }

                        doneResolve();
                    } catch (error) {
                        console.error('Error initializing Google Drive API:', error);
                        doneReject(error);
                    }
                });
            } catch (e) {
                doneReject(e);
            }
        });

        return this._initPromise;
    }

    /**
     * Sign in to Google
     */
    async signIn() {
        try {
            if (!this.isClientConfigured()) {
                this.updateSyncStatus('⚠️ Google Drive not configured. Your data is saved locally only.', 'warning');
                alert('Google Drive Sync is not configured yet.\n\nYour data is automatically saved to your browser.\n\nTo enable Google Drive backup:\n1. Get a Google OAuth Client ID\n2. Configure redirect URIs:\n   - ' + window.location.origin + '\n   - ' + window.location.origin + '/\n   - ' + window.location.origin + '/COMPLETE-INVOICE-SYSTEM.html\n3. Use the Setup Wizard in Settings');
                throw new Error('Google Drive Client ID not configured. Use the Setup Google Drive wizard first.');
            }

            // IMPORTANT (mobile/Safari): do not await before requesting the token, or the popup can be blocked.
            if (!this.tokenClient) {
                if (typeof google !== 'undefined' && google.accounts?.oauth2?.initTokenClient) {
                    this.tokenClient = google.accounts.oauth2.initTokenClient({
                        client_id: this.CLIENT_ID,
                        scope: this.SCOPES,
                        callback: () => {}
                    });
                }
            }

            if (!this.tokenClient) {
                throw new Error('Google Sign-in is still loading. Please wait a moment and try again.');
            }

            const ok = await new Promise((resolve) => {
                let didRetryWithConsent = false;
                let callbackCalled = false;
                const helpText = `If you saw “Error 400: redirect_uri_mismatch”, update your Google OAuth Client configuration:\n\n- Authorized JavaScript origins: ${window.location.origin}\n- Authorized redirect URIs (if required): ${window.location.origin}/ and ${window.location.origin}/COMPLETE-INVOICE-SYSTEM.html\n\nAlso ensure the OAuth client type is “Web application”, and the Google Drive API is enabled.`;

                const timeoutId = setTimeout(() => {
                    if (callbackCalled) return;
                    this.isSignedIn = false;
                    this.updateSignInStatus();
                    this.updateSyncStatus(`❌ Sign-in timed out. ${helpText}`, 'error');
                    resolve(false);
                }, 45000);

                this.tokenClient.callback = async (tokenResponse) => {
                    callbackCalled = true;
                    clearTimeout(timeoutId);
                    if (tokenResponse?.error) {
                        console.error('Token error:', tokenResponse);

                        // GIS sometimes surfaces misconfiguration as an invalid_request.
                        if (tokenResponse.error === 'invalid_request') {
                            this.updateSyncStatus(`❌ Sign-in failed: invalid_request. ${helpText}`, 'error');
                        }

                        if (!didRetryWithConsent) {
                            didRetryWithConsent = true;
                            try {
                                this.tokenClient.requestAccessToken({ prompt: 'consent' });
                                return;
                            } catch (e) {
                                console.error('Consent token request failed:', e);
                            }
                        }

                        this.isSignedIn = false;
                        this.updateSignInStatus();
                        if (!tokenResponse?.error || tokenResponse.error !== 'invalid_request') {
                            this.updateSyncStatus(`❌ Sign-in failed. ${helpText}`, 'error');
                        }
                        resolve(false);
                        return;
                    }

                    // Token received. Apply immediately if possible, otherwise store and apply after init().
                    this.pendingTokenResponse = tokenResponse;
                    if (gapi?.client?.setToken) {
                        gapi.client.setToken(tokenResponse);
                    }

                    this.isSignedIn = true;
                    this.updateSignInStatus();

                    // Now it's safe to await async init/sync work.
                    await this.init();
                    if (gapi?.client?.setToken && this.pendingTokenResponse?.access_token) {
                        gapi.client.setToken(this.pendingTokenResponse);
                    }

                    await this.ensureFolder();
                    await this.syncAll();
                    resolve(true);
                };

                // Try silent first; fall back to consent if required.
                try {
                    this.updateSyncStatus('⏳ Opening Google sign-in...', 'info');
                    this.tokenClient.requestAccessToken({ prompt: '' });
                } catch (e) {
                    console.warn('Silent token request failed; requesting consent...', e);
                    try {
                        this.tokenClient.requestAccessToken({ prompt: 'consent' });
                    } catch (err) {
                        this.updateSyncStatus('❌ Sign-in popup was blocked. Please allow popups and try again.', 'error');
                        resolve(false);
                    }
                }
            });

            return ok;
        } catch (error) {
            console.error('Sign in error:', error);
            this.updateSyncStatus(`❌ Sign-in failed: ${error.message || error}`, 'error');
            return false;
        }
    }

    /**
     * Sign out from Google
     */
    async signOut() {
        try {
            const token = this.getAccessToken();
            if (token && typeof google !== 'undefined' && google.accounts?.oauth2?.revoke) {
                google.accounts.oauth2.revoke(token, () => {});
            }

            if (gapi?.client?.setToken) {
                gapi.client.setToken('');
            }

            this.isSignedIn = false;
            this.folderId = null;
            this.updateSignInStatus();
            return true;
        } catch (error) {
            console.error('Sign out error:', error);
            return false;
        }
    }

    /**
     * Update UI based on sign-in status
     */
    updateSignInStatus() {
        const syncGoogleBtn = document.getElementById('syncGoogleBtn');
        const signOutBtn = document.getElementById('googleSignOutBtn');
        const syncStatus = document.getElementById('syncStatus');

        if (syncGoogleBtn) {
            // Keep the one-click button visible; it will open setup if not configured.
            syncGoogleBtn.style.display = 'inline-flex';
            if (!this.isClientConfigured()) {
                syncGoogleBtn.textContent = '⚙️ Setup Cloud Sync';
                syncGoogleBtn.title = 'Click to set up Google Drive sync (5 min one-time setup)';
            } else if (this.isSignedIn) {
                syncGoogleBtn.textContent = '🔄 Sync Now';
                syncGoogleBtn.title = 'Sync your data with Google Drive';
            } else {
                syncGoogleBtn.textContent = '🔗 Login & Sync';
                syncGoogleBtn.title = 'Click to login with Google and sync your data';
            }
        }

        if (signOutBtn) {
            signOutBtn.style.display = this.isSignedIn ? 'inline-flex' : 'none';
        }

        if (syncStatus) {
            if (this.isSignedIn) {
                syncStatus.textContent = '☁️ Synced with Google Drive';
                syncStatus.style.color = 'var(--success)';
                syncStatus.title = 'Your data is automatically backed up to Google Drive';
            } else if (this.isClientConfigured()) {
                syncStatus.textContent = '💾 Local storage (Cloud ready)';
                syncStatus.style.color = 'var(--warning)';
                syncStatus.title = 'Data saved locally. Click "Login & Sync" to enable cloud backup';
            } else {
                syncStatus.textContent = '💾 Local storage only';
                syncStatus.style.color = 'rgba(255, 255, 255, 0.5)';
                syncStatus.title = 'Click "Setup Cloud Sync" to enable Google Drive backup';
            }
        }

        // Trigger custom event
        window.dispatchEvent(new CustomEvent('driveSignInStatusChanged', { 
            detail: { isSignedIn: this.isSignedIn } 
        }));
    }

    /**
     * Ensure app folder exists in Google Drive
     */
    async ensureFolder() {
        if (!this.isSignedIn) return null;

        try {
            // Check if folder already exists
            const response = await gapi.client.drive.files.list({
                q: `name='${this.folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
                fields: 'files(id, name)',
                spaces: 'drive'
            });

            if (response.result.files.length > 0) {
                this.folderId = response.result.files[0].id;
            } else {
                // Create folder
                const folderMetadata = {
                    name: this.folderName,
                    mimeType: 'application/vnd.google-apps.folder'
                };

                const folder = await gapi.client.drive.files.create({
                    resource: folderMetadata,
                    fields: 'id'
                });

                this.folderId = folder.result.id;
            }

            return this.folderId;
        } catch (error) {
            console.error('Error ensuring folder:', error);
            return null;
        }
    }

    /**
     * Find file by name in app folder
     */
    async findFile(filename) {
        if (!this.isSignedIn || !this.folderId) return null;

        try {
            const response = await gapi.client.drive.files.list({
                q: `name='${filename}' and '${this.folderId}' in parents and trashed=false`,
                fields: 'files(id, name, modifiedTime)',
                spaces: 'drive'
            });

            return response.result.files.length > 0 ? response.result.files[0] : null;
        } catch (error) {
            console.error('Error finding file:', error);
            return null;
        }
    }

    /**
     * Create file in Google Drive
     */
    async createFile(filename, content) {
        if (!this.isSignedIn || !this.folderId) return null;

        try {
            const fileContent = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
            const file = new Blob([fileContent], { type: 'application/json' });

            const metadata = {
                name: filename,
                mimeType: 'application/json',
                parents: [this.folderId]
            };

            const form = new FormData();
            form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
            form.append('file', file);

            const accessToken = this.getAccessToken();
            if (!accessToken) throw new Error('Missing access token');

            const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,modifiedTime', {
                method: 'POST',
                headers: new Headers({ 'Authorization': 'Bearer ' + accessToken }),
                body: form
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Google Drive create failed (${response.status}): ${errorText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error creating file:', error);
            throw error;
        }
    }

    /**
     * Update existing file in Google Drive
     */
    async updateFile(fileId, content) {
        if (!this.isSignedIn) return null;

        try {
            const fileContent = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
            const file = new Blob([fileContent], { type: 'application/json' });

            const accessToken = this.getAccessToken();
            if (!accessToken) throw new Error('Missing access token');

            const response = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
                method: 'PATCH',
                headers: new Headers({
                    'Authorization': 'Bearer ' + accessToken,
                    'Content-Type': 'application/json'
                }),
                body: file
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Google Drive update failed (${response.status}): ${errorText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error updating file:', error);
            throw error;
        }
    }

    /**
     * Download file content from Google Drive
     */
    async downloadFile(fileId) {
        if (!this.isSignedIn) return null;

        try {
            const response = await gapi.client.drive.files.get({
                fileId: fileId,
                alt: 'media'
            });

            return response.body;
        } catch (error) {
            console.error('Error downloading file:', error);
            return null;
        }
    }

    /**
     * Save data to Google Drive (and localStorage)
     * Drop-in replacement for localStorage.setItem()
     */
    async setItem(key, value) {
        const filename = key + '.json';
        const data = value;

        // Always save to localStorage first (instant, works offline)
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (error) {
            console.error('localStorage error:', error);
        }

        // Try to sync to Google Drive if online and signed in
        if (this.isOnline && this.isSignedIn) {
            try {
                const existingFile = await this.findFile(filename);

                if (existingFile) {
                    await this.updateFile(existingFile.id, data);
                } else {
                    await this.createFile(filename, data);
                }

                // Update sync status
                this.updateSyncStatus('✅ Synced to Google Drive', 'success');
                return true;
            } catch (error) {
                console.error('Google Drive sync error:', error);

                // Add to sync queue
                this.syncQueue.push({ action: 'save', key, value: data });
                this.updateSyncStatus('⚠️ Saved locally (will sync later)', 'warning');
                return false;
            }
        } else {
            // Offline or not signed in - add to sync queue
            this.syncQueue.push({ action: 'save', key, value: data });
            this.updateSyncStatus('💾 Saved locally (offline)', 'info');
            return false;
        }
    }

    /**
     * Load data from Google Drive (with localStorage fallback)
     * Drop-in replacement for localStorage.getItem()
     */
    async getItem(key, defaultValue = null) {
        const filename = key + '.json';

        // Get local data first
        let localData = defaultValue;
        try {
            const cached = localStorage.getItem(key);
            localData = cached ? JSON.parse(cached) : defaultValue;
        } catch (error) {
            console.error('localStorage error:', error);
        }

        // Try Google Drive if online and signed in
        if (this.isOnline && this.isSignedIn) {
            try {
                const file = await this.findFile(filename);

                if (file) {
                    const content = await this.downloadFile(file.id);

                    if (content) {
                        const remoteData = JSON.parse(content);

                        // Merge arrays (invoices, customers, etc.) to keep both local and remote
                        if (Array.isArray(remoteData) && Array.isArray(localData)) {
                            const merged = [...remoteData];
                            const remoteIds = new Set(remoteData.map(item => item.id));
                            
                            // Add local items that aren't in remote
                            localData.forEach(item => {
                                if (item.id && !remoteIds.has(item.id)) {
                                    merged.push(item);
                                }
                            });
                            
                            // Save merged data back to localStorage
                            localStorage.setItem(key, JSON.stringify(merged));
                            return merged;
                        }

                        // For non-array data, prefer remote
                        localStorage.setItem(key, JSON.stringify(remoteData));
                        return remoteData;
                    }
                }
            } catch (error) {
                console.error('Error loading from Google Drive:', error);
            }
        }

        // Return local data
        return localData;
    }

    /**
     * Remove item from Google Drive and localStorage
     */
    async removeItem(key) {
        const filename = key + '.json';

        // Remove from localStorage
        localStorage.removeItem(key);

        // Remove from Google Drive if signed in
        if (this.isSignedIn) {
            try {
                const file = await this.findFile(filename);

                if (file) {
                    await gapi.client.drive.files.delete({
                        fileId: file.id
                    });
                }
            } catch (error) {
                console.error('Error removing from Google Drive:', error);
            }
        }
    }

    /**
     * Sync all localStorage data to Google Drive
     */
    /**
     * Sync Down - Pull all data from Google Drive to localStorage
     * (Useful when loading the app on a new device)
     */
    async syncDown() {
        if (!this.isSignedIn) {
            console.log('Not signed in - cannot sync down');
            return;
        }

        this.updateSyncStatus('⬇️ Pulling data from Google Drive...', 'info');

        const keys = [
            'aweh_invoices',
            'aweh_customers',
            'aweh_products',
            'aweh_suppliers',
            'aweh_transactions',
            'aweh_settings',
            'aweh_favorites',
            'aweh_businesses'
        ];

        let downloadedCount = 0;

        for (const key of keys) {
            try {
                // Get data from Drive
                const driveData = await this.getItem(key, null);
                
                if (driveData !== null) {
                    // Update localStorage with Drive data
                    localStorage.setItem(key, JSON.stringify(driveData));
                    downloadedCount++;
                    console.log(`✅ Downloaded ${key} from Drive`);
                }
            } catch (error) {
                console.error(`Error downloading ${key}:`, error);
            }
        }

        console.log(`✅ Downloaded ${downloadedCount} files from Google Drive`);
    }

    /**
     * Sync All - Push all local data to Google Drive
     */
    async syncAll() {
        if (!this.isSignedIn) {
            console.log('Not signed in - cannot sync');
            return;
        }

        this.updateSyncStatus('🔄 Syncing all data...', 'info');

        const keys = [
            'aweh_invoices',
            'aweh_customers',
            'aweh_products',
            'aweh_suppliers',
            'aweh_transactions',
            'aweh_settings',
            'aweh_favorites',
            'aweh_businesses'
        ];

        let syncedCount = 0;

        for (const key of keys) {
            const data = localStorage.getItem(key);

            if (data) {
                try {
                    await this.setItem(key, JSON.parse(data));
                    syncedCount++;
                } catch (error) {
                    console.error(`Error syncing ${key}:`, error);
                }
            }
        }

        this.updateSyncStatus(`✅ Synced ${syncedCount} files`, 'success');
    }

    /**
     * Process sync queue (when back online)
     */
    async processSyncQueue() {
        if (this.syncQueue.length === 0) return;

        this.updateSyncStatus(`🔄 Syncing ${this.syncQueue.length} changes...`, 'info');

        const queue = [...this.syncQueue];
        this.syncQueue = [];

        for (const item of queue) {
            try {
                await this.setItem(item.key, item.value);
            } catch (error) {
                console.error('Error processing sync queue item:', error);
                // Re-add to queue if failed
                this.syncQueue.push(item);
            }
        }

        if (this.syncQueue.length === 0) {
            this.updateSyncStatus('✅ All changes synced', 'success');
        } else {
            this.updateSyncStatus(`⚠️ ${this.syncQueue.length} items pending`, 'warning');
        }
    }

    /**
     * Handle online event
     */
    async handleOnline() {
        this.isOnline = true;
        console.log('Back online');

        if (this.isSignedIn) {
            await this.processSyncQueue();
        }
    }

    /**
     * Handle offline event
     */
    handleOffline() {
        this.isOnline = false;
        console.log('Gone offline');
        this.updateSyncStatus('📴 Offline mode', 'warning');
    }

    /**
     * Update sync status in UI
     */
    updateSyncStatus(message, type = 'info') {
        const statusElement = document.getElementById('syncStatus');

        if (statusElement) {
            statusElement.textContent = message;

            const colors = {
                success: 'var(--success)',
                warning: 'var(--warning)',
                error: 'var(--danger)',
                info: 'var(--primary)'
            };

            statusElement.style.color = colors[type] || colors.info;
        }

        // Show toast notification
        if (typeof showToast === 'function') {
            showToast(message, type);
        }

        console.log(`[DriveSync] ${message}`);
    }

    /**
     * Get sync statistics
     */
    getSyncStats() {
        return {
            isSignedIn: this.isSignedIn,
            isOnline: this.isOnline,
            queueLength: this.syncQueue.length,
            folderId: this.folderId
        };
    }
}

// Create global instance
const driveStorage = new GoogleDriveStorage();

// Auto-initialize when Google API is loaded
if (typeof gapi !== 'undefined') {
    driveStorage.init().catch(error => {
        console.error('Failed to initialize Google Drive:', error);
    });
}
