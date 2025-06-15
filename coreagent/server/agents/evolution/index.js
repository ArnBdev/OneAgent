"use strict";
/**
 * index.ts - ALITA Evolution System Entry Point
 *
 * Main orchestrator for the ALITA self-evolving agent system.
 * Provides easy access to all evolution functionality.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ALITA = exports.ALITASystem = exports.InstructionsConverter = exports.EvolutionEngine = exports.ProfileManager = void 0;
var ProfileManager_1 = require("./ProfileManager");
Object.defineProperty(exports, "ProfileManager", { enumerable: true, get: function () { return ProfileManager_1.ProfileManager; } });
var EvolutionEngine_1 = require("./EvolutionEngine");
Object.defineProperty(exports, "EvolutionEngine", { enumerable: true, get: function () { return EvolutionEngine_1.EvolutionEngine; } });
var InstructionsConverter_1 = require("./InstructionsConverter");
Object.defineProperty(exports, "InstructionsConverter", { enumerable: true, get: function () { return InstructionsConverter_1.InstructionsConverter; } });
const ProfileManager_2 = require("./ProfileManager");
const EvolutionEngine_2 = require("./EvolutionEngine");
const InstructionsConverter_2 = require("./InstructionsConverter");
/**
 * ALITA System - Main interface for agent evolution
 */
class ALITASystem {
    constructor() {
        this.initialized = false;
        this.profileManager = ProfileManager_2.ProfileManager.getInstance();
        this.evolutionEngine = EvolutionEngine_2.EvolutionEngine.getInstance();
        this.converter = InstructionsConverter_2.InstructionsConverter.getInstance();
    }
    static getInstance() {
        if (!ALITASystem.instance) {
            ALITASystem.instance = new ALITASystem();
        }
        return ALITASystem.instance;
    }
    /**
     * Initialize the ALITA system
     */
    async initialize() {
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
        }
        catch (error) {
            console.error('❌ Failed to initialize ALITA System:', error);
            throw error;
        }
    }
    /**
     * Check if instructions need conversion to AgentProfile format
     */
    async checkNeedsConversion() {
        try {
            // Try to load existing profile
            await this.profileManager.loadProfile();
            return false; // Profile exists, no conversion needed
        }
        catch {
            // No profile exists, conversion needed
            return true;
        }
    }
    /**
     * Set up evolution monitoring and events
     */
    setupEvolutionMonitoring() {
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
    async evolve(options) {
        if (!this.initialized) {
            await this.initialize();
        }
        const evolutionOptions = {
            trigger: 'manual',
            aggressiveness: options?.aggressiveness || 'moderate',
            ...(options?.focusAreas && { focusAreas: options.focusAreas })
        };
        console.log('🧬 Starting manual evolution...');
        await this.evolutionEngine.evolveProfile(evolutionOptions);
    }
    /**
     * Get current system status
     */
    async getStatus() {
        const profile = this.profileManager.getCurrentProfile();
        const evolutionStatus = this.evolutionEngine.getStatus();
        return {
            initialized: this.initialized,
            ...(profile && { currentProfile: `${profile.metadata.name} v${profile.metadata.version}` }),
            evolutionStatus,
            ...(profile?.metadata.lastEvolved && { lastEvolution: profile.metadata.lastEvolved })
        };
    }
    /**
     * Get profile manager instance
     */
    getProfileManager() {
        return this.profileManager;
    }
    /**
     * Get evolution engine instance
     */
    getEvolutionEngine() {
        return this.evolutionEngine;
    }
    /**
     * Get converter instance
     */
    getConverter() {
        return this.converter;
    }
    /**
     * Force re-conversion from instructions
     */
    async reconvert() {
        console.log('🔄 Force re-converting instructions...');
        await this.converter.createPreConversionBackup();
        await this.converter.convertInstructionsToProfile();
    }
    /**
     * Rollback to previous profile version
     */
    async rollback(targetVersion) {
        if (!this.initialized) {
            await this.initialize();
        }
        console.log(`⏮️ Rolling back${targetVersion ? ` to version ${targetVersion}` : ' to previous version'}...`);
        await this.profileManager.rollbackProfile('oneagent-profile', targetVersion);
    }
    /**
     * Get evolution history
     */
    async getEvolutionHistory() {
        const profile = this.profileManager.getCurrentProfile();
        return profile?.evolutionHistory || [];
    }
}
exports.ALITASystem = ALITASystem;
/**
 * Global ALITA instance for easy access
 */
exports.ALITA = ALITASystem.getInstance();
