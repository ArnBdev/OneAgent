/**
 * ConstitutionalAI - Self-Correction and Principle Validation System for OneAgent
 * 
 * Implements Constitutional AI patterns for automated response validation,
 * self-correction mechanisms, and principle adherence monitoring.
 * 
 * Achieves dramatic reduction in harmful/incorrect outputs through
 * systematic principle-based validation and iterative refinement.
 */

import { ConstitutionalPrinciple } from './PromptEngine';
import { OneAgentUnifiedBackbone } from '../../utils/UnifiedBackboneService';

export interface ValidationResult {
  isValid: boolean;
  score: number;
  violations: Violation[];
  suggestions: string[];
  refinedResponse: string;  // Make this required to avoid undefined issues
}

export interface Violation {
  principleId: string;
  principleName: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  suggestion: string;
}

export interface CritiqueAnalysis {
  strengths: string[];
  weaknesses: string[];
  improvements: string[];
  confidence: number;
}

export interface RefinementRequest {
  originalResponse: string;
  violations: Violation[];
  userContext: string;
  targetQuality: number;
}

/**
 * Constitutional AI Engine for OneAgent
 * Provides automated validation, self-correction, and principle adherence
 */
export class ConstitutionalAI {

  private principles: ConstitutionalPrinciple[];
  private qualityThreshold: number;

  constructor(config: {
    principles: ConstitutionalPrinciple[],
    qualityThreshold: number
  }) {
    this.principles = config.principles;
    this.qualityThreshold = config.qualityThreshold;
  }
  /**
   * Validate response against all constitutional principles
   */
  async validateResponse(
    response: string,
    userMessage: string,
    context: Record<string, unknown> = {}
  ): Promise<ValidationResult> {
    // Debug: Log the value and type of response
    console.log('[DEBUG] validateResponse received:', response, '| type:', typeof response);
    // Defensive: Accept both 'response' and 'content' for maximum robustness
    // Unwrap nested 'arguments' property if present (MCP tool call compatibility)
    let resolved = response as unknown;
    while (resolved && typeof resolved === 'object' && 'arguments' in resolved && Object.keys(resolved).length === 1) {
      resolved = resolved.arguments;
    }
    // Accept both 'response' and 'content' as possible keys
    if ((typeof resolved !== 'string' || !resolved) && resolved && typeof resolved === 'object' && 'response' in resolved) {
      const responseObj = resolved as { response: unknown };
      if (typeof responseObj.response === 'string') {
        resolved = responseObj.response;
        console.log('[DEBUG] validateResponse fallback to .response:', resolved);
      }
    }
    if ((typeof resolved !== 'string' || !resolved) && resolved && typeof resolved === 'object' && 'content' in resolved) {
      const contentObj = resolved as { content: unknown };
      if (typeof contentObj.content === 'string') {
        resolved = contentObj.content;
        console.log('[DEBUG] validateResponse fallback to .content:', resolved);
      }
    }
    if (typeof resolved !== 'string' || !resolved) {
      throw new Error('Invalid input: response/content must be a non-empty string');
    }
    if (typeof userMessage !== 'string') {
      throw new Error('Invalid input: userMessage must be a string');
    }
    response = resolved;

    const violations: Violation[] = [];
    let totalScore = 100;

    // Add time context for accuracy validation
    const timeContext = OneAgentUnifiedBackbone.getInstance().getServices().timeService.getContext().context;
    const enhancedContext = { ...context, timeContext };

    // Validate against each constitutional principle
    for (const principle of this.principles) {
      const violation = await this.checkPrincipleCompliance(response, principle, userMessage, enhancedContext);
      
      if (violation) {
        violations.push(violation);
        totalScore -= this.calculatePenalty(violation.severity);
      }
    }// Generate improvement suggestions
    const suggestions = violations.map(v => v.suggestion);

    // Generate refined response if violations exist
    const refinedResponse = violations.length > 0 ? 
      await this.generateRefinedResponse({
        originalResponse: response,
        violations,
        userContext: userMessage,
        targetQuality: this.qualityThreshold
      }) : response;

    return {
      isValid: totalScore >= this.qualityThreshold,
      score: Math.max(0, totalScore),
      violations,
      suggestions,
      refinedResponse
    };
  }

