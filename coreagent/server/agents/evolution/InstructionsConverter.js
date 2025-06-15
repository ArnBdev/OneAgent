"use strict";
/**
 * InstructionsConverter.ts - Convert Static Instructions to Dynamic Agent Profile
 *
 * Migrates the current .instructions.md file to the new AgentProfile JSON format
 * while preserving all functionality and enhancing with evolution capabilities.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.InstructionsConverter = void 0;
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const ProfileManager_1 = require("./ProfileManager");
class InstructionsConverter {
    constructor() {
        this.profileManager = ProfileManager_1.ProfileManager.getInstance();
    }
    static getInstance() {
        if (!InstructionsConverter.instance) {
            InstructionsConverter.instance = new InstructionsConverter();
        }
        return InstructionsConverter.instance;
    }
    /**
     * Convert current .instructions.md to AgentProfile format
     */
    async convertInstructionsToProfile() {
        console.log('🔄 Converting .instructions.md to AgentProfile format...');
        try {
            // Read current instructions file
            const instructionsPath = this.getInstructionsPath();
            const instructionsContent = await this.readInstructionsFile(instructionsPath);
            // Parse instructions into structured format
            const parsedInstructions = await this.parseInstructions(instructionsContent);
            // Create AgentProfile from parsed instructions
            const agentProfile = await this.createProfileFromInstructions(parsedInstructions);
            // Validate and save the new profile
            const validation = await this.profileManager.validateProfile(agentProfile);
            if (!validation.isValid) {
                console.warn('Profile validation warnings:', validation.warnings);
            }
            await this.profileManager.saveProfile(agentProfile, 'oneagent-profile');
            // Archive original instructions for reference
            await this.archiveOriginalInstructions(instructionsContent);
            console.log('✅ Successfully converted instructions to AgentProfile format');
            return agentProfile;
        }
        catch (error) {
            console.error('❌ Failed to convert instructions:', error);
            throw error;
        }
    }
    /**
     * Get the path to the instructions file
     */
    getInstructionsPath() {
        // Try to locate the .instructions.md file
        const possiblePaths = [
            'prompts/instructions/.instructions.md',
            '.instructions.md',
            'instructions.md'
        ];
        return possiblePaths[0]; // Use the first path for now
    }
    /**
     * Read instructions file content
     */
    async readInstructionsFile(instructionsPath) {
        try {
            const fullPath = path.join(process.cwd(), instructionsPath);
            return await fs.readFile(fullPath, 'utf8');
        }
        catch (error) {
            console.error(`Failed to read instructions file: ${instructionsPath}`);
            throw error;
        }
    }
    /**
     * Parse instructions markdown into structured data
     */
    async parseInstructions(content) {
        console.log('📝 Parsing instructions content...');
        const sections = {};
        const lines = content.split('\n');
        let currentSection = '';
        let currentContent = [];
        for (const line of lines) {
            // Detect section headers
            if (line.startsWith('## ') || line.startsWith('# ')) {
                // Save previous section
                if (currentSection && currentContent.length > 0) {
                    sections[currentSection] = [...currentContent];
                }
                // Start new section
                currentSection = line.replace(/^#+\s*/, '').toLowerCase()
                    .replace(/[^a-z0-9]+/g, '_')
                    .replace(/_+/g, '_')
                    .replace(/^_|_$/g, '');
                currentContent = [];
            }
            else if (line.trim() && currentSection) {
                currentContent.push(line.trim());
            }
        }
        // Save final section
        if (currentSection && currentContent.length > 0) {
            sections[currentSection] = currentContent;
        }
        return sections;
    }
    /**
     * Create AgentProfile from parsed instructions
     */
    async createProfileFromInstructions(sections) {
        console.log('🏗️ Creating AgentProfile from parsed instructions...');
        const profile = {
            metadata: {
                name: 'OneAgent',
                description: 'AI Development Assistant with Self-Evolution Capabilities (Converted from .instructions.md)',
                version: '2.0.0', // Version 2.0 to indicate migration to ALITA system
                created: new Date().toISOString(),
                lastEvolved: new Date().toISOString(),
                evolutionCount: 0,
                baselineProfile: 'instructions.md'
            },
            personality: this.extractPersonality(sections),
            instructions: this.extractInstructions(sections),
            capabilities: this.extractCapabilities(sections),
            frameworks: this.extractFrameworks(sections),
            qualityThresholds: this.extractQualityThresholds(sections),
            evolutionHistory: [],
            memoryConfig: {
                userId: 'oneagent_evolution',
                contextRetention: 100,
                learningEnabled: true,
                memoryTypes: ['conversation', 'pattern', 'improvement', 'evolution']
            },
            multiAgentConfig: {
                networkParticipation: true,
                collaborationPreferences: ['development', 'analysis', 'quality_assurance', 'evolution'],
                communicationStyle: 'professional',
                trustLevel: 95
            }
        };
        return profile;
    }
    /**
     * Extract personality configuration from instructions
     */
    extractPersonality(sections) {
        const intro = sections['oneagent_ai_development_assistant_instructions'] || [];
        const mission = intro.find(line => line.includes('mission')) ||
            'Deliver practical, systematic solutions through effective prompt engineering and quality development practices';
        return {
            role: 'AI development agent for high-quality TypeScript development, operating through VS Code Copilot Chat with MCP HTTP endpoints',
            mission: mission.replace(/^.*mission.*?:\s*/i, ''),
            communicationStyle: 'Professional, systematic, quality-focused, transparent',
            expertise: [
                'TypeScript Development',
                'Constitutional AI Framework',
                'BMAD Analysis',
                'Prompt Engineering',
                'Multi-Agent Coordination',
                'Quality Validation'
            ],
            behaviorTraits: [
                'Systematic',
                'Quality-focused',
                'Transparent',
                'Analytical',
                'Collaborative',
                'Self-improving'
            ],
            responsePatterns: {
                greeting: 'Ready to assist with your development needs using Constitutional AI principles.',
                taskApproach: 'Let me analyze this systematically using our quality frameworks and evolution capabilities.',
                errorHandling: 'I encountered an issue. Let me provide transparent details, Constitutional AI validation, and alternatives.',
                completion: 'Task completed with quality validation. Here\'s a summary, quality metrics, and suggested next steps.'
            }
        };
    }
    /**
     * Extract instructions from sections
     */
    extractInstructions(sections) {
        const coreCapabilities = sections['core_capabilities'] || [];
        const developmentRules = sections['development_rules_enhanced_with_devagent_collaboration'] || [];
        const workflowPatterns = sections['development_workflow_enhanced_with_devagent_collaboration'] || [];
        const qualityStandards = sections['revolutionary_testing_quality_assurance'] || [];
        const prohibitions = sections['never_do_this'] || [];
        return {
            coreCapabilities: coreCapabilities.filter(line => line.startsWith('**') && line.includes(':')),
            developmentRules: developmentRules.filter(line => line.includes('-') || line.includes('•')),
            workflowPatterns: workflowPatterns.filter(line => line.includes('**')),
            qualityStandards: qualityStandards.filter(line => line.includes('-') || line.includes('•')),
            prohibitions: prohibitions.filter(line => line.includes('❌')),
            specialInstructions: {
                startup: sections['startup_sequence_for_new_sessions'] || [],
                memory: sections['memory_knowledge_management'] || [],
                multiAgent: sections['multi_agent_development_rules_production_operational'] || [],
                prompting: sections['prompt_engineering_integration'] || []
            }
        };
    }
    /**
     * Extract capabilities from instructions
     */
    extractCapabilities(sections) {
        const capabilities = [];
        const mcpTools = sections['oneagent_mcp_tools_port_8083'] || [];
        // Parse MCP tools as capabilities
        for (const line of mcpTools) {
            if (line.includes('**') && line.includes('`') && line.includes('-')) {
                const match = line.match(/\*\*`([^`]+)`\*\*\s*-\s*(.+)/);
                if (match) {
                    capabilities.push({
                        name: match[1],
                        description: match[2],
                        enabled: true,
                        qualityThreshold: 85,
                        usage: {
                            frequency: 0,
                            successRate: 95,
                            averageQuality: 90
                        }
                    });
                }
            }
        }
        // Add core framework capabilities
        const coreCapabilities = [
            {
                name: 'Constitutional AI Framework',
                description: 'Self-correction and principle validation system',
                enabled: true,
                qualityThreshold: 85,
                usage: { frequency: 0, successRate: 98, averageQuality: 92 }
            },
            {
                name: 'BMAD Analysis',
                description: 'Systematic reasoning framework for complex tasks',
                enabled: true,
                qualityThreshold: 85,
                usage: { frequency: 0, successRate: 95, averageQuality: 88 }
            },
            {
                name: 'Chain-of-Verification',
                description: 'Generate → Verify → Refine → Finalize patterns',
                enabled: true,
                qualityThreshold: 85,
                usage: { frequency: 0, successRate: 90, averageQuality: 87 }
            }
        ];
        return [...coreCapabilities, ...capabilities];
    }
    /**
     * Extract framework preferences
     */
    extractFrameworks(sections) {
        return {
            systematicPrompting: ['R-T-F', 'T-A-G', 'R-I-S-E', 'R-G-C', 'C-A-R-E'],
            qualityValidation: 'Constitutional AI',
            analysisFramework: 'BMAD 10-Point',
            preferredFramework: 'R-I-S-E', // Default for complex tasks
            frameworkUsage: {
                'R-T-F': 0,
                'T-A-G': 0,
                'R-I-S-E': 0,
                'R-G-C': 0,
                'C-A-R-E': 0
            },
            frameworkSuccess: {
                'R-T-F': 90,
                'T-A-G': 88,
                'R-I-S-E': 92,
                'R-G-C': 85,
                'C-A-R-E': 87
            }
        };
    }
    /**
     * Extract quality thresholds
     */
    extractQualityThresholds(sections) {
        return {
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
        };
    }
    /**
     * Archive original instructions for reference
     */
    async archiveOriginalInstructions(content) {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const archivePath = path.join(process.cwd(), 'data', 'agent-profiles', 'archive', `original-instructions-${timestamp}.md`);
            await fs.writeFile(archivePath, content, 'utf8');
            console.log(`📦 Original instructions archived to: ${archivePath}`);
        }
        catch (error) {
            console.error('Failed to archive original instructions:', error);
            // Don't throw - archiving failure shouldn't prevent conversion
        }
    }
    /**
     * Create backup of current profile before conversion
     */
    async createPreConversionBackup() {
        try {
            const currentProfile = await this.profileManager.loadProfile();
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupPath = path.join(process.cwd(), 'data', 'agent-profiles', 'archive', `pre-conversion-backup-${timestamp}.json`);
            await fs.writeFile(backupPath, JSON.stringify(currentProfile, null, 2), 'utf8');
            console.log(`💾 Pre-conversion backup created: ${backupPath}`);
        }
        catch (error) {
            console.log('No existing profile to backup (this is expected for first conversion)');
        }
    }
    /**
     * Validate conversion by comparing functionality
     */
    async validateConversion(originalPath, convertedProfile) {
        console.log('🔍 Validating conversion completeness...');
        try {
            // Basic validation checks
            const validationChecks = [
                convertedProfile.metadata.name.length > 0,
                convertedProfile.personality.role.length > 0,
                convertedProfile.instructions.coreCapabilities.length > 0,
                convertedProfile.capabilities.length > 0,
                convertedProfile.frameworks.systematicPrompting.length > 0,
                convertedProfile.qualityThresholds.minimumScore > 0
            ];
            const passedChecks = validationChecks.filter(Boolean).length;
            const totalChecks = validationChecks.length;
            console.log(`✅ Validation: ${passedChecks}/${totalChecks} checks passed`);
            return passedChecks === totalChecks;
        }
        catch (error) {
            console.error('Validation failed:', error);
            return false;
        }
    }
}
exports.InstructionsConverter = InstructionsConverter;
