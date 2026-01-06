/**
 * Hybrid LLM Configuration for CogniCore Invoice System
 * Version: 2.0 - With GLM Support & Auto-Detection
 *
 * HYBRID MODE: Seamlessly switch between local and cloud AI
 * - Local: Full privacy, no internet required, no API costs
 * - Cloud: Better quality, remote access, no hardware required
 *
 * Compatible with:
 * - LOCAL: Ollama, LM Studio, LocalAI, vLLM, GPT4All
 * - CLOUD: Together AI (FREE), OpenRouter (FREE GLM), Claude, OpenAI, Gemini, Z.ai
 * - GLM MODELS: GLM-4-9B, GLM-Z1-9B, GLM-4-32B (local & cloud)
 *
 * AUTO-DETECTION: Automatically selects best model based on hardware!
 */

// =============================================================================
// MODEL CATALOG - All Available Models with Requirements
// =============================================================================
const ModelCatalog = {
    // GLM Models (ZhipuAI) - Excellent for coding, reasoning, multilingual
    glm: {
        'glm4:9b': {
            name: 'GLM-4-9B-Chat',
            size: '9B',
            vramQ4: 6,      // GB VRAM for Q4 quantization
            vramQ8: 10,     // GB VRAM for Q8 quantization
            vramFP16: 18,   // GB VRAM for FP16
            ramCPU: 12,     // GB RAM for CPU-only
            context: 128000,
            strengths: ['multilingual', 'long-context', 'low-hallucination', 'coding'],
            ollamaName: 'glm4',
            recommended: true
        },
        'glm4:9b-0414': {
            name: 'GLM-4-9B-0414',
            size: '9B',
            vramQ4: 6,
            vramQ8: 10,
            vramFP16: 18,
            ramCPU: 12,
            context: 32000,
            strengths: ['batch-operations', 'translation', 'dialogue'],
            ollamaName: 'hf.co/bartowski/GLM-4-9B-0414-GGUF:Q4_K_M'
        },
        'glm-z1:9b': {
            name: 'GLM-Z1-9B-0414',
            size: '9B',
            vramQ4: 6,
            vramQ8: 10,
            vramFP16: 18,
            ramCPU: 12,
            context: 32000,
            strengths: ['reasoning', 'math', 'logic', 'complex-tasks'],
            ollamaName: 'hf.co/bartowski/GLM-Z1-9B-0414-GGUF:Q4_K_M',
            recommended: true
        },
        'glm4:32b': {
            name: 'GLM-4-32B-0414',
            size: '32B',
            vramQ4: 20,
            vramQ8: 36,
            vramFP16: 64,
            ramCPU: 40,
            context: 32000,
            strengths: ['coding', 'agents', 'tool-use', 'complex-reasoning'],
            ollamaName: 'hf.co/bartowski/GLM-4-32B-0414-GGUF:Q4_K_M'
        },
        'glm-z1:32b': {
            name: 'GLM-Z1-32B-0414',
            size: '32B',
            vramQ4: 20,
            vramQ8: 36,
            vramFP16: 64,
            ramCPU: 40,
            context: 32000,
            strengths: ['deep-reasoning', 'math', 'science', 'analysis'],
            ollamaName: 'hf.co/bartowski/GLM-Z1-32B-0414-GGUF:Q4_K_M'
        }
    },

    // Llama Models (Meta) - General purpose, well-tested
    llama: {
        'llama3.2:1b': {
            name: 'Llama 3.2 1B',
            size: '1B',
            vramQ4: 1,
            vramQ8: 2,
            vramFP16: 3,
            ramCPU: 4,
            context: 128000,
            strengths: ['ultra-lightweight', 'fast', 'edge-devices'],
            ollamaName: 'llama3.2:1b'
        },
        'llama3.2:3b': {
            name: 'Llama 3.2 3B',
            size: '3B',
            vramQ4: 2,
            vramQ8: 4,
            vramFP16: 6,
            ramCPU: 6,
            context: 128000,
            strengths: ['lightweight', 'fast', 'basic-tasks'],
            ollamaName: 'llama3.2:3b',
            recommended: true
        },
        'llama3.1:8b': {
            name: 'Llama 3.1 8B',
            size: '8B',
            vramQ4: 5,
            vramQ8: 9,
            vramFP16: 16,
            ramCPU: 10,
            context: 128000,
            strengths: ['balanced', 'general-purpose', 'reliable'],
            ollamaName: 'llama3.1:8b',
            recommended: true
        },
        'llama3.1:70b': {
            name: 'Llama 3.1 70B',
            size: '70B',
            vramQ4: 40,
            vramQ8: 75,
            vramFP16: 140,
            ramCPU: 80,
            context: 128000,
            strengths: ['high-quality', 'complex-reasoning', 'enterprise'],
            ollamaName: 'llama3.1:70b'
        }
    },

    // Qwen Models (Alibaba) - Good for coding and multilingual
    qwen: {
        'qwen2.5:0.5b': {
            name: 'Qwen 2.5 0.5B',
            size: '0.5B',
            vramQ4: 0.5,
            vramQ8: 1,
            vramFP16: 1.5,
            ramCPU: 2,
            context: 32000,
            strengths: ['tiny', 'ultra-fast', 'embedded'],
            ollamaName: 'qwen2.5:0.5b'
        },
        'qwen2.5:3b': {
            name: 'Qwen 2.5 3B',
            size: '3B',
            vramQ4: 2,
            vramQ8: 4,
            vramFP16: 6,
            ramCPU: 6,
            context: 32000,
            strengths: ['lightweight', 'coding', 'multilingual'],
            ollamaName: 'qwen2.5:3b'
        },
        'qwen2.5:7b': {
            name: 'Qwen 2.5 7B',
            size: '7B',
            vramQ4: 5,
            vramQ8: 8,
            vramFP16: 14,
            ramCPU: 10,
            context: 128000,
            strengths: ['coding', 'math', 'long-context'],
            ollamaName: 'qwen2.5:7b',
            recommended: true
        },
        'qwen2.5-coder:7b': {
            name: 'Qwen 2.5 Coder 7B',
            size: '7B',
            vramQ4: 5,
            vramQ8: 8,
            vramFP16: 14,
            ramCPU: 10,
            context: 128000,
            strengths: ['coding-specialized', 'code-completion', 'debugging'],
            ollamaName: 'qwen2.5-coder:7b'
        }
    },

    // Mistral Models - Fast and efficient
    mistral: {
        'mistral:7b': {
            name: 'Mistral 7B',
            size: '7B',
            vramQ4: 4,
            vramQ8: 8,
            vramFP16: 14,
            ramCPU: 10,
            context: 32000,
            strengths: ['fast', 'efficient', 'general-purpose'],
            ollamaName: 'mistral:7b',
            recommended: true
        }
    },

    // Phi Models (Microsoft) - Small but powerful
    phi: {
        'phi3:mini': {
            name: 'Phi-3 Mini',
            size: '3.8B',
            vramQ4: 2.5,
            vramQ8: 5,
            vramFP16: 8,
            ramCPU: 6,
            context: 128000,
            strengths: ['small', 'reasoning', 'math'],
            ollamaName: 'phi3:mini'
        }
    }
};

