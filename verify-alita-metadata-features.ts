/**
 * Comprehensive ALITA Metadata Enhanced Features Verification Test
 * 
 * Tests working ALITA components with real AI:
 * - SmartGeminiClient hybrid approach
 * - Constitutional AI validation
 * - BMAD analysis  
 * - Quality scoring
 * - System health monitoring
 * - Agent evolution capabilities
 */

import { SmartGeminiClient } from './coreagent/tools/SmartGeminiClient';

async function verifyALITAMetadataFeatures() {
  console.log('🧠 ALITA Metadata Enhanced Features Verification\n');
  console.log('='.repeat(60));

  const testResults = {
    smartGeminiClient: false,
    constitutionalAI: false,
    bmadAnalysis: false,
    qualityScoring: false,
    performanceMonitoring: false,
    agentEvolution: false,
    metadataCapture: false,
    realAIResponses: false
  };

  let aiResponse: any = null;
  let testPrompt = '';

  try {
    // Test 1: SmartGeminiClient with Real AI
    console.log('\n🚀 Test 1: SmartGeminiClient & Real AI Verification');
    console.log('-'.repeat(50));
    
    const smartClient = new SmartGeminiClient();
    testPrompt = 'Explain how metadata enhances AI conversation systems and enables personalization while maintaining privacy';
    aiResponse = await smartClient.generateContent(testPrompt);
    
    console.log('✅ SmartGeminiClient Status:', smartClient.getStatus());
    console.log('✅ AI Response Length:', aiResponse.response.length);
    console.log('✅ Response Quality Check:', aiResponse.response.includes('metadata') && aiResponse.response.includes('AI'));
    console.log('✅ Response Preview:', aiResponse.response.substring(0, 200) + '...\n');
    
    testResults.smartGeminiClient = aiResponse.response.length > 500;
    testResults.realAIResponses = aiResponse.response.includes('metadata') && aiResponse.response.includes('privacy');

  } catch (error: any) {
    console.error('❌ SmartGeminiClient Test Failed:', error.message);
  }

  // Test 2: Constitutional AI Features
  console.log('\n⚖️ Test 2: Constitutional AI Validation');
  console.log('-'.repeat(50));

  try {
    const { mcp_oneagent_oneagent_constitutional_validate } = require('./coreagent/server/index-simple.js');
    
    const constitutionalResult = await mcp_oneagent_oneagent_constitutional_validate({
      response: aiResponse?.response?.substring(0, 1000) || 'Test response for constitutional validation',
      userMessage: testPrompt || 'Test prompt'
    });
    
    console.log('✅ Constitutional AI Result:', {
      isValid: constitutionalResult.isValid,
      score: constitutionalResult.score,
      accuracyCheck: constitutionalResult.qualityMetrics?.accuracy,
      transparencyCheck: constitutionalResult.qualityMetrics?.transparency,
      helpfulnessCheck: constitutionalResult.qualityMetrics?.helpfulness,
      safetyCheck: constitutionalResult.qualityMetrics?.safety
    });
    
    testResults.constitutionalAI = constitutionalResult.isValid && constitutionalResult.score >= 80;

  } catch (error: any) {
    console.log('⚠️ Constitutional AI Test Failed:', error.message);
  }

  // Test 3: BMAD Framework Analysis
  console.log('\n� Test 3: BMAD Framework Analysis');
  console.log('-'.repeat(50));

  try {
    const { mcp_oneagent_oneagent_bmad_analyze } = require('./coreagent/server/index-simple.js');
    
    const bmadResult = await mcp_oneagent_oneagent_bmad_analyze({
      task: 'Design an intelligent metadata system for AI conversations that captures user context, conversation quality, and enables personalized responses while maintaining privacy standards'
    });
    
    console.log('✅ BMAD Analysis Result:', {
      analysisCompleted: !!bmadResult.analysis,
      pointsSelected: bmadResult.selectedPoints?.length || 0,
      complexityLevel: bmadResult.complexity,
      confidenceScore: bmadResult.confidence,
      frameworkApplied: bmadResult.framework
    });
    
    testResults.bmadAnalysis = !!bmadResult.analysis && bmadResult.selectedPoints?.length > 0;

  } catch (error: any) {
    console.log('⚠️ BMAD Analysis Test Failed:', error.message);
  }

  // Test 4: Quality Scoring System
  console.log('\n📈 Test 4: Quality Scoring & Enhancement');
  console.log('-'.repeat(50));

  try {
    const { mcp_oneagent_oneagent_quality_score } = require('./coreagent/server/index-simple.js');
    
    const qualityResult = await mcp_oneagent_oneagent_quality_score({
      content: aiResponse?.response?.substring(0, 1500) || 'Test content for quality scoring analysis',
      criteria: ['accuracy', 'completeness', 'clarity', 'relevance', 'depth', 'actionability']
    });
    
    console.log('✅ Quality Scoring Result:', {
      qualityScore: qualityResult.qualityScore,
      gradeLevel: qualityResult.grade,
      criteriaEvaluated: qualityResult.criteriaScores ? Object.keys(qualityResult.criteriaScores).length : 0,
      improvementSuggestions: qualityResult.suggestions?.length || 0,
      passesThreshold: qualityResult.qualityScore >= 80
    });
    
    testResults.qualityScoring = qualityResult.qualityScore > 0;

  } catch (error: any) {
    console.log('⚠️ Quality Scoring Test Failed:', error.message);
  }

  // Test 5: System Health & Performance Monitoring
  console.log('\n� Test 5: System Health & Performance Monitoring');
  console.log('-'.repeat(50));

  try {
    const { mcp_oneagent_oneagent_system_health } = require('./coreagent/server/index-simple.js');
    
    const healthResult = await mcp_oneagent_oneagent_system_health({});
    
    console.log('✅ System Health Result:', {
      overallStatus: healthResult.status,
      componentsMonitored: Object.keys(healthResult.components || {}).length,
      performanceTracked: !!healthResult.performance,
      memoryUsageTracked: !!healthResult.memory,
      uptimeTracked: !!healthResult.uptime,
      systemHealthy: healthResult.status === 'healthy'
    });
    
    testResults.performanceMonitoring = healthResult.status === 'healthy' || healthResult.status === 'operational';

  } catch (error: any) {
    console.log('⚠️ System Health Test Failed:', error.message);
  }

  // Test 6: Agent Evolution & Learning Capabilities
  console.log('\n� Test 6: Agent Evolution & Learning Systems');
  console.log('-'.repeat(50));

  try {
    const { mcp_oneagent_oneagent_evolve_profile, mcp_oneagent_oneagent_profile_status } = require('./coreagent/server/index-simple.js');
    
    // Check current profile status
    const profileStatus = await mcp_oneagent_oneagent_profile_status({});
    console.log('📊 Profile Status:', {
      evolutionReady: profileStatus.evolutionReady,
      lastEvolution: profileStatus.lastEvolution,
      performanceScore: profileStatus.performanceScore,
      capabilityCount: profileStatus.capabilities?.length || 0
    });
    
    // Test evolution trigger (conservative mode)
    const evolutionResult = await mcp_oneagent_oneagent_evolve_profile({
      trigger: 'manual',
      aggressiveness: 'conservative',
      focusAreas: ['quality_improvement', 'metadata_intelligence'],
      qualityThreshold: 85
    });
    
    console.log('✅ Evolution System Result:', {
      evolutionTriggered: evolutionResult.evolutionTriggered,
      improvementsApplied: evolutionResult.improvements?.length || 0,
      qualityEnhancement: evolutionResult.qualityImprovement,
      newCapabilities: evolutionResult.newCapabilities?.length || 0
    });
    
    testResults.agentEvolution = evolutionResult.evolutionTriggered || profileStatus.evolutionReady;

  } catch (error: any) {
    console.log('⚠️ Agent Evolution Test Failed:', error.message);
  }

  // Test 7: Metadata Capture & Intelligence
  console.log('\n� Test 7: Metadata Capture & Intelligence Systems');
  console.log('-'.repeat(50));

  try {
    // Test semantic analysis for metadata extraction
    const { mcp_oneagent_oneagent_semantic_analysis } = require('./coreagent/server/index-simple.js');
    
    const semanticResult = await mcp_oneagent_oneagent_semantic_analysis({
      text: aiResponse?.response || 'Test text for semantic metadata analysis',
      analysisType: 'classification'
    });
    
    console.log('✅ Metadata Intelligence Result:', {
      semanticAnalysisWorking: !!semanticResult.analysis,
      metadataExtracted: !!semanticResult.metadata,
      classificationPerformed: !!semanticResult.classification,
      embeddingsGenerated: !!semanticResult.embeddings
    });
    
    testResults.metadataCapture = !!semanticResult.analysis;

  } catch (error: any) {
    console.log('⚠️ Metadata Intelligence Test Failed:', error.message);
  }

  // Final Results Summary
  console.log('\n' + '='.repeat(60));
  console.log('🎯 ALITA METADATA ENHANCED FEATURES - VERIFICATION SUMMARY');
  console.log('='.repeat(60));

  const passedTests = Object.values(testResults).filter(Boolean).length;
  const totalTests = Object.keys(testResults).length;
  const successRate = Math.round((passedTests / totalTests) * 100);

  console.log(`\n📊 Overall Success Rate: ${successRate}% (${passedTests}/${totalTests})`);
  console.log('\n📋 Individual Feature Status:');
  
  Object.entries(testResults).forEach(([feature, status]) => {
    const icon = status ? '✅' : '❌';
    const statusText = status ? 'WORKING' : 'NEEDS ATTENTION';
    console.log(`  ${icon} ${feature.replace(/([A-Z])/g, ' $1').toLowerCase()}: ${statusText}`);
  });

  console.log('\n🔬 Detailed Analysis:');
  
  if (testResults.smartGeminiClient && testResults.realAIResponses) {
    console.log('✅ CORE AI SYSTEM: Fully operational with real Gemini responses');
  }
  
  if (testResults.constitutionalAI && testResults.qualityScoring) {
    console.log('✅ QUALITY SYSTEMS: Constitutional AI and quality scoring active');
  }
  
  if (testResults.bmadAnalysis && testResults.metadataCapture) {
    console.log('✅ INTELLIGENCE SYSTEMS: BMAD analysis and metadata capture functional');
  }
  
  if (testResults.performanceMonitoring && testResults.agentEvolution) {
    console.log('✅ EVOLUTION SYSTEMS: Performance monitoring and agent evolution ready');
  }

  if (successRate >= 80) {
    console.log('\n🎉 EXCELLENT! ALITA Metadata Enhanced Features are working exceptionally well!');
    console.log('🚀 Your AI agents have advanced metadata intelligence, constitutional AI compliance,');
    console.log('   BMAD analysis, quality scoring, and evolution capabilities!');
    console.log('🧠 Ready for production-level intelligent conversation processing!');
  } else if (successRate >= 60) {
    console.log('\n⚠️ GOOD! Most ALITA features working well, minor optimizations needed.');
    console.log('🔧 Consider addressing failing components for optimal performance.');
  } else {
    console.log('\n❌ NEEDS WORK! Several ALITA features require debugging and optimization.');
    console.log('🛠️ Focus on core systems first, then enhance metadata capabilities.');
  }

  return testResults;
}

if (require.main === module) {
  verifyALITAMetadataFeatures().catch(console.error);
}

export { verifyALITAMetadataFeatures };
