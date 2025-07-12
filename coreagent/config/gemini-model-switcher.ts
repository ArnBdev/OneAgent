// Gemini Model Switcher for OneAgent
// MCP 2025-06-18 compliant utility for programmatic model switching
// Uses canonical GEMINI_MODELS registry

import { GEMINI_MODELS, GeminiModel } from './gemini-model-registry';

export class GeminiModelSwitcher {
  /**
   * Switch to a new Gemini model by canonical name. Throws if not found.
   */
  static switchModel(modelName: string): GeminiModel {
    const model = GEMINI_MODELS[modelName];
    if (!model) {
      throw new Error(`Model '${modelName}' not found in canonical registry.`);
    }
    return model;
  }

  /**
   * Validate if a model name is available in the registry.
   */
  static isValidModel(modelName: string): boolean {
    return !!GEMINI_MODELS[modelName];
  }

  /**
   * List all available model names.
   */
  static listModels(): string[] {
    return Object.keys(GEMINI_MODELS);
  }
}