// =============================================================================
// HARDWARE PROFILES - Server sizing recommendations
// =============================================================================
const HardwareProfiles = {
    // Single User / Development
    minimal: {
        name: 'Minimal (1-2 users)',
        vram: 0,        // No GPU
        ram: 8,         // 8GB RAM
        cpu: 4,         // 4 cores
        recommendedModels: ['llama3.2:1b', 'qwen2.5:0.5b'],
        quantization: 'Q4_K_M',
        concurrentRequests: 1,
        description: 'Basic laptop/desktop, CPU-only inference'
    },

    // Small Business
    basic: {
        name: 'Basic (3-5 users)',
        vram: 8,        // 8GB GPU (RTX 3060/4060)
        ram: 16,
        cpu: 8,
        recommendedModels: ['glm4:9b', 'llama3.2:3b', 'mistral:7b', 'qwen2.5:3b'],
        quantization: 'Q4_K_M',
        concurrentRequests: 2,
        description: 'Gaming GPU, good for small teams'
    },

    // Medium Business
    standard: {
        name: 'Standard (5-15 users)',
        vram: 12,       // 12GB GPU (RTX 3060 12GB / 4070)
        ram: 32,
        cpu: 8,
        recommendedModels: ['glm4:9b', 'glm-z1:9b', 'llama3.1:8b', 'qwen2.5:7b'],
        quantization: 'Q8_0',
        concurrentRequests: 3,
        description: 'Mid-range GPU, balanced performance'
    },

    // Professional
    professional: {
        name: 'Professional (15-30 users)',
        vram: 24,       // 24GB GPU (RTX 3090/4090)
        ram: 64,
        cpu: 16,
        recommendedModels: ['glm4:9b', 'glm-z1:9b', 'glm4:32b', 'llama3.1:8b'],
        quantization: 'Q8_0',
        concurrentRequests: 5,
        description: 'High-end consumer GPU, excellent performance'
    },

    // Enterprise
    enterprise: {
        name: 'Enterprise (30+ users)',
        vram: 48,       // 48GB+ (A6000, dual GPUs)
        ram: 128,
        cpu: 32,
        recommendedModels: ['glm4:32b', 'glm-z1:32b', 'llama3.1:70b'],
        quantization: 'FP16',
        concurrentRequests: 10,
        description: 'Professional/datacenter GPU, maximum quality'
    }
};

