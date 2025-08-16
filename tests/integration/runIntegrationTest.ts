#!/usr/bin/env node

/**
 * OneAgent Integration Test Runner
 *
 * Runs comprehensive integration tests to verify the unified OneAgent system
 * is ready for production deployment.
 */

import { SystemIntegrationVerifier } from './SystemIntegrationVerifier';

async function main() {
  console.log('🚀 Running OneAgent Integration Verification...\n');

  try {
    const report = await SystemIntegrationVerifier.generateReport();
    console.log(report);

    // Additional verification
    const integration = await SystemIntegrationVerifier.verifyIntegration();

    if (integration.systemStatus === 'UNIFIED') {
      console.log('✅ SUCCESS: OneAgent system is fully unified and production-ready!');
      process.exit(0);
    } else {
      console.log('⚠️  WARNING: System requires additional integration work.');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ ERROR: Integration verification failed:', error);
    process.exit(1);
  }
}

main().catch(console.error);
