/**
 * PersonaLoader.ts - Dynamic YAML Persona Loading System
 * 
 * Provides enterprise-grade persona loading with:
 * - YAML parsing and validation
 * - File system watching for hot-reload
 * - Constitutional AI integration
 * - Self-improvement capabilities
 * - Memory-backed prompt evolution
 */

import * as yaml from 'js-yaml';
import * as fs from 'fs';
import * as path from 'path';
import { watch, FSWatcher } from 'chokidar';
import { EventEmitter } from 'events';
import { realUnifiedMemoryClient } from '../../memory/RealUnifiedMemoryClient';

export interface PersonaConfig {
  id: string;
  name: string;
  type: string;
  version: string;
  role: string;
  style: string;
  frameworks: {
    primary: string;
    secondary?: string;
  };
  constitutionalPrinciples: string[];
  framework_implementation: Record<string, string>;
  constitutional_details: Record<string, string>;
  core_principles: string[];
  capabilities: {
    primary: string[];
    frameworks?: string[];
  };
  communication_style: {
    tone: string;
    approach: string;
    complexity: string;
    feedback: string;
  };
  memory_organization: {
    structure: string;
    categories: string[];
  };
  quality_standards: {
    minimum_score: number;
    validation_required: boolean;
    bmad_enhancement: boolean;
    constitutional_check: boolean;
  };
}

export interface PromptTemplate {
  systemPrompt: string;
  userPromptTemplate: string;
  responseInstructions: string;
  qualityChecks: string[];
}

/**
 * Enterprise-grade persona loading and management system
 */
export class PersonaLoader extends EventEmitter {
  private static instance: PersonaLoader;
  private personas: Map<string, PersonaConfig> = new Map();
  private promptTemplates: Map<string, PromptTemplate> = new Map();
  private watchers: Map<string, FSWatcher> = new Map();
  private readonly personasPath: string;
  private isInitialized = false;

  constructor(personasPath: string = 'prompts/personas') {
    super();
    this.personasPath = path.resolve(personasPath);
  }

  /**
   * Singleton instance for global access
   */
  public static getInstance(personasPath?: string): PersonaLoader {
    if (!PersonaLoader.instance) {
      PersonaLoader.instance = new PersonaLoader(personasPath);
    }
    return PersonaLoader.instance;
  }

  /**
   * Initialize the persona loading system
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      console.log(`[PersonaLoader] Initializing with path: ${this.personasPath}`);
      
      // Load all existing personas
      await this.loadAllPersonas();
      
      // Setup file system watching for hot-reload
      await this.setupFileWatching();
      
      this.isInitialized = true;
      this.emit('initialized');
      
      console.log(`[PersonaLoader] Initialized successfully. Loaded ${this.personas.size} personas.`);
    } catch (error) {
      console.error('[PersonaLoader] Initialization failed:', error);
      throw new Error(`PersonaLoader initialization failed: ${error.message}`);
    }
  }

  /**
   * Load all persona YAML files from the personas directory
   */
  private async loadAllPersonas(): Promise<void> {
    if (!fs.existsSync(this.personasPath)) {
      throw new Error(`Personas directory not found: ${this.personasPath}`);
    }

    const files = fs.readdirSync(this.personasPath);
    const yamlFiles = files.filter(file => file.endsWith('.yaml') || file.endsWith('.yml'));

    console.log(`[PersonaLoader] Found ${yamlFiles.length} YAML files to load`);

    for (const file of yamlFiles) {
      try {
        await this.loadPersonaFile(file);
      } catch (error) {
        console.error(`[PersonaLoader] Failed to load persona file ${file}:`, error);
      }
    }
  }

  /**
   * Load and validate a single persona file
   */
  private async loadPersonaFile(filename: string): Promise<void> {
    const filePath = path.join(this.personasPath, filename);
    
    try {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const personaData = yaml.load(fileContent) as PersonaConfig;
      
      // Validate persona structure
      this.validatePersonaConfig(personaData, filename);
      
      // Generate prompt template from persona
      const promptTemplate = this.generatePromptTemplate(personaData);
      
      // Store persona and template
      this.personas.set(personaData.id, personaData);
      this.promptTemplates.set(personaData.id, promptTemplate);
      
      console.log(`[PersonaLoader] Loaded persona: ${personaData.id} (${personaData.name})`);
      
      // Store in memory for persistence and learning
      await this.storePersonaInMemory(personaData, promptTemplate);
      
      this.emit('personaLoaded', personaData.id, personaData);
    } catch (error) {
      throw new Error(`Failed to load persona from ${filename}: ${error.message}`);
    }
  }