// =============================================================================
// MAIN CONFIGURATION
// =============================================================================
const HybridLLMConfig = {
    // Version
    version: '2.0.0',

    // HYBRID MODE SETTINGS
    mode: 'auto',  // 'local', 'cloud', 'auto' (auto = try local first, fallback to cloud)

    // Auto-detected settings (populated by hardware detection)
    detected: {
        profile: null,          // Will be set by auto-detection
        vram: null,
        ram: null,
        recommendedModel: null,
        quantization: 'Q4_K_M'
    },

    // Privacy levels for different data types
    privacyRules: {
        customerData: 'local',      // Always process locally
        invoiceData: 'local',       // Always process locally
        generalChat: 'cloud',       // Can use cloud
        productSearch: 'cloud',     // Can use cloud
        voiceTranscription: 'auto'  // Use local if available
    },

    // Cloud providers (for remote users / non-sensitive queries)
    cloud: {
        primary: 'openrouter',  // FREE GLM tier!
        fallback: 'together',   // If primary fails
        providers: {
            // OpenRouter - FREE GLM-4.5-Air!
            openrouter: {
                baseUrl: 'https://openrouter.ai/api/v1',
                model: 'z-ai/glm-4.5-air:free',
                apiPath: '/chat/completions',
                free: true,
                rateLimit: 20,  // requests per minute (free tier)
                features: ['glm', 'reasoning', 'coding']
            },
            // Z.ai API - Official GLM provider
            zai: {
                baseUrl: 'https://api.z.ai/api/paas/v4',
                model: 'glm-4',
                apiPath: '/chat/completions',
                free: false,
                features: ['glm', 'vision', 'tools']
            },
            // Together AI - FREE Llama
            together: {
                baseUrl: 'https://api.together.xyz/v1',
                model: 'meta-llama/Llama-3.2-3B-Instruct-Turbo',
                apiPath: '/chat/completions',
                free: true,
                rateLimit: 60
            },
            // Novita AI - GLM support
            novita: {
                baseUrl: 'https://api.novita.ai/v3/openai',
                model: 'zai-org/glm-4.5-air',
                apiPath: '/chat/completions',
                free: false,
                features: ['glm', 'fast']
            },
            // SiliconFlow - Chinese provider with GLM
            siliconflow: {
                baseUrl: 'https://api.siliconflow.cn/v1',
                model: 'THUDM/glm-4-9b-chat',
                apiPath: '/chat/completions',
                free: true,
                features: ['glm', 'chinese']
            },
            // Google Gemini
            gemini: {
                baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
                model: 'gemini-1.5-flash',
                apiPath: '/models/gemini-1.5-flash:generateContent',
                free: true
            },
            // Anthropic Claude
            claude: {
                baseUrl: 'https://api.anthropic.com/v1',
                model: 'claude-3-5-sonnet-latest',
                apiPath: '/messages',
                free: false
            },
            // OpenAI
            openai: {
                baseUrl: 'https://api.openai.com/v1',
                model: 'gpt-4o-mini',
                apiPath: '/chat/completions',
                free: false
            }
        }
    },

    // Local providers (for on-premise / privacy-focused)
    local: {
        primary: 'ollama',
        selectedModel: null,  // Will be set by auto-detection
        providers: {
            ollama: {
                baseUrl: 'http://localhost:11434',
                apiPath: '/api/chat',
                openaiPath: '/v1/chat/completions',
                model: 'glm4',  // Default to GLM-4-9B
                alternativeModels: ['llama3.1:8b', 'mistral:7b', 'qwen2.5:7b']
            },
            lmStudio: {
                baseUrl: 'http://localhost:1234',
                apiPath: '/v1/chat/completions',
                model: 'local-model'
            },
            localAI: {
                baseUrl: 'http://localhost:8080',
                apiPath: '/v1/chat/completions',
                model: 'glm-4-9b'
            },
            vllm: {
                baseUrl: 'http://localhost:8000',
                apiPath: '/v1/chat/completions',
                model: 'THUDM/glm-4-9b-chat'
            },
            sglang: {
                baseUrl: 'http://localhost:30000',
                apiPath: '/v1/chat/completions',
                model: 'THUDM/glm-4-9b-chat'
            }
        }
    },

    // Voice transcription options
    whisper: {
        mode: 'auto',
        local: {
            baseUrl: 'http://localhost:8081',
            model: 'medium'
        },
        cloud: {
            provider: 'openai',
            model: 'whisper-1'
        }
    },

    // OCR - Tesseract.js is already built-in!
    ocr: {
        mode: 'offline',
        offlineLanguages: ['eng', 'afr']
    },

    // Model catalog reference
    models: ModelCatalog,

    // Hardware profiles reference
    profiles: HardwareProfiles
};