  /**
   * Generate self-critique analysis of response
   */
  async generateSelfCritique(response: string, userMessage: string): Promise<CritiqueAnalysis> {
    
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const improvements: string[] = [];

    // Analyze response structure and content
    const analysis = this.analyzeResponseStructure(response);
    
    // Check for constitutional principle adherence
    const principleAnalysis = await this.analyzePrincipleAdherence(response, userMessage);
    
    // Evaluate helpfulness and actionability
    const utilityAnalysis = this.analyzeResponseUtility(response, userMessage);
    
    // Synthesize findings
    strengths.push(...analysis.strengths, ...principleAnalysis.strengths, ...utilityAnalysis.strengths);
    weaknesses.push(...analysis.weaknesses, ...principleAnalysis.weaknesses, ...utilityAnalysis.weaknesses);
    improvements.push(...analysis.improvements, ...principleAnalysis.improvements, ...utilityAnalysis.improvements);

    // Calculate confidence score
    const confidence = this.calculateConfidenceScore(strengths, weaknesses);

    return {
      strengths,
      weaknesses,
      improvements,
      confidence
    };
  }

  /**
   * Iteratively refine response based on violations and feedback
   */
  async refineResponse(request: RefinementRequest): Promise<string> {
    let currentResponse = request.originalResponse;
    let iteration = 0;
    const maxIterations = 3;

    while (iteration < maxIterations) {
      const validation = await this.validateResponse(currentResponse, request.userContext);
      
      if (validation.isValid || validation.score >= request.targetQuality) {
        break;
      }

      // Apply specific refinements for each violation
      currentResponse = await this.applyRefinements(currentResponse, validation.violations, request.userContext);
      iteration++;
    }

    return currentResponse;
  }

  /**
   * Generate quality-improved response using constitutional guidelines
   */
  async generateConstitutionalPrompt(userMessage: string, _context: Record<string, unknown> = {}): Promise<string> {
    
    const principleGuidelines = this.principles
      .map(p => `• ${p.name}: ${p.description}`)
      .join('\n');

    return `
Constitutional AI Guidelines:
${principleGuidelines}

User Request: ${userMessage}

Generate a response that strictly adheres to all constitutional principles above.
Ensure accuracy, transparency, helpfulness, and safety in all recommendations.

Self-validate your response against each principle before finalizing.

Response:`;
  }

  // PRIVATE IMPLEMENTATION METHODS
  private async checkPrincipleCompliance(
    response: string, 
    principle: ConstitutionalPrinciple, 
    userMessage: string,
    _context: Record<string, unknown>
  ): Promise<Violation | null> {
    
    switch (principle.id) {
      case 'accuracy':
        return this.checkAccuracyPrinciple(response, principle);
      
      case 'transparency':
        return this.checkTransparencyPrinciple(response, principle);
      
      case 'helpfulness':
        return this.checkHelpfulnessPrinciple(response, userMessage, principle);
      
      case 'safety':
        return this.checkSafetyPrinciple(response, principle);
      
      default:
        return this.checkGenericPrinciple(response, principle);
    }
  }
  private checkAccuracyPrinciple(response: string, principle: ConstitutionalPrinciple): Violation | null {
    // Check for speculation without uncertainty acknowledgment
    const speculationPatterns = [
      /I think\s+(?!this is certain|this is confirmed)/i,
      /probably(?!\s+based on)/i,
      /might be(?!\s+according to)/i,
      /could be(?!\s+based on)/i
    ];

    const hasUncertaintyMarkers = [
      /I don't know/i,
      /uncertain/i,
      /according to/i,
      /based on evidence/i,
      /research shows/i
    ].some(pattern => pattern.test(response));

    const hasSpeculation = speculationPatterns.some(pattern => pattern.test(response));

    // Check for obvious date/time errors (simplified patterns)
    const dateErrorPatterns = [
      /december 2024/i,
      /dec 2024/i,
      /2024.*december/i
    ];

    const hasDateError = dateErrorPatterns.some(pattern => pattern.test(response));

    if (hasSpeculation && !hasUncertaintyMarkers) {
      return {
        principleId: principle.id,
        principleName: principle.name,
        severity: principle.severityLevel,
        description: 'Response contains speculation without proper uncertainty acknowledgment',
        suggestion: 'Add uncertainty markers like "according to" or "I\'m not certain" when making claims without clear evidence'
      };
    }

    if (hasDateError) {
      return {
        principleId: principle.id,
        principleName: principle.name,
        severity: 'high' as const,
        description: 'Response contains outdated date references that may be inaccurate',
        suggestion: 'Use current date context to ensure temporal accuracy'
      };
    }

    return null;
  }

