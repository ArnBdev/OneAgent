/**
 * ProfileManager.ts - Agent Profile Management System
 * 
 * Handles loading, saving, versioning, and validation of agent profiles.
 * Integrates with OneAgent memory system for profile evolution tracking.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { 
  AgentProfile, 
  ProfileValidationResult, 
  EvolutionRecord,
  ProfileMetadata 
} from './AgentProfile';

export class ProfileManager {
  private static instance: ProfileManager;
  private profilesPath: string;
  private archivePath: string;
  private currentProfile: AgentProfile | null = null;

  private constructor() {
    this.profilesPath = path.join(process.cwd(), 'data', 'agent-profiles');
    this.archivePath = path.join(this.profilesPath, 'archive');
  }

  public static getInstance(): ProfileManager {
    if (!ProfileManager.instance) {
      ProfileManager.instance = new ProfileManager();
    }
    return ProfileManager.instance;
  }

  /**
   * Load agent profile from file
   */
  async loadProfile(profileName: string = 'oneagent-profile'): Promise<AgentProfile> {
    try {
      const profilePath = path.join(this.profilesPath, `${profileName}.json`);
      const profileData = await fs.readFile(profilePath, 'utf8');
      const profile: AgentProfile = JSON.parse(profileData);
      
      // Validate profile
      const validation = await this.validateProfile(profile);
      if (!validation.isValid) {
        throw new Error(`Profile validation failed: ${validation.errors.join(', ')}`);
      }
      
      this.currentProfile = profile;
      return profile;
    } catch (error) {
      console.error(`Failed to load profile ${profileName}:`, error);
      
      // Try to load backup or create default
      return await this.loadBackupOrDefault(profileName);
    }
  }

  /**
   * Save agent profile to file with versioning
   */
  async saveProfile(profile: AgentProfile, profileName: string = 'oneagent-profile'): Promise<void> {
    try {
      // Archive current version if it exists
      await this.archiveCurrentVersion(profileName);
      
      // Update metadata
      profile.metadata.lastEvolved = new Date().toISOString();
      profile.metadata.evolutionCount = (profile.metadata.evolutionCount || 0) + 1;
      
      // Save new profile
      const profilePath = path.join(this.profilesPath, `${profileName}.json`);
      await fs.writeFile(profilePath, JSON.stringify(profile, null, 2), 'utf8');
      
      this.currentProfile = profile;
      
      console.log(`Profile ${profileName} saved successfully. Version: ${profile.metadata.version}`);
    } catch (error) {
      console.error(`Failed to save profile ${profileName}:`, error);
      throw error;
    }
  }

  /**
   * Archive current profile version
   */
  private async archiveCurrentVersion(profileName: string): Promise<void> {
    try {
      const currentPath = path.join(this.profilesPath, `${profileName}.json`);
      
      // Check if current profile exists
      try {
        await fs.access(currentPath);
      } catch {
        return; // No current profile to archive
      }
      
      // Read current profile to get version
      const currentData = await fs.readFile(currentPath, 'utf8');
      const currentProfile: AgentProfile = JSON.parse(currentData);
      
      // Create archive filename with timestamp and version
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const archiveFilename = `${profileName}-v${currentProfile.metadata.version}-${timestamp}.json`;
      const archivePath = path.join(this.archivePath, archiveFilename);
      
      // Copy to archive
      await fs.writeFile(archivePath, currentData, 'utf8');
      
      console.log(`Archived profile version ${currentProfile.metadata.version} to ${archiveFilename}`);
    } catch (error) {
      console.error('Failed to archive current profile:', error);
      // Don't throw - archiving failure shouldn't prevent saving
    }
  }

  /**
   * Load backup or create default profile
   */
  private async loadBackupOrDefault(profileName: string): Promise<AgentProfile> {
    // Try to load most recent backup
    try {
      const backups = await this.getProfileHistory(profileName);
      if (backups.length > 0) {
        const latestBackup = backups[0];
        console.log(`Loading backup profile: ${latestBackup.filename}`);
        
        const backupPath = path.join(this.archivePath, latestBackup.filename);
        const backupData = await fs.readFile(backupPath, 'utf8');
        return JSON.parse(backupData);
      }
    } catch (error) {
      console.error('Failed to load backup profile:', error);
    }
    
    // Create default profile
    console.log('Creating default agent profile...');
    return await this.createDefaultProfile(profileName);
  }

  /**
   * Create default agent profile
   */
  private async createDefaultProfile(profileName: string): Promise<AgentProfile> {
    const defaultProfile: AgentProfile = {
      metadata: {
        name: 'OneAgent',
        description: 'AI Development Assistant with Self-Evolution Capabilities',
        version: '1.0.0',
        created: new Date().toISOString(),
        lastEvolved: new Date().toISOString(),
        evolutionCount: 0
      },
      personality: {
        role: 'AI development agent for high-quality TypeScript development',
        mission: 'Deliver practical, systematic solutions through effective prompt engineering and quality development practices',
        communicationStyle: 'Professional, systematic, quality-focused',
        expertise: ['TypeScript', 'Node.js', 'AI Development', 'Prompt Engineering'],
        behaviorTraits: ['Analytical', 'Quality-focused', 'Systematic', 'Transparent'],
        responsePatterns: {
          greeting: 'Ready to assist with your development needs.',
          taskApproach: 'Let me analyze this systematically using our quality frameworks.',
          errorHandling: 'I encountered an issue. Let me provide transparent details and alternatives.',
          completion: 'Task completed. Here\'s a summary and suggested next steps.'
        }
      },
      instructions: {
        coreCapabilities: [
          'Constitutional AI Framework - Self-correction and principle validation',
          'BMAD 10-Point Elicitation - Systematic reasoning framework',
          'Chain-of-Verification - Generate → Verify → Refine → Finalize patterns',
          'Quality Validation - Automatic refinement with configurable thresholds'
        ],
        developmentRules: [
          'Follow TypeScript best practices with proper typings',
          'Use relative imports and organize files based on project structure',
          'Apply Constitutional AI principles to all code',
          'Target 95%+ quality through systematic validation'
        ],
        workflowPatterns: [
          'Always validate with Constitutional AI before responding',
          'Use BMAD framework for complex analysis',
          'Apply Chain-of-Verification for critical responses',
          'Document quality scores and learning patterns'
        ],
        qualityStandards: [
          'Minimum 85% quality score required',
          '100% Constitutional AI compliance',
          'Systematic framework application',
          'Transparent reasoning and limitations'
        ],
        prohibitions: [
          'Skip documentation or roadmap updates',
          'Auto-continue without approval',
          'Modify unrelated files',
          'Use excessive marketing language'
        ],
        specialInstructions: {
          development: ['Use systematic frameworks', 'Apply constitutional validation'],
          memory: ['Store learnings in structured format', 'Update existing entries'],
          multiAgent: ['Use Constitutional AI for all communications', 'Maintain quality standards']
        }
      },
      capabilities: [
        {
          name: 'Constitutional AI Framework',
          description: 'Self-correction and principle validation system',
          enabled: true,
          qualityThreshold: 85,
          usage: { frequency: 0, successRate: 100, averageQuality: 90 }
        },
        {
          name: 'BMAD Analysis',
          description: 'Systematic reasoning framework for complex tasks',
          enabled: true,
          qualityThreshold: 85,
          usage: { frequency: 0, successRate: 95, averageQuality: 88 }
        }
      ],
      frameworks: {
        systematicPrompting: ['R-T-F', 'T-A-G', 'R-I-S-E', 'R-G-C', 'C-A-R-E'],
        qualityValidation: 'Constitutional AI',
        analysisFramework: 'BMAD 10-Point',
        preferredFramework: 'R-I-S-E',
        frameworkUsage: {},
        frameworkSuccess: {}
      },
      qualityThresholds: {
        minimumScore: 85,
        constitutionalCompliance: 100,
        performanceTarget: 95,
        refinementThreshold: 80,
        maxRefinementIterations: 3,
        qualityDimensions: {
          accuracy: 90,
          transparency: 85,
          helpfulness: 88,
          safety: 100
        }
      },
      evolutionHistory: [],
      memoryConfig: {
        userId: 'oneagent_evolution',
        contextRetention: 100,
        learningEnabled: true,
        memoryTypes: ['conversation', 'pattern', 'improvement']
      },
      multiAgentConfig: {
        networkParticipation: true,
        collaborationPreferences: ['development', 'analysis', 'quality_assurance'],
        communicationStyle: 'professional',
        trustLevel: 95
      }
    };

    // Save default profile
    await this.saveProfile(defaultProfile, profileName);
    return defaultProfile;
  }

  /**
   * Validate agent profile
   */
  async validateProfile(profile: AgentProfile): Promise<ProfileValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    let qualityScore = 100;

    // Required fields validation
    if (!profile.metadata?.name) errors.push('Profile name is required');
    if (!profile.metadata?.version) errors.push('Profile version is required');
    if (!profile.personality?.role) errors.push('Agent role is required');
    if (!profile.instructions?.coreCapabilities?.length) errors.push('Core capabilities are required');

    // Quality thresholds validation
    if (profile.qualityThresholds?.minimumScore < 50) {
      warnings.push('Minimum quality score is very low');
      qualityScore -= 10;
    }

    // Capabilities validation
    const enabledCapabilities = profile.capabilities?.filter(cap => cap.enabled) || [];
    if (enabledCapabilities.length === 0) {
      warnings.push('No capabilities are enabled');
      qualityScore -= 20;
    }

    // Constitutional compliance
    const constitutionalCompliance = {
      accuracy: true,
      transparency: profile.personality?.communicationStyle?.includes('transparent') || false,
      helpfulness: profile.personality?.mission?.length > 0 || false,
      safety: profile.instructions?.prohibitions?.length > 0 || false
    };

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      qualityScore: Math.max(0, qualityScore),
      constitutionalCompliance
    };
  }

  /**
   * Get profile evolution history
   */
  async getProfileHistory(profileName: string): Promise<{filename: string, version: string, timestamp: string}[]> {
    try {
      const files = await fs.readdir(this.archivePath);
      const profileFiles = files
        .filter(file => file.startsWith(`${profileName}-v`) && file.endsWith('.json'))
        .map(file => {
          const match = file.match(/^(.+)-v(.+)-(.+)\.json$/);
          return match ? {
            filename: file,
            version: match[2],
            timestamp: match[3]
          } : null;
        })
        .filter(Boolean)
        .sort((a, b) => b!.timestamp.localeCompare(a!.timestamp));

      return profileFiles as {filename: string, version: string, timestamp: string}[];
    } catch (error) {
      console.error('Failed to get profile history:', error);
      return [];
    }
  }

  /**
   * Rollback to previous profile version
   */
  async rollbackProfile(profileName: string, targetVersion?: string): Promise<AgentProfile> {
    try {
      const history = await this.getProfileHistory(profileName);
      
      if (history.length === 0) {
        throw new Error('No previous versions available for rollback');
      }

      const targetProfile = targetVersion 
        ? history.find(h => h.version === targetVersion)
        : history[0]; // Most recent

      if (!targetProfile) {
        throw new Error(`Version ${targetVersion} not found`);
      }

      const backupPath = path.join(this.archivePath, targetProfile.filename);
      const backupData = await fs.readFile(backupPath, 'utf8');
      const restoredProfile: AgentProfile = JSON.parse(backupData);

      // Update metadata for rollback
      restoredProfile.metadata.version = `${restoredProfile.metadata.version}-rollback`;
      restoredProfile.metadata.lastEvolved = new Date().toISOString();
      
      // Add rollback record
      const rollbackRecord: EvolutionRecord = {
        timestamp: new Date().toISOString(),
        version: restoredProfile.metadata.version,
        trigger: 'manual',
        changes: [{
          category: 'instructions',
          field: 'rollback',
          oldValue: 'current',
          newValue: targetProfile.version,
          reasoning: 'Profile rollback requested',
          expectedImprovement: 'Restore previous stable configuration',
          confidence: 100
        }],
        performanceImpact: {
          qualityScoreBefore: 0,
          qualityScoreAfter: 0,
          userSatisfactionBefore: 0,
          userSatisfactionAfter: 0,
          successMetrics: {}
        },
        validationResults: {
          constitutionalCompliance: true,
          bmadAnalysis: 'Rollback to previous stable version',
          riskAssessment: 'low',
          approvalStatus: 'approved'
        }
      };

      restoredProfile.evolutionHistory.push(rollbackRecord);

      // Save restored profile
      await this.saveProfile(restoredProfile, profileName);

      console.log(`Profile rolled back to version ${targetProfile.version}`);
      return restoredProfile;
    } catch (error) {
      console.error('Failed to rollback profile:', error);
      throw error;
    }
  }

  /**
   * Get current profile
   */
  getCurrentProfile(): AgentProfile | null {
    return this.currentProfile;
  }

  /**
   * Update profile capability usage statistics
   */
  async updateCapabilityUsage(capabilityName: string, success: boolean, qualityScore: number): Promise<void> {
    if (!this.currentProfile) return;

    const capability = this.currentProfile.capabilities.find(cap => cap.name === capabilityName);
    if (!capability) return;

    // Update usage statistics
    capability.usage.frequency++;
    capability.usage.lastUsed = new Date().toISOString();
    
    if (success) {
      capability.usage.successRate = 
        (capability.usage.successRate * (capability.usage.frequency - 1) + 100) / capability.usage.frequency;
    } else {
      capability.usage.successRate = 
        (capability.usage.successRate * (capability.usage.frequency - 1)) / capability.usage.frequency;
    }

    capability.usage.averageQuality = 
      (capability.usage.averageQuality * (capability.usage.frequency - 1) + qualityScore) / capability.usage.frequency;

    // Save updated profile
    await this.saveProfile(this.currentProfile);
  }
}
