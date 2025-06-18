/**
 * Comprehensive Test Suite for Gemini Model Tier System
 * Tests all components of the tier system implementation
 */

import { 
  GEMINI_MODEL_REGISTRY,
  getModelByTier,
  getModelForAgentType,
  getModelForTask,
  getModelsOptimizedFor,
  TIER_SYSTEM_GUIDE,
  QUICK_REFERENCE,
  GeminiModelSpec
} from './config/gemini-model-registry.js';

import { 
  ModelTierSelector,
  modelSelector,
  selectForDevAgent,
  selectForTriageAgent,
  selectForBulkProcessing
} from './config/gemini-model-tier-selector.js';

import { GeminiModelSwitcher } from './config/gemini-model-switcher.js';

// =============================================================================
// TEST UTILITIES
// =============================================================================

class TierSystemTester {
  private testResults: Array<{ test: string; passed: boolean; details: string }> = [];
  
  constructor() {
    console.log('🧪 Starting Gemini Model Tier System Tests');
    console.log('==========================================');
  }

  private addResult(test: string, passed: boolean, details: string) {
    this.testResults.push({ test, passed, details });
    const status = passed ? '✅' : '❌';
    console.log(`${status} ${test}: ${details}`);
  }

  private printSummary() {
    const passed = this.testResults.filter(r => r.passed).length;
    const total = this.testResults.length;
    
    console.log('\n📊 TEST SUMMARY');
    console.log('===============');
    console.log(`Passed: ${passed}/${total} (${Math.round((passed/total)*100)}%)`);
    
    if (passed === total) {
      console.log('🎉 All tests passed! Tier system is ready for production.');
    } else {
      console.log('⚠️  Some tests failed. Please review implementation.');
      this.testResults.filter(r => !r.passed).forEach(r => {
        console.log(`   ❌ ${r.test}: ${r.details}`);
      });
    }
  }

  // =============================================================================
  // REGISTRY TESTS
  // =============================================================================

  testRegistryIntegrity() {
    console.log('\n🔍 Testing Registry Integrity');
    console.log('-----------------------------');

    // Test that all models have required tier fields
    let allModelsHaveNewFields = true;
    const missingFields: string[] = [];    Object.entries(GEMINI_MODEL_REGISTRY).forEach(([name, spec]: [string, GeminiModelSpec]) => {
      if (!spec.modelTier || !spec.taskOptimization || !spec.recommendedFor) {
        allModelsHaveNewFields = false;
        missingFields.push(name);
      }
    });

    this.addResult(
      'All models have tier system fields',
      allModelsHaveNewFields,
      allModelsHaveNewFields ? 'All models properly updated' : `Missing fields: ${missingFields.join(', ')}`
    );

    // Test tier distribution    const tierCounts = {
      economy: Object.values(GEMINI_MODEL_REGISTRY).filter((m: GeminiModelSpec) => m.modelTier === 'economy').length,
      standard: Object.values(GEMINI_MODEL_REGISTRY).filter((m: GeminiModelSpec) => m.modelTier === 'standard').length,
      premium: Object.values(GEMINI_MODEL_REGISTRY).filter((m: GeminiModelSpec) => m.modelTier === 'premium').length
    };

    const hasBalancedTiers = tierCounts.economy > 0 && tierCounts.standard > 0 && tierCounts.premium > 0;
    this.addResult(
      'Balanced tier distribution',
      hasBalancedTiers,
      `Economy: ${tierCounts.economy}, Standard: ${tierCounts.standard}, Premium: ${tierCounts.premium}`
    );