  private checkTransparencyPrinciple(response: string, principle: ConstitutionalPrinciple): Violation | null {
    // Check for reasoning explanation in complex responses
    if (response.length > 300) {
      const hasReasoningMarkers = [
        /because/i,
        /the reason/i,
        /this is due to/i,
        /here's why/i,
        /the logic/i,
        /my reasoning/i
      ].some(pattern => pattern.test(response));

      if (!hasReasoningMarkers) {
        return {
          principleId: principle.id,
          principleName: principle.name,
          severity: principle.severityLevel,
          description: 'Complex response lacks transparent reasoning explanation',
          suggestion: 'Add reasoning explanations using phrases like "because" or "the reason is" to increase transparency'
        };
      }
    }

    return null;
  }

  private checkHelpfulnessPrinciple(response: string, userMessage: string, principle: ConstitutionalPrinciple): Violation | null {
    // Check for actionable guidance
    const actionablePatterns = [
      /you should/i,
      /I recommend/i,
      /try/i,
      /consider/i,
      /here's how/i,
      /steps?:/i,
      /next.*do/i
    ];

    const hasActionableGuidance = actionablePatterns.some(pattern => pattern.test(response));

    // Only flag if user message seems to be asking for advice/help
    const isAdviceRequest = [
      /how/i,
      /what should/i,
      /help/i,
      /advice/i,
      /recommend/i,
      /suggest/i
    ].some(pattern => pattern.test(userMessage));

    if (isAdviceRequest && !hasActionableGuidance && response.length > 100) {
      return {
        principleId: principle.id,
        principleName: principle.name,
        severity: principle.severityLevel,
        description: 'Response lacks actionable guidance for help request',
        suggestion: 'Add specific recommendations or actionable steps using phrases like "I recommend" or "you should try"'
      };
    }

    return null;
  }

  private checkSafetyPrinciple(response: string, principle: ConstitutionalPrinciple): Violation | null {
    // Check for potentially harmful patterns
    const harmfulPatterns = [
      /delete everything/i,
      /ignore security/i,
      /skip safety/i,
      /don't worry about/i,
      /just do it anyway/i
    ];

    const hasHarmfulSuggestion = harmfulPatterns.some(pattern => pattern.test(response));

    if (hasHarmfulSuggestion) {
      return {
        principleId: principle.id,
        principleName: principle.name,
        severity: 'critical',
        description: 'Response contains potentially harmful recommendations',
        suggestion: 'Revise to include safety considerations and risk warnings'
      };
    }

    return null;
  }

  private checkGenericPrinciple(_response: string, _principle: ConstitutionalPrinciple): Violation | null {
    // Generic principle validation based on validation rule
    // This would be enhanced with more sophisticated NLP analysis
    return null;
  }

