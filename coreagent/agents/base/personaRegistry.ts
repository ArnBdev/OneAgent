/**
 * personaRegistry.ts - Central registry for agent personas, frameworks, and quality configs
 *
 * This registry enables:
 * - Centralized mapping of agent types to persona YAMLs
 * - Easy extension for reasoning, quality, and future config types
 * - Support for all life domains (work, health, learning, social, etc.)
 * - Validation and discovery of available personas
 */
import path from 'path';

export interface PersonaRegistryEntry {
  persona: string; // Path to persona YAML
  quality?: string; // Path to quality YAML (optional)
  reasoning?: string; // Path to reasoning YAML (optional)
  // Add more config types as needed
}

// Central registry: add new agent types and domains here
export const PERSONA_REGISTRY: Record<string, PersonaRegistryEntry> = {
  core: {
    persona: path.resolve(__dirname, '../../../prompts/personas/core-agent.yaml'),
    quality: path.resolve(__dirname, '../../../prompts/quality/constitutional-ai.yaml'),
  },
  development: {
    persona: path.resolve(__dirname, '../../../prompts/personas/dev-agent.yaml'),
    quality: path.resolve(__dirname, '../../../prompts/quality/constitutional-ai.yaml'),
  },
  office: {
    persona: path.resolve(__dirname, '../../../prompts/personas/office-agent.yaml'),
    quality: path.resolve(__dirname, '../../../prompts/quality/constitutional-ai.yaml'),
  },
  fitness: {
    persona: path.resolve(__dirname, '../../../prompts/personas/fitness-agent.yaml'),
    quality: path.resolve(__dirname, '../../../prompts/quality/constitutional-ai.yaml'),
  },
  triage: {
    persona: path.resolve(__dirname, '../../../prompts/personas/triage-agent.yaml'),
    quality: path.resolve(__dirname, '../../../prompts/quality/constitutional-ai.yaml'),
  },
  validation: {
    persona: path.resolve(__dirname, '../../../prompts/personas/validation-agent.yaml'),
    quality: path.resolve(__dirname, '../../../prompts/quality/constitutional-ai.yaml'),
  },
  // Example for future domains:
  // learning: { persona: path.resolve(__dirname, '../../../prompts/personas/learning-agent.yaml') },
  // social: { persona: path.resolve(__dirname, '../../../prompts/personas/social-agent.yaml') },
};

/**
 * Utility to get all registered agent types
 */
export function getRegisteredAgentTypes(): string[] {
  return Object.keys(PERSONA_REGISTRY);
}

/**
 * Utility to get persona config for an agent type
 */
export function getPersonaConfig(agentType: string): PersonaRegistryEntry | undefined {
  return PERSONA_REGISTRY[agentType];
}
