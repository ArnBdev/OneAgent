/**
 * Gemini Model Switcher Utility - Enhanced with Tier System
 * Intelligently switch between different Gemini models with tier-based optimization
 */

import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { GeminiClient } from '../coreagent/tools/geminiClient';
import { 
  GEMINI_MODEL_REGISTRY, 
  getRecommendedModel, 
  QUICK_REFERENCE, 
  GeminiModelSpec,
  getModelByTier,
  getModelForAgentType,
  getModelForTask,
  TIER_SYSTEM_GUIDE
} from './gemini-model-registry';
import { 
  ModelTierSelector, 
  ModelSelectionCriteria, 
  modelSelector 
} from './gemini-model-tier-selector';

dotenv.config();

export class GeminiModelSwitcher {
  private envPath: string;
  private tierSelector: ModelTierSelector;
  
  constructor() {
    this.envPath = path.join(process.cwd(), '.env');
    this.tierSelector = ModelTierSelector.getInstance();
  }

  /**
   * Switch to a specific model by updating .env file
   */
  async switchToModel(modelName: string): Promise<void> {
    const modelSpec = GEMINI_MODEL_REGISTRY[modelName];
    if (!modelSpec) {
      throw new Error(`Model '${modelName}' not found in registry. Available models: ${Object.keys(GEMINI_MODEL_REGISTRY).join(', ')}`);
    }

    console.log(`🔄 Switching to model: ${modelName}`);
    console.log(`📝 Description: ${modelSpec.description}`);
    console.log(`🏷️  Status: ${modelSpec.status}`);
    console.log(`💰 Tier: ${modelSpec.tier} (Model Tier: ${modelSpec.modelTier})`);
    console.log(`🎯 Optimized for: ${Object.entries(modelSpec.taskOptimization)
      .filter(([_, level]) => level === 'excellent')
      .map(([task]) => task)
      .join(', ') || 'balanced performance'}`);
    
    if (modelSpec.rateLimits.free) {
      console.log(`⚡ Free tier limits: ${modelSpec.rateLimits.free.rpm} RPM, ${modelSpec.rateLimits.free.requestsPerDay} req/day`);
    }
    if (modelSpec.rateLimits.paid) {
      console.log(`💎 Paid tier limits: ${modelSpec.rateLimits.paid.rpm} RPM`);
    }

    await this.updateEnvFile(modelName);
    console.log('✅ Model switched successfully!');
  }

  /**
   * Switch to recommended model for use case
   */
  async switchToRecommended(useCase: 'production' | 'development' | 'high-volume' | 'premium' | 'experimental'): Promise<string> {
    const recommendedModel = getRecommendedModel(useCase);
    await this.switchToModel(recommendedModel);
    return recommendedModel;
  }

  /**
   * NEW: Switch using intelligent tier-based selection
   */
  async switchWithCriteria(criteria: ModelSelectionCriteria): Promise<{ model: string; reasoning: string }> {
    const selection = this.tierSelector.selectOptimalModel(criteria);
    
    console.log('🧠 Intelligent Model Selection:');
    console.log(`   Primary: ${selection.primaryModel} (${selection.tier} tier)`);
    console.log(`   Reasoning: ${selection.reasoning}`);
    console.log(`   Cost: $${selection.estimatedCostPer1M.input}/$${selection.estimatedCostPer1M.output} per 1M tokens`);
    console.log(`   Fallbacks: ${selection.fallbackModels.join(', ')}`);
    
    await this.switchToModel(selection.primaryModel);
    return { model: selection.primaryModel, reasoning: selection.reasoning };
  }

  /**
   * NEW: Switch to optimal model for specific agent type
   */
  async switchForAgent(agentType: string, prioritizeCost: boolean = false): Promise<string> {
    const selection = this.tierSelector.selectForAgent(agentType, prioritizeCost);
    
    console.log(`🤖 Optimizing for agent: ${agentType}`);
    console.log(`   Selected: ${selection.primaryModel} (${selection.tier} tier)`);
    console.log(`   Cost optimization: ${prioritizeCost ? 'enabled' : 'disabled'}`);
    
    await this.switchToModel(selection.primaryModel);
    return selection.primaryModel;
  }

  /**
   * NEW: Switch to optimal model for specific task type
   */
  async switchForTask(taskType: string, expectedVolume: 'low' | 'medium' | 'high' | 'ultra-high' = 'medium'): Promise<string> {
    const selection = this.tierSelector.selectForTask(taskType, expectedVolume);
    
    console.log(`📋 Optimizing for task: ${taskType} (${expectedVolume} volume)`);
    console.log(`   Selected: ${selection.primaryModel} (${selection.tier} tier)`);
    
    await this.switchToModel(selection.primaryModel);
    return selection.primaryModel;
  }