// =============================================================================
// HARDWARE DETECTION - Auto-detect system capabilities
// =============================================================================

/**
 * Detect hardware capabilities (works in Node.js and Browser)
 */
async function detectHardware() {
    const hardware = {
        vram: 0,
        ram: 0,
        cpu: 0,
        gpu: null,
        platform: null
    };

    // Node.js environment
    if (typeof process !== 'undefined' && process.versions?.node) {
        const os = require('os');
        hardware.ram = Math.round(os.totalmem() / (1024 * 1024 * 1024)); // GB
        hardware.cpu = os.cpus().length;
        hardware.platform = process.platform;

        // Try to detect GPU via nvidia-smi (Linux/Windows)
        try {
            const { execSync } = require('child_process');
            const nvidiaSmi = execSync('nvidia-smi --query-gpu=memory.total --format=csv,noheader,nounits',
                { encoding: 'utf8', timeout: 5000 });
            const vramMB = parseInt(nvidiaSmi.trim().split('\n')[0]);
            hardware.vram = Math.round(vramMB / 1024); // Convert to GB
            hardware.gpu = 'nvidia';
        } catch {
            // No NVIDIA GPU or nvidia-smi not available
            hardware.gpu = 'none';
        }
    }

    // Browser environment
    if (typeof navigator !== 'undefined') {
        hardware.platform = navigator.platform;
        hardware.cpu = navigator.hardwareConcurrency || 4;

        // Estimate RAM (limited browser API)
        if (navigator.deviceMemory) {
            hardware.ram = navigator.deviceMemory;
        }

        // Try WebGL for GPU detection
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            if (gl) {
                const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
                if (debugInfo) {
                    const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
                    hardware.gpu = renderer;

                    // Estimate VRAM based on GPU name
                    if (renderer.includes('RTX 4090')) hardware.vram = 24;
                    else if (renderer.includes('RTX 4080')) hardware.vram = 16;
                    else if (renderer.includes('RTX 4070')) hardware.vram = 12;
                    else if (renderer.includes('RTX 4060')) hardware.vram = 8;
                    else if (renderer.includes('RTX 3090')) hardware.vram = 24;
                    else if (renderer.includes('RTX 3080')) hardware.vram = 10;
                    else if (renderer.includes('RTX 3070')) hardware.vram = 8;
                    else if (renderer.includes('RTX 3060')) hardware.vram = 12;
                    else if (renderer.includes('A100')) hardware.vram = 80;
                    else if (renderer.includes('A6000')) hardware.vram = 48;
                    else if (renderer.includes('Apple')) hardware.vram = hardware.ram / 2; // Unified memory
                }
            }
        } catch (e) {
            console.log('WebGL detection failed:', e);
        }
    }

    return hardware;
}