  /**
   * Validate persona configuration structure
   */
  private validatePersonaConfig(persona: any, filename: string): void {
    const requiredFields = [
      'id', 'name', 'type', 'version', 'role', 'style',
      'constitutionalPrinciples', 'capabilities', 'quality_standards'
    ];

    for (const field of requiredFields) {
      if (!persona[field]) {
        throw new Error(`Missing required field '${field}' in ${filename}`);
      }
    }

    // Validate Constitutional AI principles
    if (!Array.isArray(persona.constitutionalPrinciples) || persona.constitutionalPrinciples.length === 0) {
      throw new Error(`Invalid constitutionalPrinciples in ${filename}`);
    }

    // Validate quality standards
    if (!persona.quality_standards.minimum_score || persona.quality_standards.minimum_score < 0 || persona.quality_standards.minimum_score > 100) {
      throw new Error(`Invalid quality_standards.minimum_score in ${filename}`);
    }
  }

  /**
   * Generate prompt template from persona configuration
   */
  private generatePromptTemplate(persona: PersonaConfig): PromptTemplate {
    const systemPrompt = this.buildSystemPrompt(persona);
    const userPromptTemplate = this.buildUserPromptTemplate();
    const responseInstructions = this.buildResponseInstructions(persona);
    const qualityChecks = this.buildQualityChecks(persona);

    return {
      systemPrompt,
      userPromptTemplate,
      responseInstructions,
      qualityChecks
    };
  }

  /**
   * Build system prompt from persona configuration
   */
  private buildSystemPrompt(persona: PersonaConfig): string {
    const frameworkSection = persona.frameworks 
      ? `\nFramework Integration:\n- Primary: ${persona.frameworks.primary}\n- Secondary: ${persona.frameworks.secondary || 'N/A'}`
      : '';

    const principlesSection = persona.constitutionalPrinciples.length > 0
      ? `\nConstitutional AI Principles:\n${persona.constitutionalPrinciples.map(p => `- ${p}: ${persona.constitutional_details?.[p] || 'Apply with care and transparency'}`).join('\n')}`
      : '';

    const capabilitiesSection = persona.capabilities.primary.length > 0
      ? `\nCore Capabilities:\n${persona.capabilities.primary.map(c => `- ${c}`).join('\n')}`
      : '';

    const principlesListSection = persona.core_principles?.length > 0
      ? `\nCore Principles:\n${persona.core_principles.map(p => `- ${p}`).join('\n')}`
      : '';

    return `You are ${persona.name} (${persona.id}).

Role: ${persona.role}
Communication Style: ${persona.style}
${frameworkSection}
${principlesSection}
${capabilitiesSection}
${principlesListSection}

Quality Standards:
- Minimum Quality Score: ${persona.quality_standards.minimum_score}%
- Constitutional AI Validation: ${persona.quality_standards.constitutional_check ? 'Required' : 'Optional'}
- BMAD Enhancement: ${persona.quality_standards.bmad_enhancement ? 'Enabled' : 'Disabled'}

Communication Approach:
- Tone: ${persona.communication_style?.tone || 'Professional'}
- Approach: ${persona.communication_style?.approach || 'Direct and helpful'}
- Complexity: ${persona.communication_style?.complexity || 'Adapts to user level'}
- Feedback Style: ${persona.communication_style?.feedback || 'Constructive'}`;
  }

  /**
   * Build user prompt template
   */
  private buildUserPromptTemplate(): string {
    return `Request Type: {requestType}
Context: {context}
Memory Context: {memoryContext}

User Request: {userMessage}

Please respond according to your persona configuration and quality standards.`;
  }

  /**
   * Build response instructions
   */
  private buildResponseInstructions(persona: PersonaConfig): string {
    return `Provide a response that:
1. Follows your constitutional principles: ${persona.constitutionalPrinciples.join(', ')}
2. Maintains your communication style (${persona.communication_style?.tone || 'professional'})
3. Meets quality standard of ${persona.quality_standards.minimum_score}%
4. Applies ${persona.frameworks?.primary || 'systematic'} framework approach
5. Provides actionable, helpful guidance`;
  }

  /**
   * Build quality checks list
   */
  private buildQualityChecks(persona: PersonaConfig): string[] {
    const checks = [
      'Accuracy and factual correctness',
      'Transparency in reasoning',
      'Helpfulness and actionability',
      'Safety and best practices'
    ];

    if (persona.quality_standards.constitutional_check) {
      checks.push('Constitutional AI principle compliance');
    }

    if (persona.quality_standards.bmad_enhancement) {
      checks.push('BMAD framework application');
    }

    return checks;
  }