  /**
   * NEW: Switch to tier-optimized model
   */
  async switchToTier(tier: 'economy' | 'standard' | 'premium'): Promise<string> {
    const model = getModelByTier(tier);
    
    console.log(`🎚️  Switching to ${tier.toUpperCase()} tier`);
    console.log(`   Model: ${model}`);
    console.log(`   Guide: ${JSON.stringify(TIER_SYSTEM_GUIDE[tier.toUpperCase() as keyof typeof TIER_SYSTEM_GUIDE], null, 2)}`);
    
    await this.switchToModel(model);
    return model;
  }

  /**
   * Test a model to see if it works
   */
  async testModel(modelName: string, testPrompt: string = 'Hello! Please respond with just "Working" if you can read this.'): Promise<boolean> {
    try {
      const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
      if (!apiKey) {
        throw new Error('No API key found in environment');
      }

      const gemini = new GeminiClient({
        apiKey: apiKey,
        model: modelName
      });

      console.log(`🧪 Testing model: ${modelName}`);
      
      const response = await gemini.chat(testPrompt, {
        maxTokens: 20,
        temperature: 0.1
      });

      // Check if we got a real response or mock fallback
      const isRealResponse = !response.response.includes('experiencing API rate limits') && 
                            !response.response.includes('OneAgent\'s AI assistant');

      if (isRealResponse) {
        console.log(`✅ ${modelName}: Working - "${response.response.substring(0, 50)}..."`);
        return true;
      } else {
        console.log(`❌ ${modelName}: Rate limited or unavailable`);
        return false;
      }

    } catch (error: any) {
      if (error.code === 429) {
        console.log(`❌ ${modelName}: Rate limited (429)`);
      } else if (error.code === 400) {
        console.log(`❌ ${modelName}: Bad request (400) - possibly unavailable`);
      } else if (error.code === 404) {
        console.log(`❌ ${modelName}: Not found (404)`);
      } else {
        console.log(`❌ ${modelName}: Error ${error.code || 'unknown'} - ${error.message}`);
      }
      return false;
    }
  }

  /**
   * Test all available models and return working ones
   */
  async findWorkingModels(): Promise<string[]> {
    console.log('🔬 Testing all available models...');
    console.log('==================================');
    
    const workingModels: string[] = [];
    const modelNames = Object.keys(GEMINI_MODEL_REGISTRY);
    
    for (const modelName of modelNames) {
      const isWorking = await this.testModel(modelName);
      if (isWorking) {
        workingModels.push(modelName);
      }
      
      // Add delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('\n📊 RESULTS:');
    console.log('==========');
    
    if (workingModels.length > 0) {
      console.log('✅ Working models:');
      workingModels.forEach(model => {
        const spec = GEMINI_MODEL_REGISTRY[model];
        console.log(`   - ${model} (${spec.status}, ${spec.tier} tier)`);
      });
    } else {
      console.log('❌ No models are working');
    }

    return workingModels;
  }

  /**
   * Get current model from .env file
   */
  getCurrentModel(): string {
    return process.env.GOOGLE_MODEL || 'gemini-1.5-flash';
  }
  /**
   * NEW: List models by tier with enhanced information
   */
  listModelsByTier(): void {
    console.log('🎚️  Gemini Models by Tier System:');
    console.log('==================================');
    
    const tiers: Array<'economy' | 'standard' | 'premium'> = ['economy', 'standard', 'premium'];
    
    tiers.forEach(tier => {
      console.log(`\n${tier.toUpperCase()} TIER:`);
      console.log(`${TIER_SYSTEM_GUIDE[tier.toUpperCase() as keyof typeof TIER_SYSTEM_GUIDE].cost}`);
      console.log(`${TIER_SYSTEM_GUIDE[tier.toUpperCase() as keyof typeof TIER_SYSTEM_GUIDE].bestFor}`);
      console.log('---');
      
      const tierModels = Object.entries(GEMINI_MODEL_REGISTRY)
        .filter(([_, spec]) => spec.modelTier === tier);
      
      tierModels.forEach(([name, spec]) => {
        console.log(`  🤖 ${name}`);
        console.log(`     ${spec.description}`);
        console.log(`     Status: ${spec.status} | Pricing: $${spec.pricing.inputPer1M}/$${spec.pricing.outputPer1M} per 1M`);
        console.log(`     Optimized for: ${Object.entries(spec.taskOptimization)
          .filter(([_, level]) => level === 'excellent')
          .map(([task]) => task)
          .join(', ') || 'balanced'}`);
      });
    });
  }

  /**
   * List all available models with details
   */
  listModels(): void {
    console.log('📋 Available Gemini Models:');
    console.log('===========================');
    
    Object.entries(GEMINI_MODEL_REGISTRY).forEach(([name, spec]) => {
      console.log(`\n🤖 ${name}`);
      console.log(`   Description: ${spec.description}`);
      console.log(`   Status: ${spec.status}`);
      console.log(`   Tier: ${spec.tier}`);
      console.log(`   Knowledge cutoff: ${spec.knowledgeCutoff}`);
      
      if (spec.rateLimits.free) {
        console.log(`   Free limits: ${spec.rateLimits.free.rpm} RPM, ${spec.rateLimits.free.requestsPerDay} req/day`);
      }
      
      if (spec.pricing.inputPer1M) {
        console.log(`   Pricing: $${spec.pricing.inputPer1M} input, $${spec.pricing.outputPer1M} output (per 1M tokens)`);
      }
    });

    console.log('\n🚀 Quick Reference:');
    console.log('==================');
    Object.entries(QUICK_REFERENCE).forEach(([use, model]) => {
      console.log(`   ${use}: ${model}`);
    });
  }

  /**
   * Update .env file with new model
   */
  private async updateEnvFile(modelName: string): Promise<void> {
    try {
      let envContent = fs.readFileSync(this.envPath, 'utf8');
      
      // Update GOOGLE_MODEL line
      const modelRegex = /^GOOGLE_MODEL=.*$/m;
      if (modelRegex.test(envContent)) {
        envContent = envContent.replace(modelRegex, `GOOGLE_MODEL=${modelName}`);
      } else {
        envContent += `\nGOOGLE_MODEL=${modelName}\n`;
      }
      
      fs.writeFileSync(this.envPath, envContent);
      
      // Reload environment variables
      delete require.cache[require.resolve('dotenv')];
      dotenv.config();
      
    } catch (error: any) {
      throw new Error(`Failed to update .env file: ${error.message}`);
    }
  }
}

// CLI usage when run directly
if (require.main === module) {
  const switcher = new GeminiModelSwitcher();
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('🔧 Gemini Model Switcher - Enhanced with Tier System');
    console.log('====================================================');
    console.log('Usage:');
    console.log('Basic Commands:');
    console.log('  npx ts-node config/gemini-model-switcher.ts list');
    console.log('  npx ts-node config/gemini-model-switcher.ts test [model-name]');
    console.log('  npx ts-node config/gemini-model-switcher.ts switch [model-name]');
    console.log('  npx ts-node config/gemini-model-switcher.ts recommend [use-case]');
    console.log('  npx ts-node config/gemini-model-switcher.ts find-working');
    console.log('');
    console.log('NEW: Tier System Commands:');
    console.log('  npx ts-node config/gemini-model-switcher.ts tiers         # List models by tier');
    console.log('  npx ts-node config/gemini-model-switcher.ts tier [economy|standard|premium]');
    console.log('  npx ts-node config/gemini-model-switcher.ts agent [agent-type] [--cost]');
    console.log('  npx ts-node config/gemini-model-switcher.ts task [task-type] [volume]');
    console.log('');
    console.log('Examples:');
    console.log('  npx ts-node config/gemini-model-switcher.ts tier economy');
    console.log('  npx ts-node config/gemini-model-switcher.ts agent DevAgent');
    console.log('  npx ts-node config/gemini-model-switcher.ts task coding');
    console.log('');
    console.log('Current model:', switcher.getCurrentModel());
    process.exit(0);
  }
  