/**
 * Get recommended models based on hardware and user count
 * @param {Object} hardware - Detected hardware specs
 * @param {number} userCount - Expected concurrent users
 * @returns {Object} Recommended configuration
 */
function getRecommendedModels(hardware, userCount = 1) {
    const recommendations = {
        primary: null,
        alternatives: [],
        quantization: 'Q4_K_M',
        profile: null,
        warnings: [],
        installCommands: []
    };

    // Determine profile based on hardware and users
    let profile;
    if (hardware.vram >= 48 || (hardware.vram >= 24 && userCount > 30)) {
        profile = HardwareProfiles.enterprise;
    } else if (hardware.vram >= 24 || (hardware.vram >= 12 && userCount > 15)) {
        profile = HardwareProfiles.professional;
    } else if (hardware.vram >= 12 || (hardware.vram >= 8 && userCount > 5)) {
        profile = HardwareProfiles.standard;
    } else if (hardware.vram >= 6 || hardware.ram >= 16) {
        profile = HardwareProfiles.basic;
    } else {
        profile = HardwareProfiles.minimal;
    }

    recommendations.profile = profile;
    recommendations.quantization = profile.quantization;

    // Find models that fit hardware
    const allModels = [];
    for (const family of Object.values(ModelCatalog)) {
        for (const [key, model] of Object.entries(family)) {
            const vramNeeded = profile.quantization === 'Q4_K_M' ? model.vramQ4 :
                               profile.quantization === 'Q8_0' ? model.vramQ8 : model.vramFP16;

            if (hardware.vram > 0 && vramNeeded <= hardware.vram) {
                allModels.push({ key, ...model, vramNeeded, type: 'gpu' });
            } else if (model.ramCPU <= hardware.ram) {
                allModels.push({ key, ...model, vramNeeded: model.ramCPU, type: 'cpu' });
            }
        }
    }

    // Sort by quality (larger models first) then by recommendation flag
    allModels.sort((a, b) => {
        if (a.recommended && !b.recommended) return -1;
        if (!a.recommended && b.recommended) return 1;
        return parseFloat(b.size) - parseFloat(a.size);
    });

    // Prioritize GLM models if available
    const glmModels = allModels.filter(m => m.key.includes('glm'));
    const otherModels = allModels.filter(m => !m.key.includes('glm'));

    const sortedModels = [...glmModels, ...otherModels];

    if (sortedModels.length > 0) {
        recommendations.primary = sortedModels[0];
        recommendations.alternatives = sortedModels.slice(1, 4);

        // Generate install commands
        recommendations.installCommands.push(
            `ollama pull ${sortedModels[0].ollamaName}`
        );
        sortedModels.slice(1, 3).forEach(m => {
            recommendations.installCommands.push(`ollama pull ${m.ollamaName}`);
        });
    }

    // Add warnings
    if (hardware.vram === 0) {
        recommendations.warnings.push('No GPU detected - using CPU inference (slower)');
    }
    if (userCount > profile.concurrentRequests * 2) {
        recommendations.warnings.push(
            `Hardware may struggle with ${userCount} users. Consider upgrading or using cloud fallback.`
        );
    }

    return recommendations;
}

/**
 * Auto-configure system based on hardware detection
 */
async function autoConfigureSystem(userCount = 1) {
    console.log('🔍 Detecting hardware...');
    const hardware = await detectHardware();
    console.log('📊 Hardware detected:', hardware);

    const recommendations = getRecommendedModels(hardware, userCount);
    console.log('💡 Recommendations:', recommendations);

    // Update config with detected settings
    HybridLLMConfig.detected = {
        hardware,
        profile: recommendations.profile?.name,
        vram: hardware.vram,
        ram: hardware.ram,
        recommendedModel: recommendations.primary?.ollamaName,
        quantization: recommendations.quantization,
        userCount
    };

    if (recommendations.primary) {
        HybridLLMConfig.local.selectedModel = recommendations.primary.ollamaName;
        HybridLLMConfig.local.providers.ollama.model = recommendations.primary.ollamaName;
    }

    return {
        hardware,
        recommendations,
        config: HybridLLMConfig.detected
    };
}