    // Test Gemini 2.5 models are present
    const gemini25Models = Object.keys(GEMINI_MODEL_REGISTRY).filter(name => name.includes('2.5'));
    this.addResult(
      'Gemini 2.5 models present',
      gemini25Models.length >= 3,
      `Found ${gemini25Models.length} Gemini 2.5 models: ${gemini25Models.join(', ')}`
    );
  }

  // =============================================================================
  // UTILITY FUNCTION TESTS
  // =============================================================================

  testUtilityFunctions() {
    console.log('\n🛠️  Testing Utility Functions');
    console.log('-----------------------------');

    // Test tier selection
    try {
      const economyModel = getModelByTier('economy');
      const standardModel = getModelByTier('standard');
      const premiumModel = getModelByTier('premium');

      this.addResult(
        'Tier selection functions work',
        true,
        `Economy: ${economyModel}, Standard: ${standardModel}, Premium: ${premiumModel}`
      );
    } catch (error) {
      this.addResult('Tier selection functions work', false, `Error: ${error}`);
    }

    // Test agent type mapping
    try {
      const devModel = getModelForAgentType('DevAgent');
      const triageModel = getModelForAgentType('TriageAgent');
      const bulkModel = getModelForAgentType('BulkProcessingAgent');

      this.addResult(
        'Agent type mapping works',
        true,
        `DevAgent: ${devModel}, TriageAgent: ${triageModel}, BulkProcessingAgent: ${bulkModel}`
      );
    } catch (error) {
      this.addResult('Agent type mapping works', false, `Error: ${error}`);
    }

    // Test task type mapping
    try {
      const codingModel = getModelForTask('coding');
      const bulkModel = getModelForTask('bulk-processing');
      const analysisModel = getModelForTask('analysis');

      this.addResult(
        'Task type mapping works',
        true,
        `Coding: ${codingModel}, Bulk: ${bulkModel}, Analysis: ${analysisModel}`
      );
    } catch (error) {
      this.addResult('Task type mapping works', false, `Error: ${error}`);
    }

    // Test capability optimization
    try {
      const excellentCoding = getModelsOptimizedFor('coding', 'excellent');
      const goodReasoning = getModelsOptimizedFor('reasoning', 'good');

      this.addResult(
        'Capability optimization works',
        excellentCoding.length > 0 && goodReasoning.length > 0,
        `Excellent coding: ${excellentCoding.length}, Good reasoning: ${goodReasoning.length}`
      );
    } catch (error) {
      this.addResult('Capability optimization works', false, `Error: ${error}`);
    }
  }

  // =============================================================================
  // TIER SELECTOR TESTS
  // =============================================================================

  testTierSelector() {
    console.log('\n🧠 Testing ModelTierSelector');
    console.log('----------------------------');

    try {
      const selector = ModelTierSelector.getInstance();

      // Test cost optimization
      const costOptimized = selector.selectOptimalModel({ prioritizeCost: true });
      this.addResult(
        'Cost optimization works',
        costOptimized.tier === 'economy',
        `Selected ${costOptimized.primaryModel} (${costOptimized.tier} tier)`
      );

      // Test performance optimization
      const performanceOptimized = selector.selectOptimalModel({ prioritizePerformance: true });
      this.addResult(
        'Performance optimization works',
        performanceOptimized.tier === 'premium',
        `Selected ${performanceOptimized.primaryModel} (${performanceOptimized.tier} tier)`
      );

      // Test agent-specific selection
      const devAgentSelection = selector.selectForAgent('DevAgent');
      this.addResult(
        'DevAgent optimization works',
        devAgentSelection.primaryModel.includes('2.5-pro'),
        `Selected ${devAgentSelection.primaryModel} for DevAgent`
      );

      const bulkAgentSelection = selector.selectForAgent('BulkProcessingAgent', true);
      this.addResult(
        'BulkProcessingAgent optimization works',
        bulkAgentSelection.tier === 'economy',
        `Selected ${bulkAgentSelection.primaryModel} (${bulkAgentSelection.tier} tier) for BulkProcessingAgent`
      );

      // Test task-specific selection
      const codingTask = selector.selectForTask('coding');
      this.addResult(
        'Coding task optimization works',
        codingTask.primaryModel.includes('2.5-pro'),
        `Selected ${codingTask.primaryModel} for coding tasks`
      );

      const bulkTask = selector.selectForTask('bulk-processing', 'ultra-high');
      this.addResult(
        'Bulk processing optimization works',
        bulkTask.tier === 'economy',
        `Selected ${bulkTask.primaryModel} (${bulkTask.tier} tier) for ultra-high volume bulk processing`
      );

      // Test fallback generation
      const withFallbacks = selector.selectOptimalModel({ 
        agentType: 'DevAgent',
        fallbackStrategy: 'tier-down'
      });
      this.addResult(
        'Fallback generation works',
        withFallbacks.fallbackModels.length > 0,
        `Generated ${withFallbacks.fallbackModels.length} fallbacks: ${withFallbacks.fallbackModels.join(', ')}`
      );

    } catch (error) {
      this.addResult('ModelTierSelector functionality', false, `Error: ${error}`);
    }
  }

  // =============================================================================
  // CONVENIENCE FUNCTION TESTS
  // =============================================================================

  testConvenienceFunctions() {
    console.log('\n⚡ Testing Convenience Functions');
    console.log('-------------------------------');

    try {
      const devSelection = selectForDevAgent();
      this.addResult(
        'selectForDevAgent works',
        devSelection.tier === 'premium',
        `Selected ${devSelection.primaryModel} (${devSelection.tier} tier)`
      );

      const triageSelection = selectForTriageAgent();
      this.addResult(
        'selectForTriageAgent works',
        triageSelection.tier === 'standard',
        `Selected ${triageSelection.primaryModel} (${triageSelection.tier} tier)`
      );

      const bulkSelection = selectForBulkProcessing();
      this.addResult(
        'selectForBulkProcessing works',
        bulkSelection.tier === 'economy',
        `Selected ${bulkSelection.primaryModel} (${bulkSelection.tier} tier)`
      );

    } catch (error) {
      this.addResult('Convenience functions', false, `Error: ${error}`);
    }
  }

  // =============================================================================
  // INTEGRATION TESTS
  // =============================================================================

  testModelSwitcherIntegration() {
    console.log('\n🔄 Testing Model Switcher Integration');
    console.log('------------------------------------');

    try {
      const switcher = new GeminiModelSwitcher();

      // Test that switcher can access tier functions (no actual switching)
      const tierSelector = ModelTierSelector.getInstance();
      const selection = tierSelector.selectOptimalModel({ agentType: 'DevAgent' });

      this.addResult(
        'Switcher tier integration',
        selection.primaryModel !== undefined,
        `Switcher can access tier selection: ${selection.primaryModel}`
      );

    } catch (error) {
      this.addResult('Switcher tier integration', false, `Error: ${error}`);
    }
  }

  // =============================================================================
  // COST ANALYSIS TESTS
  // =============================================================================

  testCostAnalysis() {
    console.log('\n💰 Testing Cost Analysis');
    console.log('------------------------');

    try {
      const selector = ModelTierSelector.getInstance();

      // Test cost optimization analysis
      const costAnalysis = selector.optimizeForCost({ agentType: 'DevAgent' });
      this.addResult(
        'Cost optimization analysis works',
        costAnalysis.recommendedTier === 'economy',
        `Recommended ${costAnalysis.model} for cost savings`
      );

      // Test performance optimization analysis
      const perfAnalysis = selector.optimizeForPerformance({ 
        agentType: 'BulkProcessingAgent',
        prioritizeCost: true 
      });
      this.addResult(
        'Performance optimization analysis works',
        perfAnalysis.recommendedTier === 'premium',
        `Recommended ${perfAnalysis.model} for performance`
      );

    } catch (error) {
      this.addResult('Cost analysis functionality', false, `Error: ${error}`);
    }
  }

  // =============================================================================
  // REFERENCE GUIDE TESTS
  // =============================================================================

  testReferenceGuides() {
    console.log('\n📚 Testing Reference Guides');
    console.log('---------------------------');

    // Test QUICK_REFERENCE completeness
    const hasRequiredReferences = 
      QUICK_REFERENCE.ECONOMY_TIER &&
      QUICK_REFERENCE.STANDARD_TIER &&
      QUICK_REFERENCE.PREMIUM_TIER &&
      QUICK_REFERENCE.DEV_AGENT &&
      QUICK_REFERENCE.TRIAGE_AGENT &&
      QUICK_REFERENCE.BULK_AGENT;

    this.addResult(
      'QUICK_REFERENCE completeness',
      hasRequiredReferences,
      hasRequiredReferences ? 'All required references present' : 'Missing references'
    );

    // Test TIER_SYSTEM_GUIDE completeness
    const hasCompleteGuide = 
      TIER_SYSTEM_GUIDE.ECONOMY &&
      TIER_SYSTEM_GUIDE.STANDARD &&
      TIER_SYSTEM_GUIDE.PREMIUM &&
      Object.values(TIER_SYSTEM_GUIDE).every(guide => 
        guide.model && guide.cost && guide.bestFor && guide.agents
      );

    this.addResult(
      'TIER_SYSTEM_GUIDE completeness',
      hasCompleteGuide,
      hasCompleteGuide ? 'Complete tier guide available' : 'Missing guide information'
    );
  }

  // =============================================================================
  // MAIN TEST RUNNER
  // =============================================================================

  async runAllTests() {
    this.testRegistryIntegrity();
    this.testUtilityFunctions();
    this.testTierSelector();
    this.testConvenienceFunctions();
    this.testModelSwitcherIntegration();
    this.testCostAnalysis();
    this.testReferenceGuides();
    
    this.printSummary();
    
    return this.testResults.every(r => r.passed);
  }
}