  const command = args[0];
  
  (async () => {
    try {
      switch (command) {
        case 'list':
          switcher.listModels();
          break;
          
        case 'tiers':
          switcher.listModelsByTier();
          break;
          
        case 'tier':
          if (args[1] && ['economy', 'standard', 'premium'].includes(args[1])) {
            const model = await switcher.switchToTier(args[1] as 'economy' | 'standard' | 'premium');
            console.log(`Switched to ${args[1]} tier: ${model}`);
          } else {
            console.log('Please specify tier: economy, standard, or premium');
          }
          break;
          
        case 'agent':
          if (args[1]) {
            const prioritizeCost = args.includes('--cost');
            const model = await switcher.switchForAgent(args[1], prioritizeCost);
            console.log(`Switched to optimal model for ${args[1]}: ${model}`);
          } else {
            console.log('Please specify agent type (e.g., DevAgent, TriageAgent, BulkProcessingAgent)');
          }
          break;
          
        case 'task':
          if (args[1]) {
            const volume = (args[2] as 'low' | 'medium' | 'high' | 'ultra-high') || 'medium';
            const model = await switcher.switchForTask(args[1], volume);
            console.log(`Switched to optimal model for ${args[1]} (${volume} volume): ${model}`);
          } else {
            console.log('Please specify task type (e.g., coding, bulk-processing, analysis)');
          }
          break;
          
        case 'test':
          if (args[1]) {
            await switcher.testModel(args[1]);
          } else {
            console.log('Please specify a model name to test');
          }
          break;
          
        case 'switch':
          if (args[1]) {
            await switcher.switchToModel(args[1]);
          } else {
            console.log('Please specify a model name to switch to');
          }
          break;
          
        case 'recommend':
          if (args[1]) {
            const useCase = args[1] as any;
            const model = await switcher.switchToRecommended(useCase);
            console.log(`Switched to recommended model for '${useCase}': ${model}`);
          } else {
            console.log('Please specify use case: production, development, high-volume, premium, or experimental');
          }
          break;
          
        case 'find-working':
          await switcher.findWorkingModels();
          break;
          
        default:
          console.log('Unknown command:', command);
          console.log('Run without arguments for usage help');
      }
    } catch (error: any) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  })();
}