// =============================================================================
// SMART AI ROUTER - Automatically chooses best provider
// =============================================================================

/**
 * Main chat completion function with fallback chain
 */
async function hybridChatCompletion(messages, options = {}) {
    const config = HybridLLMConfig;
    const dataType = options.dataType || 'generalChat';
    const requiredMode = config.privacyRules[dataType] || config.mode;

    // Try local first if mode is 'local' or 'auto'
    if (requiredMode === 'local' || requiredMode === 'auto') {
        const localResult = await tryLocalLLM(messages, options);
        if (localResult.success) {
            return { ...localResult, mode: 'local' };
        }

        if (requiredMode === 'local') {
            return { success: false, error: 'Local LLM required but unavailable', mode: 'local' };
        }
    }

    // Try cloud providers with fallback chain
    if (requiredMode === 'cloud' || requiredMode === 'auto') {
        const cloudResult = await tryCloudLLMWithFallback(messages, options);
        return { ...cloudResult, mode: 'cloud' };
    }

    return { success: false, error: 'No AI provider available' };
}

/**
 * Try local LLM (Ollama, LM Studio, etc.)
 */
async function tryLocalLLM(messages, options = {}) {
    const providerName = HybridLLMConfig.local.primary;
    const provider = HybridLLMConfig.local.providers[providerName];
    const model = options.model || HybridLLMConfig.local.selectedModel || provider.model;

    try {
        // Try Ollama native API first
        const response = await fetch(`${provider.baseUrl}${provider.apiPath}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: model,
                messages: messages,
                stream: false,
                options: {
                    temperature: options.temperature || 0.7,
                    num_predict: options.maxTokens || 1000
                }
            })
        });

        if (!response.ok) {
            // Try OpenAI-compatible endpoint
            const openaiResponse = await fetch(`${provider.baseUrl}${provider.openaiPath}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: model,
                    messages: messages,
                    temperature: options.temperature || 0.7,
                    max_tokens: options.maxTokens || 1000
                })
            });

            if (!openaiResponse.ok) throw new Error('Local LLM not responding');

            const data = await openaiResponse.json();
            return {
                success: true,
                content: data.choices?.[0]?.message?.content,
                model: model,
                provider: `local-${providerName}`
            };
        }

        const data = await response.json();
        return {
            success: true,
            content: data.message?.content || data.choices?.[0]?.message?.content,
            model: model,
            provider: `local-${providerName}`
        };
    } catch (error) {
        console.log('Local LLM unavailable:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Try cloud providers with automatic fallback
 */
async function tryCloudLLMWithFallback(messages, options = {}) {
    const cloudConfig = HybridLLMConfig.cloud;
    const providerOrder = [cloudConfig.primary, cloudConfig.fallback, 'together', 'gemini'];

    for (const providerName of providerOrder) {
        if (!providerName || !cloudConfig.providers[providerName]) continue;

        const result = await tryCloudProvider(providerName, messages, options);
        if (result.success) return result;
    }

    return { success: false, error: 'All cloud providers failed' };
}

/**
 * Try a specific cloud provider
 */
async function tryCloudProvider(providerName, messages, options = {}) {
    const provider = HybridLLMConfig.cloud.providers[providerName];
    if (!provider) return { success: false, error: `Provider ${providerName} not found` };

    try {
        const apiKey = getApiKey(providerName);

        // Build request based on provider
        let url, headers, body;

        if (providerName === 'gemini') {
            // Gemini has different API format
            url = `${provider.baseUrl}${provider.apiPath}?key=${apiKey}`;
            headers = { 'Content-Type': 'application/json' };
            body = {
                contents: messages.map(m => ({
                    role: m.role === 'assistant' ? 'model' : m.role,
                    parts: [{ text: m.content }]
                }))
            };
        } else {
            // OpenAI-compatible format (OpenRouter, Together, Z.ai, etc.)
            url = `${provider.baseUrl}${provider.apiPath}`;
            headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            };

            // Add provider-specific headers
            if (providerName === 'openrouter') {
                headers['HTTP-Referer'] = options.referer || 'https://cognicore-invoice.app';
                headers['X-Title'] = 'CogniCore Invoice System';
            }

            body = {
                model: provider.model,
                messages: messages,
                temperature: options.temperature || 0.7,
                max_tokens: options.maxTokens || 1000
            };
        }

        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`${providerName} error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();

        // Extract content based on provider format
        let content;
        if (providerName === 'gemini') {
            content = data.candidates?.[0]?.content?.parts?.[0]?.text;
        } else {
            content = data.choices?.[0]?.message?.content;
        }

        return {
            success: true,
            content,
            model: provider.model,
            provider: `cloud-${providerName}`
        };

    } catch (error) {
        console.log(`${providerName} failed:`, error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Get API key for provider (from env or config)
 */
function getApiKey(providerName) {
    // Try environment variables first
    if (typeof process !== 'undefined' && process.env) {
        const envKeys = {
            openrouter: process.env.OPENROUTER_API_KEY,
            zai: process.env.ZAI_API_KEY || process.env.ZHIPU_API_KEY,
            together: process.env.TOGETHER_API_KEY,
            novita: process.env.NOVITA_API_KEY,
            siliconflow: process.env.SILICONFLOW_API_KEY,
            gemini: process.env.GOOGLE_AI_KEY || process.env.GEMINI_API_KEY,
            claude: process.env.ANTHROPIC_API_KEY,
            openai: process.env.OPENAI_API_KEY
        };
        if (envKeys[providerName]) return envKeys[providerName];
    }

    // Try browser localStorage
    if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(`cognicore_api_key_${providerName}`);
        if (stored) return stored;
    }

    // Free tier fallback (no key needed for some providers)
    const freeTierProviders = ['openrouter', 'together', 'siliconflow'];
    if (freeTierProviders.includes(providerName)) {
        return 'FREE_TIER';
    }

    return null;
}

// =============================================================================
// MODEL INSTALLATION HELPER
// =============================================================================

/**
 * Generate installation script for recommended models
 */
function generateInstallScript(recommendations) {
    const lines = [
        '#!/bin/bash',
        '# CogniCore Auto-Generated Model Installation Script',
        `# Profile: ${recommendations.profile?.name}`,
        `# Generated: ${new Date().toISOString()}`,
        '',
        'echo "🚀 Installing recommended AI models..."',
        ''
    ];

    recommendations.installCommands.forEach(cmd => {
        lines.push(`echo "📦 ${cmd}"`);
        lines.push(cmd);
        lines.push('');
    });

    lines.push('echo "✅ All models installed!"');

    return lines.join('\n');
}

/**
 * Generate PowerShell installation script (Windows)
 */
function generatePowerShellScript(recommendations) {
    const lines = [
        '# CogniCore Auto-Generated Model Installation Script',
        `# Profile: ${recommendations.profile?.name}`,
        `# Generated: ${new Date().toISOString()}`,
        '',
        'Write-Host "🚀 Installing recommended AI models..." -ForegroundColor Cyan',
        ''
    ];

    recommendations.installCommands.forEach(cmd => {
        lines.push(`Write-Host "📦 ${cmd}" -ForegroundColor Yellow`);
        lines.push(`& ${cmd.replace('ollama', 'ollama.exe')}`);
        lines.push('');
    });

    lines.push('Write-Host "✅ All models installed!" -ForegroundColor Green');

    return lines.join('\n');
}

// =============================================================================
// EXPORTS
// =============================================================================

// Export for use in main application
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        HybridLLMConfig,
        ModelCatalog,
        HardwareProfiles,
        hybridChatCompletion,
        tryLocalLLM,
        tryCloudLLMWithFallback,
        tryCloudProvider,
        detectHardware,
        getRecommendedModels,
        autoConfigureSystem,
        generateInstallScript,
        generatePowerShellScript
    };
}

// Also expose globally for browser
if (typeof window !== 'undefined') {
    window.HybridLLMConfig = HybridLLMConfig;
    window.ModelCatalog = ModelCatalog;
    window.HardwareProfiles = HardwareProfiles;
    window.hybridChatCompletion = hybridChatCompletion;
    window.detectHardware = detectHardware;
    window.getRecommendedModels = getRecommendedModels;
    window.autoConfigureSystem = autoConfigureSystem;
}