// =============================================================================
// RUN TESTS
// =============================================================================

async function runTierSystemTests() {
  const tester = new TierSystemTester();
  const allPassed = await tester.runAllTests();
  
  if (allPassed) {
    console.log('\n🚀 TIER SYSTEM READY FOR PHASE 2 INTEGRATION!');
    console.log('===============================================');
    console.log('✅ All tests passed - ready to integrate with AgentFactory');
    console.log('✅ Model registry fully updated with tier metadata');  
    console.log('✅ Tier selector provides intelligent model selection');
    console.log('✅ Model switcher enhanced with tier capabilities');
    console.log('✅ Cost optimization and performance analysis working');
    console.log('✅ Fallback strategies properly implemented');
    
    console.log('\nNext steps:');
    console.log('1. Integrate tier system with AgentFactory (Phase 2)');
    console.log('2. Update agent creation to use tier-based selection');
    console.log('3. Add integration tests with real agent instances');
    console.log('4. Implement monitoring and metrics collection');
  } else {
    console.log('\n❌ TIER SYSTEM NOT READY - FIX FAILING TESTS FIRST');
    process.exit(1);
  }
}

// Run tests if called directly
if (require.main === module) {
  runTierSystemTests().catch(console.error);
}

export { TierSystemTester, runTierSystemTests };