  /**
   * Setup file system watching for hot-reload
   */
  private async setupFileWatching(): Promise<void> {
    const watcher = watch(this.personasPath, {
      ignored: /^\./,
      persistent: true,
      ignoreInitial: true
    });

    watcher.on('change', async (filePath) => {
      const filename = path.basename(filePath);
      if (filename.endsWith('.yaml') || filename.endsWith('.yml')) {
        console.log(`[PersonaLoader] Detected change in ${filename}, reloading...`);
        try {
          await this.loadPersonaFile(filename);
          this.emit('personaReloaded', filename);
        } catch (error) {
          console.error(`[PersonaLoader] Failed to reload ${filename}:`, error);
        }
      }
    });

    watcher.on('add', async (filePath) => {
      const filename = path.basename(filePath);
      if (filename.endsWith('.yaml') || filename.endsWith('.yml')) {
        console.log(`[PersonaLoader] New persona file detected: ${filename}`);
        try {
          await this.loadPersonaFile(filename);
          this.emit('personaAdded', filename);
        } catch (error) {
          console.error(`[PersonaLoader] Failed to load new persona ${filename}:`, error);
        }
      }
    });

    this.watchers.set('personas', watcher);
  }

  /**
   * Store persona in memory for persistence and learning
   */
  private async storePersonaInMemory(persona: PersonaConfig, template: PromptTemplate): Promise<void> {
    try {
      await realUnifiedMemoryClient.createMemory({
        content: `Persona Configuration: ${persona.name} (${persona.id}) - ${persona.role}`,
        metadata: {
          type: 'persona_config',
          agentId: persona.id,
          version: persona.version,
          qualityScore: persona.quality_standards.minimum_score,
          constitutionalPrinciples: persona.constitutionalPrinciples,
          capabilities: persona.capabilities.primary,
          systemPrompt: template.systemPrompt
        },
        userId: 'system'
      });
    } catch (error) {
      console.error(`[PersonaLoader] Failed to store persona in memory:`, error);
    }
  }

  /**
   * Get persona configuration by ID
   */
  public getPersona(agentId: string): PersonaConfig | null {
    return this.personas.get(agentId) || null;
  }

  /**
   * Get prompt template by agent ID
   */
  public getPromptTemplate(agentId: string): PromptTemplate | null {
    return this.promptTemplates.get(agentId) || null;
  }

  /**
   * Get all loaded personas
   */
  public getAllPersonas(): PersonaConfig[] {
    return Array.from(this.personas.values());
  }

  /**
   * Generate dynamic prompt for agent
   */
  public generatePrompt(agentId: string, userMessage: string, context: any = {}, memoryContext: any[] = []): string {
    const template = this.promptTemplates.get(agentId);
    if (!template) {
      throw new Error(`No prompt template found for agent: ${agentId}`);
    }

    const memoryText = memoryContext.length > 0 
      ? memoryContext.map(m => `- ${m.content}`).join('\n')
      : 'No relevant past context';

    const userPrompt = template.userPromptTemplate
      .replace('{requestType}', context.requestType || 'general')
      .replace('{context}', JSON.stringify(context, null, 2))
      .replace('{memoryContext}', memoryText)
      .replace('{userMessage}', userMessage);

    return `${template.systemPrompt}\n\n${userPrompt}\n\n${template.responseInstructions}`;
  }

  /**
   * Update persona configuration (for self-improvement)
   */
  public async updatePersona(agentId: string, updates: Partial<PersonaConfig>): Promise<void> {
    const currentPersona = this.personas.get(agentId);
    if (!currentPersona) {
      throw new Error(`Persona not found: ${agentId}`);
    }

    const updatedPersona = { ...currentPersona, ...updates };
    
    // Validate updated configuration
    this.validatePersonaConfig(updatedPersona, `${agentId}-update`);
    
    // Generate new template
    const newTemplate = this.generatePromptTemplate(updatedPersona);
    
    // Update in memory
    this.personas.set(agentId, updatedPersona);
    this.promptTemplates.set(agentId, newTemplate);
    
    // Store update in memory for learning
    await this.storePersonaInMemory(updatedPersona, newTemplate);
    
    console.log(`[PersonaLoader] Updated persona: ${agentId}`);
    this.emit('personaUpdated', agentId, updatedPersona);
  }

  /**
   * Cleanup resources
   */
  public async cleanup(): Promise<void> {
    for (const watcher of this.watchers.values()) {
      await watcher.close();
    }
    this.watchers.clear();
    this.personas.clear();
    this.promptTemplates.clear();
    this.isInitialized = false;
  }
}

// Export singleton instance
export const personaLoader = PersonaLoader.getInstance();
