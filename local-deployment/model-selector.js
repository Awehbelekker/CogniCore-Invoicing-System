/**
 * CogniCore Model Selector - User Count & Requirements Based Selection
 *
 * Automatically scales AI model selection based on:
 * - Number of concurrent users
 * - Task requirements (speed vs quality)
 * - Available hardware resources
 * - Budget constraints (free vs paid providers)
 */

const { ModelCatalog, HardwareProfiles } = require('./local-llm-config.js');

// Task type requirements
const TaskProfiles = {
    // Quick responses - prioritize speed
    chat: {
        name: 'Chat / Quick Response',
        maxLatency: 2000,        // 2 seconds max
        qualityWeight: 0.3,
        speedWeight: 0.7,
        recommendedSizes: ['1B', '3B', '7B'],
        contextNeeded: 4000
    },
    // Invoice generation - needs accuracy
    invoicing: {
        name: 'Invoice Generation',
        maxLatency: 5000,
        qualityWeight: 0.6,
        speedWeight: 0.4,
        recommendedSizes: ['7B', '8B', '9B'],
        contextNeeded: 8000
    },
    // Payment reminders - needs good writing
    reminders: {
        name: 'Payment Reminders',
        maxLatency: 3000,
        qualityWeight: 0.5,
        speedWeight: 0.5,
        recommendedSizes: ['3B', '7B', '8B', '9B'],
        contextNeeded: 4000
    },
    // Document analysis - needs reasoning
    analysis: {
        name: 'Document Analysis',
        maxLatency: 10000,
        qualityWeight: 0.8,
        speedWeight: 0.2,
        recommendedSizes: ['9B', '32B', '70B'],
        contextNeeded: 32000
    },
    // Coding / automation - needs precision
    coding: {
        name: 'Coding / Automation',
        maxLatency: 15000,
        qualityWeight: 0.9,
        speedWeight: 0.1,
        recommendedSizes: ['9B', '32B'],
        contextNeeded: 16000,
        preferGLM: true  // GLM excels at coding
    }
};

// Scaling factors for concurrent users
const UserScaling = {
    // Tokens/second per user (approximate)
    tokensPerUser: 50,

    // RAM overhead per concurrent request (MB)
    ramPerRequest: 500,

    // VRAM overhead for batch processing (GB)
    vramBatchOverhead: 1,

    // Calculate required resources
    calculate: function(userCount, taskProfile) {
        const profile = TaskProfiles[taskProfile] || TaskProfiles.chat;

        return {
            minThroughput: userCount * this.tokensPerUser,
            estimatedRam: userCount * this.ramPerRequest / 1024, // GB
            estimatedVram: Math.ceil(userCount / 3) * this.vramBatchOverhead,
            recommendedParallel: Math.min(userCount, 8),
            taskProfile: profile.name,
            qualityPriority: profile.qualityWeight > 0.5
        };
    }
};

/**
 * Select optimal model based on user count and task
 */
function selectModelForUsers(userCount, taskType = 'chat', hardware = null) {
    const task = TaskProfiles[taskType] || TaskProfiles.chat;
    const scaling = UserScaling.calculate(userCount, taskType);

    // Find models that can handle the load
    const candidates = [];

    for (const [family, models] of Object.entries(ModelCatalog)) {
        for (const [modelId, model] of Object.entries(models)) {
            // Check if model size matches task requirements
            const sizeNum = parseFloat(model.size);
            const sizeStr = model.size;

            // Skip if size doesn't match task
            const sizeMatches = task.recommendedSizes.some(s => sizeStr.includes(s));
            if (!sizeMatches && sizeNum < 70) continue;  // Allow large models regardless

            // Check context window
            if (model.context < task.contextNeeded) continue;

            // Calculate score based on task weights
            const qualityScore = sizeNum * task.qualityWeight;
            const speedScore = (100 / sizeNum) * task.speedWeight;
            let totalScore = qualityScore + speedScore;

            // Bonus for GLM if preferred for task
            if (task.preferGLM && modelId.includes('glm')) {
                totalScore *= 1.3;
            }

            // Bonus for recommended models
            if (model.recommended) {
                totalScore *= 1.2;
            }

            candidates.push({
                id: modelId,
                family,
                ...model,
                score: totalScore,
                scalingInfo: scaling
            });
        }
    }

    // Sort by score
    candidates.sort((a, b) => b.score - a.score);

    // Filter by hardware if provided
    if (hardware) {
        const filtered = candidates.filter(m => {
            if (hardware.vram > 0) {
                return m.vramQ4 <= hardware.vram;
            }
            return m.ramCPU <= hardware.ram;
        });
        if (filtered.length > 0) {
            return { primary: filtered[0], alternatives: filtered.slice(1, 3), scaling };
        }
    }

    return {
        primary: candidates[0],
        alternatives: candidates.slice(1, 3),
        scaling
    };
}

