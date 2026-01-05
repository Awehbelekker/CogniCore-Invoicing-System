/**
 * Simple HTTP Server for Aweh Invoice System
 * Run with: node server.js
 * Then open: http://localhost:8080
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;

// MIME types for different file extensions
const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.md': 'text/markdown'
};

const server = http.createServer((req, res) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);

    // Default to index page
    let filePath = '.' + req.url;
    if (filePath === './') {
        filePath = './COMPLETE-INVOICE-SYSTEM.html';
    }

    // Get file extension
    const extname = String(path.extname(filePath)).toLowerCase();
    const contentType = mimeTypes[extname] || 'application/octet-stream';

    // Read and serve the file
    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                // File not found
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>404 - Not Found</title>
                        <style>
                            body {
                                font-family: Arial, sans-serif;
                                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                                color: white;
                                display: flex;
                                justify-content: center;
                                align-items: center;
                                height: 100vh;
                                margin: 0;
                            }
                            .container {
                                text-align: center;
                            }
                            h1 { font-size: 4rem; margin: 0; }
                            p { font-size: 1.5rem; }
                            a {
                                color: #06ffa5;
                                text-decoration: none;
                                font-weight: bold;
                            }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <h1>404</h1>
                            <p>File not found</p>
                            <p><a href="/">← Back to Invoice System</a></p>
                        </div>
                    </body>
                    </html>
                `, 'utf-8');
            } else {
                // Server error
                res.writeHead(500);
                res.end(`Server Error: ${error.code}`);
            }
        } else {
            // Success
            res.writeHead(200, { 
                'Content-Type': contentType,
                'Cache-Control': 'no-cache'
            });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, () => {
    console.log('');
    console.log('🚀 ========================================');
    console.log('   Aweh Invoice System - HTTP Server');
    console.log('   ========================================');
    console.log('');
    console.log(`   ✅ Server running at:`);
    console.log(`      http://localhost:${PORT}`);
    console.log(`      http://127.0.0.1:${PORT}`);
    console.log('');
    console.log(`   📱 For mobile access on same network:`);
    console.log(`      Find your IP with: ipconfig`);
    console.log(`      Then use: http://YOUR_IP:${PORT}`);
    console.log('');
    console.log('   Press Ctrl+C to stop the server');
    console.log('   ========================================');
    console.log('');
});

