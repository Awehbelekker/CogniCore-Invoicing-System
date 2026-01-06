#!/usr/bin/env node
/**
 * CogniCore Hardware Detection & Model Recommendation CLI
 *
 * Automatically detects system hardware and recommends optimal AI models
 *
 * Usage:
 *   node hardware-detector.js              # Auto-detect and recommend
 *   node hardware-detector.js --users 10   # Recommend for 10 concurrent users
 *   node hardware-detector.js --install    # Auto-install recommended models
 */

const os = require('os');
const { execSync, spawn } = require('child_process');
const { HybridLLMConfig, ModelCatalog, HardwareProfiles, getRecommendedModels, generateInstallScript, generatePowerShellScript } = require('./local-llm-config.js');

// ANSI color codes for terminal output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

function log(color, emoji, message) {
    console.log(`${colors[color]}${emoji} ${message}${colors.reset}`);
}

/**
 * Detect system hardware specs
 */
async function detectSystemHardware() {
    log('cyan', '🔍', 'Detecting system hardware...\n');

    const hardware = {
        platform: os.platform(),
        arch: os.arch(),
        hostname: os.hostname(),
        ram: Math.round(os.totalmem() / (1024 * 1024 * 1024)),
        freeRam: Math.round(os.freemem() / (1024 * 1024 * 1024)),
        cpu: {
            model: os.cpus()[0]?.model || 'Unknown',
            cores: os.cpus().length,
            speed: os.cpus()[0]?.speed || 0
        },
        gpu: null,
        vram: 0
    };

    // Detect GPU
    hardware.gpu = await detectGPU();
    hardware.vram = hardware.gpu?.vram || 0;

    return hardware;
}

/**
 * Detect GPU and VRAM
 */
async function detectGPU() {
    // Try NVIDIA first
    try {
        const nvidiaSmi = execSync('nvidia-smi --query-gpu=name,memory.total,memory.free --format=csv,noheader,nounits',
            { encoding: 'utf8', timeout: 10000 });
        const lines = nvidiaSmi.trim().split('\n');
        const gpus = lines.map(line => {
            const [name, totalMem, freeMem] = line.split(',').map(s => s.trim());
            return {
                vendor: 'NVIDIA',
                name: name,
                vram: Math.round(parseInt(totalMem) / 1024),
                freeVram: Math.round(parseInt(freeMem) / 1024)
            };
        });
        return gpus[0]; // Return primary GPU
    } catch (e) {
        // No NVIDIA GPU
    }

    // Try AMD (ROCm)
    try {
        const rocmSmi = execSync('rocm-smi --showmeminfo vram --csv', { encoding: 'utf8', timeout: 10000 });
        // Parse ROCm output (format varies)
        if (rocmSmi.includes('GPU')) {
            return { vendor: 'AMD', name: 'AMD GPU', vram: 8 }; // Estimate
        }
    } catch (e) {
        // No AMD GPU
    }

    // Try Intel (Windows)
    if (os.platform() === 'win32') {
        try {
            const wmic = execSync('wmic path win32_videocontroller get name,adapterram /format:csv',
                { encoding: 'utf8', timeout: 10000 });
            const lines = wmic.trim().split('\n').slice(1);
            for (const line of lines) {
                const [, name, adapterRam] = line.split(',');
                if (name && adapterRam) {
                    const vram = Math.round(parseInt(adapterRam) / (1024 * 1024 * 1024));
                    if (vram > 0) {
                        return {
                            vendor: name.includes('NVIDIA') ? 'NVIDIA' :
                                    name.includes('AMD') ? 'AMD' :
                                    name.includes('Intel') ? 'Intel' : 'Unknown',
                            name: name.trim(),
                            vram: vram
                        };
                    }
                }
            }
        } catch (e) {
            // WMIC failed
        }
    }

    // macOS - Check for Apple Silicon
    if (os.platform() === 'darwin') {
        try {
            const sysctl = execSync('sysctl -n machdep.cpu.brand_string', { encoding: 'utf8' });
            if (sysctl.includes('Apple')) {
                // Apple Silicon uses unified memory
                const totalRam = Math.round(os.totalmem() / (1024 * 1024 * 1024));
                return {
                    vendor: 'Apple',
                    name: 'Apple Silicon (Unified Memory)',
                    vram: Math.round(totalRam * 0.75), // GPU can use ~75% of unified memory
                    unified: true
                };
            }
        } catch (e) {}
    }

    return null;
}