/**
 * Generate full deployment configuration
 */
function generateDeploymentConfig(options = {}) {
    const {
        businessSize = 'small',
        primaryTask = 'invoicing',
        budget = 'free',
        preferLocal = true,
        hardware = null
    } = options;

    const deployment = getBusinessDeployment(businessSize);
    const modelSelection = selectModelForUsers(
        deployment.users,
        primaryTask,
        hardware || { vram: deployment.hardware.vram, ram: deployment.hardware.ram }
    );

    // Determine cloud provider based on budget
    let cloudProvider;
    if (budget === 'free') {
        cloudProvider = 'openrouter';  // Free GLM
    } else if (budget === 'low') {
        cloudProvider = 'together';    // Cheap
    } else {
        cloudProvider = 'zai';         // Best quality GLM
    }

    return {
        deployment: deployment.name,
        concurrentUsers: deployment.users,
        hardware: deployment.hardware,
        primaryModel: modelSelection.primary,
        alternativeModels: modelSelection.alternatives,
        scaling: modelSelection.scaling,
        mode: preferLocal ? 'auto' : 'cloud',
        cloudProvider,
        cloudFallback: deployment.cloudFallback,
        estimatedCost: deployment.estimatedCost,

        // Docker compose profile to use
        dockerProfile: getDockerProfile(deployment.hardware),

        // Ollama config
        ollamaConfig: {
            numParallel: modelSelection.scaling.recommendedParallel,
            keepAlive: '24h',
            model: modelSelection.primary?.ollamaName || 'glm4'
        },

        // Installation commands
        installCommands: [
            `ollama pull ${modelSelection.primary?.ollamaName || 'glm4'}`,
            ...modelSelection.alternatives.slice(0, 2).map(m => `ollama pull ${m.ollamaName}`)
        ]
    };
}

/**
 * Get appropriate Docker compose profile
 */
function getDockerProfile(hardwareProfile) {
    if (hardwareProfile === HardwareProfiles.enterprise) {
        return 'enterprise';
    } else if (hardwareProfile === HardwareProfiles.professional) {
        return 'glm';
    } else if (hardwareProfile === HardwareProfiles.minimal) {
        return 'lite';
    }
    return 'default';
}

/**
 * Print deployment recommendation
 */
function printDeploymentRecommendation(config) {
    console.log('\n' + '═'.repeat(60));
    console.log('  📊 DEPLOYMENT RECOMMENDATION');
    console.log('═'.repeat(60));
    console.log(`
  Business Type:      ${config.deployment}
  Concurrent Users:   ${config.concurrentUsers}
  Estimated Cost:     ${config.estimatedCost}

  Primary Model:      ${config.primaryModel?.name || 'N/A'}
  Model ID:           ${config.primaryModel?.ollamaName || 'N/A'}
  VRAM Required:      ~${config.primaryModel?.vramQ4 || 0} GB (Q4 quantization)

  Docker Profile:     ${config.dockerProfile}
  Cloud Fallback:     ${config.cloudFallback ? 'Enabled' : 'Disabled'}
  Cloud Provider:     ${config.cloudProvider}

  Ollama Settings:
    - Parallel:       ${config.ollamaConfig.numParallel}
    - Keep Alive:     ${config.ollamaConfig.keepAlive}
    - Model:          ${config.ollamaConfig.model}

  Installation:
${config.installCommands.map(c => `    ${c}`).join('\n')}
`);
    console.log('═'.repeat(60) + '\n');
}

// CLI support
if (typeof require !== 'undefined' && require.main === module) {
    const args = process.argv.slice(2);
    const businessSize = args[0] || 'small';
    const primaryTask = args[1] || 'invoicing';

    console.log('\n🤖 CogniCore Model Selector - v2.0');
    console.log('Generating deployment recommendation...\n');

    const config = generateDeploymentConfig({
        businessSize,
        primaryTask,
        budget: 'free',
        preferLocal: true
    });

    printDeploymentRecommendation(config);
}

// Exports
module.exports = {
    TaskProfiles,
    UserScaling,
    selectModelForUsers,
    getBusinessDeployment,
    generateDeploymentConfig,
    printDeploymentRecommendation
};

