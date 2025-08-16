/**
 * index.ts - ALITA Evolution System Entry Point
 *
 * Main orchestrator for the ALITA self-evolving agent system.
 * Provides easy access to all evolution functionality.
 */

export { AgentProfile, EvolutionContext, EvolutionRecord, EvolutionChange } from './AgentProfile';
export { ProfileManager } from './ProfileManager';
export { EvolutionEngine, EvolutionOptions, EvolutionAnalysis } from './EvolutionEngine';
export { InstructionsConverter } from './InstructionsConverter';

import { ProfileManager } from './ProfileManager';
import { EvolutionEngine } from './EvolutionEngine';
import { InstructionsConverter } from './InstructionsConverter';
import type { EvolutionRecord } from './AgentProfile';

/**
 * ALITA System - Main interface for agent evolution
 */
export class ALITASystem {
  private static instance: ALITASystem;
  private profileManager: ProfileManager;
  private evolutionEngine: EvolutionEngine;
  private converter: InstructionsConverter;
  private initialized: boolean = false;

  private constructor() {
    this.profileManager = ProfileManager.getInstance();
    this.evolutionEngine = EvolutionEngine.getInstance();
    this.converter = InstructionsConverter.getInstance();
  }

  public static getInstance(): ALITASystem {
    if (!ALITASystem.instance) {
      ALITASystem.instance = new ALITASystem();
    }
    return ALITASystem.instance;
  }

  /**
   * Initialize the ALITA system
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      console.log('🤖 ALITA System already initialized');
      return;
    }

    console.log('🚀 Initializing ALITA Self-Evolution System...');

    try {
      // Step 1: Check if we need to convert instructions
      const needsConversion = await this.checkNeedsConversion();

      if (needsConversion) {
        console.log('📝 Converting instructions to AgentProfile format...');
        await this.converter.createPreConversionBackup();
        await this.converter.convertInstructionsToProfile();
      }

      // Step 2: Load current profile
      const profile = await this.profileManager.loadProfile();
      console.log(`✅ Loaded agent profile: ${profile.metadata.name} v${profile.metadata.version}`);

      // Step 3: Set up evolution monitoring
      this.setupEvolutionMonitoring();

      this.initialized = true;
      console.log('🎯 ALITA System initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize ALITA System:', error);
      throw error;
    }
  }

  /**
   * Check if instructions need conversion to AgentProfile format
   */
  private async checkNeedsConversion(): Promise<boolean> {
    try {
      // Try to load existing profile
      await this.profileManager.loadProfile();
      return false; // Profile exists, no conversion needed
    } catch {
      // No profile exists, conversion needed
      return true;
    }
  }

  /**
   * Set up evolution monitoring and events
   */
  private setupEvolutionMonitoring(): void {
    this.evolutionEngine.on('evolution_started', (options) => {
      console.log(`🧬 Evolution started: ${options.trigger} (${options.aggressiveness})`);
    });

    this.evolutionEngine.on('evolution_completed', (profile) => {
      console.log(`✅ Evolution completed: ${profile.metadata.name} v${profile.metadata.version}`);
    });

    this.evolutionEngine.on('evolution_failed', (error) => {
      console.error(`❌ Evolution failed:`, error);
    });
  }

  /**
   * Trigger manual evolution
   */
  async evolve(options?: {
    aggressiveness?: 'conservative' | 'moderate' | 'aggressive';
    focusAreas?: string[];
  }): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
    const evolutionOptions = {
      trigger: 'manual' as const,
      aggressiveness: options?.aggressiveness || ('moderate' as const),
      ...(options?.focusAreas && { focusAreas: options.focusAreas }),
    };

    console.log('🧬 Starting manual evolution...');
    await this.evolutionEngine.evolveProfile(evolutionOptions);
  }
  /**
   * Get current system status
   */
  async getStatus(): Promise<{
    initialized: boolean;
    currentProfile?: string;
    evolutionStatus: { isEvolving: boolean; lastEvolution?: string };
    lastEvolution?: string;
  }> {
    const profile = this.profileManager.getCurrentProfile();
    const evolutionStatus = this.evolutionEngine.getStatus();

    return {
      initialized: this.initialized,
      ...(profile && { currentProfile: `${profile.metadata.name} v${profile.metadata.version}` }),
      evolutionStatus,
      ...(profile?.metadata.lastEvolved && { lastEvolution: profile.metadata.lastEvolved }),
    };
  }

  /**
   * Get profile manager instance
   */
  getProfileManager(): ProfileManager {
    return this.profileManager;
  }

  /**
   * Get evolution engine instance
   */
  getEvolutionEngine(): EvolutionEngine {
    return this.evolutionEngine;
  }

  /**
   * Get converter instance
   */
  getConverter(): InstructionsConverter {
    return this.converter;
  }

  /**
   * Force re-conversion from instructions
   */
  async reconvert(): Promise<void> {
    console.log('🔄 Force re-converting instructions...');
    await this.converter.createPreConversionBackup();
    await this.converter.convertInstructionsToProfile();
  }

  /**
   * Rollback to previous profile version
   */
  async rollback(targetVersion?: string): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    console.log(
      `⏮️ Rolling back${targetVersion ? ` to version ${targetVersion}` : ' to previous version'}...`,
    );
    await this.profileManager.rollbackProfile('oneagent-profile', targetVersion);
  }

  /**
   * Get evolution history
   */
  async getEvolutionHistory(): Promise<EvolutionRecord[]> {
    const profile = this.profileManager.getCurrentProfile();
    return profile?.evolutionHistory || [];
  }
}

/**
 * Global ALITA instance for easy access
 */
export const ALITA = ALITASystem.getInstance();