/**
 * Print hardware summary
 */
function printHardwareSummary(hardware) {
    console.log('\n' + '═'.repeat(60));
    log('bright', '💻', 'SYSTEM HARDWARE SUMMARY');
    console.log('═'.repeat(60) + '\n');

    console.log(`  Platform:    ${hardware.platform} (${hardware.arch})`);
    console.log(`  Hostname:    ${hardware.hostname}`);
    console.log(`  CPU:         ${hardware.cpu.model}`);
    console.log(`  CPU Cores:   ${hardware.cpu.cores}`);
    console.log(`  RAM:         ${hardware.ram} GB (${hardware.freeRam} GB free)`);

    if (hardware.gpu) {
        console.log(`  GPU:         ${hardware.gpu.name}`);
        console.log(`  VRAM:        ${hardware.gpu.vram} GB${hardware.gpu.freeVram ? ` (${hardware.gpu.freeVram} GB free)` : ''}`);
        if (hardware.gpu.unified) {
            console.log(`               (Unified Memory - shared with system RAM)`);
        }
    } else {
        log('yellow', '  GPU:', 'Not detected (will use CPU inference)');
    }

    console.log();
}

/**
 * Print model recommendations
 */
function printRecommendations(recommendations, userCount) {
    console.log('═'.repeat(60));
    log('bright', '🎯', `MODEL RECOMMENDATIONS (for ${userCount} user${userCount > 1 ? 's' : ''})`);
    console.log('═'.repeat(60) + '\n');

    console.log(`  Profile:       ${recommendations.profile?.name || 'Unknown'}`);
    console.log(`  Description:   ${recommendations.profile?.description || 'N/A'}`);
    console.log(`  Quantization:  ${recommendations.quantization}`);
    console.log(`  Max Concurrent: ${recommendations.profile?.concurrentRequests || 1} requests`);
    console.log();

    if (recommendations.primary) {
        log('green', '  ⭐ PRIMARY:', `${recommendations.primary.name}`);
        console.log(`     Model ID:   ${recommendations.primary.ollamaName}`);
        console.log(`     Size:       ${recommendations.primary.size} parameters`);
        console.log(`     VRAM:       ~${recommendations.primary.vramNeeded} GB (${recommendations.primary.type.toUpperCase()})`);
        console.log(`     Strengths:  ${recommendations.primary.strengths?.join(', ')}`);
        console.log();
    }

    if (recommendations.alternatives?.length > 0) {
        log('blue', '  📋 ALTERNATIVES:', '');
        recommendations.alternatives.forEach((alt, i) => {
            console.log(`     ${i + 1}. ${alt.name} (${alt.ollamaName}) - ${alt.vramNeeded} GB`);
        });
        console.log();
    }

    if (recommendations.warnings?.length > 0) {
        log('yellow', '  ⚠️  WARNINGS:', '');
        recommendations.warnings.forEach(w => console.log(`     • ${w}`));
        console.log();
    }

    console.log('═'.repeat(60));
    log('bright', '📦', 'INSTALLATION COMMANDS');
    console.log('═'.repeat(60) + '\n');

    recommendations.installCommands.forEach(cmd => {
        console.log(`  ${colors.cyan}${cmd}${colors.reset}`);
    });
    console.log();
}

/**
 * Install recommended models via Ollama
 */
