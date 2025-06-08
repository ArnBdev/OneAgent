/**
 * RequestValidator - Basic format and size validation for OneAgent
 * Part of Level 2.5 Security Foundation (Phase 1a)
 * 
 * Provides lightweight, performance-aware validation without blocking core functionality.
 */

import { IRequest } from '../types/conversation';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ValidationConfig {
  maxRequestSize: number;
  maxPromptLength: number;
  allowedAgentTypes: string[];
  requiredFields: string[];
}

export class RequestValidator {
  private config: ValidationConfig;

  constructor(config?: Partial<ValidationConfig>) {
    this.config = {
      maxRequestSize: 10 * 1024 * 1024, // 10MB
      maxPromptLength: 100000, // 100k characters
      allowedAgentTypes: [
        'research',
        'fitness', 
        'generic-gemini',
        'memory-qna',
        'office',
        'dev',
        'stem',
        'medical'
      ],
      requiredFields: ['prompt', 'agentType'],
      ...config
    };
  }

  /**
   * Validates a request object for basic format and size constraints
   */
  validateRequest(request: any): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };

    // Basic null/undefined check
    if (!request) {
      result.isValid = false;
      result.errors.push('Request cannot be null or undefined');
      return result;
    }

    // Check required fields
    for (const field of this.config.requiredFields) {
      if (!request[field]) {
        result.isValid = false;
        result.errors.push(`Missing required field: ${field}`);
      }
    }

    // Validate prompt length
    if (request.prompt && typeof request.prompt === 'string') {
      if (request.prompt.length > this.config.maxPromptLength) {
        result.isValid = false;
        result.errors.push(`Prompt exceeds maximum length of ${this.config.maxPromptLength} characters`);
      }
      
      if (request.prompt.length === 0) {
        result.isValid = false;
        result.errors.push('Prompt cannot be empty');
      }
    }

    // Validate agent type
    if (request.agentType && !this.config.allowedAgentTypes.includes(request.agentType)) {
      result.warnings.push(`Unknown agent type: ${request.agentType}. Will use fallback.`);
    }

    // Check overall request size (approximate)
    const requestSize = JSON.stringify(request).length;
    if (requestSize > this.config.maxRequestSize) {
      result.isValid = false;
      result.errors.push(`Request size exceeds maximum of ${this.config.maxRequestSize} bytes`);
    }

    // Validate user ID format (if present)
    if (request.userId && typeof request.userId === 'string') {
      // Basic UUID v4 format check
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidPattern.test(request.userId)) {
        result.warnings.push('User ID does not match UUID v4 format');
      }
    }

    return result;
  }

  /**
   * Quick validation for high-frequency operations
   */
  quickValidate(prompt: string, agentType: string): boolean {
    if (!prompt || !agentType) return false;
    if (prompt.length > this.config.maxPromptLength) return false;
    return true;
  }

  /**
   * Sanitizes user input by removing potentially harmful content
   */
  sanitizeInput(input: string): string {
    if (!input || typeof input !== 'string') return '';
    
    // Remove potential script tags and suspicious patterns
    return input
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .trim();
  }

  /**
   * Updates validation configuration
   */
  updateConfig(newConfig: Partial<ValidationConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Gets current validation statistics
   */
  getValidationStats(): ValidationConfig {
    return { ...this.config };
  }
}

// Default singleton instance
export const defaultRequestValidator = new RequestValidator();