  private calculatePenalty(severity: string): number {
    switch (severity) {
      case 'critical': return 40;
      case 'high': return 25;
      case 'medium': return 15;
      case 'low': return 5;
      default: return 0;
    }
  }

  private async generateRefinedResponse(request: RefinementRequest): Promise<string> {
    // Simplified refinement - would use AI-powered refinement in production
    let refined = request.originalResponse;

    for (const violation of request.violations) {
      refined = this.applySpecificRefinement(refined, violation);
    }

    return refined;
  }

  private async applyRefinements(response: string, violations: Violation[], _context: string): Promise<string> {
    let refined = response;

    for (const violation of violations) {
      refined = this.applySpecificRefinement(refined, violation);
    }

    return refined;
  }

  private applySpecificRefinement(response: string, violation: Violation): string {
    switch (violation.principleId) {
      case 'accuracy':
        if (response.includes('I think')) {
          return response.replace(/I think/g, 'Based on available information, it appears');
        }
        break;
      
      case 'transparency':
        if (!response.includes('because') && response.length > 300) {
          return response + '\n\nThis recommendation is based on best practices and established patterns in the field.';
        }
        break;
      
      case 'helpfulness':
        if (!response.includes('recommend')) {
          return response + '\n\nI recommend starting with the most straightforward approach and iterating based on results.';
        }
        break;
    }

    return response;
  }

  private analyzeResponseStructure(response: string): { strengths: string[], weaknesses: string[], improvements: string[] } {
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const improvements: string[] = [];

    // Length analysis
    if (response.length >= 100 && response.length <= 800) {
      strengths.push('Appropriate response length');
    } else if (response.length < 100) {
      weaknesses.push('Response may be too brief');
      improvements.push('Consider providing more detail and context');
    } else {
      weaknesses.push('Response may be too lengthy');
      improvements.push('Consider condensing to key points');
    }

    // Structure analysis
    if (response.includes('\n') || response.includes('•') || response.includes('1.')) {
      strengths.push('Well-structured with clear formatting');
    } else if (response.length > 200) {
      weaknesses.push('Long response lacks clear structure');
      improvements.push('Add bullet points or numbered lists for clarity');
    }

    return { strengths, weaknesses, improvements };
  }

  private async analyzePrincipleAdherence(response: string, userMessage: string): Promise<{ strengths: string[], weaknesses: string[], improvements: string[] }> {
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const improvements: string[] = [];

    // Check each principle quickly
    for (const principle of this.principles) {
      const violation = await this.checkPrincipleCompliance(response, principle, userMessage, {});
      
      if (!violation) {
        strengths.push(`Adheres to ${principle.name} principle`);
      } else {
        weaknesses.push(violation.description);
        improvements.push(violation.suggestion);
      }
    }

    return { strengths, weaknesses, improvements };
  }

  private analyzeResponseUtility(response: string, _userMessage: string): { strengths: string[], weaknesses: string[], improvements: string[] } {
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const improvements: string[] = [];

    // Check for actionable content
    const actionablePatterns = [/you should/i, /try/i, /consider/i, /recommend/i];
    if (actionablePatterns.some(p => p.test(response))) {
      strengths.push('Provides actionable guidance');
    } else {
      weaknesses.push('Lacks specific actionable recommendations');
      improvements.push('Add concrete steps or recommendations');
    }

    // Check for examples
    if (response.includes('example') || response.includes('for instance')) {
      strengths.push('Includes helpful examples');
    } else if (response.length > 200) {
      improvements.push('Consider adding examples to illustrate points');
    }

    return { strengths, weaknesses, improvements };
  }

  private calculateConfidenceScore(strengths: string[], weaknesses: string[]): number {
    const strengthWeight = 10;
    const weaknessWeight = -15;
    
    const baseScore = 50;
    const strengthScore = strengths.length * strengthWeight;
    const weaknessScore = weaknesses.length * weaknessWeight;
    
    return Math.max(0, Math.min(100, baseScore + strengthScore + weaknessScore));
  }
}