async function installModels(recommendations) {
    log('cyan', '\n🚀', 'Starting model installation...\n');

    for (const cmd of recommendations.installCommands) {
        const modelName = cmd.replace('ollama pull ', '');
        log('yellow', '📦', `Installing ${modelName}...`);

        try {
            // Use spawn for better output handling
            await new Promise((resolve, reject) => {
                const proc = spawn('ollama', ['pull', modelName], {
                    stdio: 'inherit',
                    shell: true
                });
                proc.on('close', (code) => {
                    if (code === 0) {
                        log('green', '✅', `${modelName} installed successfully`);
                        resolve();
                    } else {
                        log('red', '❌', `Failed to install ${modelName} (exit code: ${code})`);
                        resolve(); // Continue with other models
                    }
                });
                proc.on('error', (err) => {
                    log('red', '❌', `Error installing ${modelName}: ${err.message}`);
                    resolve();
                });
            });
        } catch (e) {
            log('red', '❌', `Error: ${e.message}`);
        }
    }

    log('green', '\n✅', 'Installation complete!\n');
}

/**
 * Check if Ollama is installed and running
 */
async function checkOllama() {
    try {
        execSync('ollama --version', { encoding: 'utf8', timeout: 5000 });
        return { installed: true };
    } catch (e) {
        return { installed: false, error: e.message };
    }
}

/**
 * Main CLI entry point
 */
async function main() {
    console.log('\n' + colors.bright + colors.cyan);
    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║       CogniCore Hardware Detection & Model Selector      ║');
    console.log('║                    Version 2.0 with GLM                  ║');
    console.log('╚══════════════════════════════════════════════════════════╝');
    console.log(colors.reset);

    // Parse command line arguments
    const args = process.argv.slice(2);
    let userCount = 1;
    let doInstall = false;
    let generateScript = false;

    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--users' || args[i] === '-u') {
            userCount = parseInt(args[i + 1]) || 1;
            i++;
        } else if (args[i] === '--install' || args[i] === '-i') {
            doInstall = true;
        } else if (args[i] === '--script' || args[i] === '-s') {
            generateScript = true;
        } else if (args[i] === '--help' || args[i] === '-h') {
            console.log(`
Usage: node hardware-detector.js [options]

Options:
  --users, -u <n>    Number of expected concurrent users (default: 1)
  --install, -i      Automatically install recommended models
  --script, -s       Generate installation script
  --help, -h         Show this help message

Examples:
  node hardware-detector.js                    # Auto-detect and recommend
  node hardware-detector.js --users 10         # Recommend for 10 users
  node hardware-detector.js --users 5 --install  # Install for 5 users
`);
            process.exit(0);
        }
    }

    // Detect hardware
    const hardware = await detectSystemHardware();
    printHardwareSummary(hardware);

    // Get recommendations
    const recommendations = getRecommendedModels(hardware, userCount);
    printRecommendations(recommendations, userCount);

    // Check Ollama
    const ollamaStatus = await checkOllama();
    if (!ollamaStatus.installed) {
        log('yellow', '⚠️', 'Ollama not found. Install from: https://ollama.ai/download');
        console.log();
    }

    // Generate script if requested
    if (generateScript) {
        console.log('═'.repeat(60));
        log('bright', '📜', 'INSTALLATION SCRIPT');
        console.log('═'.repeat(60) + '\n');

        if (os.platform() === 'win32') {
            console.log(generatePowerShellScript(recommendations));
        } else {
            console.log(generateInstallScript(recommendations));
        }
        console.log();
    }

    // Install if requested
    if (doInstall) {
        if (!ollamaStatus.installed) {
            log('red', '❌', 'Cannot install models - Ollama is not installed');
            process.exit(1);
        }
        await installModels(recommendations);
    }

    // Print next steps
    console.log('═'.repeat(60));
    log('bright', '📝', 'NEXT STEPS');
    console.log('═'.repeat(60) + '\n');
    console.log('  1. Install Ollama: https://ollama.ai/download');
    console.log('  2. Run: ollama serve');
    console.log(`  3. Install model: ${recommendations.installCommands[0] || 'ollama pull glm4'}`);
    console.log('  4. Start CogniCore Invoice System');
    console.log('  5. AI will auto-connect to your local model!\n');
}

// Run if executed directly
if (require.main === module) {
    main().catch(err => {
        console.error('Error:', err);
        process.exit(1);
    });
}

module.exports = { detectSystemHardware, detectGPU, printHardwareSummary, printRecommendations };

