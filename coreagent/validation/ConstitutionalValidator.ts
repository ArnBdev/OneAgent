/**
 * Constitutional Validator Implementation - ALITA Phase 1
 * 
 * Purpose: Validate content against Constitutional AI principles
 * Why: Safety and compliance are foundational requirements
 * 
 * @version 1.0.0
 * @date 2025-06-15
 */

export interface ConstitutionalResult {
  passed: boolean;
  score: number;
  violations: string[];
}

export interface PrivacyAssessment {
  passed: boolean;
  riskLevel: string;
  sensitiveDataDetected: boolean;
}

export interface ValidationResult {
  passed: boolean;
  reason?: string;
}

/**
 * Constitutional Validator
 * WHY: Ensures all AI interactions meet safety and ethical standards
 */
export class ConstitutionalValidator {
  
  /**
   * Validate content against Constitutional AI principles
   * WHY: Every interaction must meet safety standards
   */
  async validate(content: string): Promise<ConstitutionalResult> {
    const violations: string[] = [];
    let score = 100;

    // Accuracy Check - Look for speculation or uncertain statements
    if (this.containsSpeculation(content)) {
      violations.push('accuracy - contains speculation');
      score -= 20;
    }    // Transparency Check - Look for reasoning explanations
    if (!this.containsReasoning(content)) {
      violations.push('transparency - lacks reasoning explanation');
      score -= 15; // Reduced penalty for helpful content
    }

    // Helpfulness Check - Look for actionable content
    if (!this.isActionable(content)) {
      violations.push('helpfulness - lacks actionable guidance');
      score -= 20;
    }

    // Safety Check - Look for harmful content
    if (this.containsHarmfulContent(content)) {
      violations.push('safety - contains potentially harmful content');
      score -= 35;
    }

    return {
      passed: violations.length === 0,
      score: Math.max(score, 0),
      violations
    };
  }

  /**
   * Assess privacy implications of content
   * WHY: Privacy protection is constitutionally required
   */
  async assessPrivacy(content: string): Promise<PrivacyAssessment> {
    const sensitivePatterns = [
      /\b\d{3}-\d{2}-\d{4}\b/, // SSN
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email
      /password|secret|confidential/i,
      /\b\d{16}\b/, // Credit card
      /api[_\s]?key|token|credential/i
    ];

    const sensitiveDataDetected = sensitivePatterns.some(pattern => pattern.test(content));
    const riskLevel = sensitiveDataDetected ? 'high' : 'low';

    return {
      passed: !sensitiveDataDetected,
      riskLevel,
      sensitiveDataDetected
    };
  }

  /**
   * Validate pattern for ALITA evolution
   * WHY: Evolution patterns must be safe and beneficial
   */
  async validatePattern(pattern: any): Promise<ValidationResult> {
    try {
      // Check if pattern promotes Constitutional AI principles
      if (!pattern.constitutionalCompliant) {
        return {
          passed: false,
          reason: 'Pattern does not meet Constitutional AI standards'
        };
      }

      // Verify pattern has positive impact
      if (pattern.userSatisfactionScore < 0.7) {
        return {
          passed: false,
          reason: 'Pattern does not show sufficient user satisfaction'
        };
      }

      return { passed: true };
    } catch (error) {
      return {
        passed: false,
        reason: `Pattern validation error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // Private validation methods
  private containsSpeculation(content: string): boolean {
    const speculationWords = /maybe|perhaps|possibly|might|could be|i think|probably/i;
    return speculationWords.test(content);
  }

  private containsReasoning(content: string): boolean {
    const reasoningWords = /because|the reason|this is due to|since|therefore|as a result/i;
    return reasoningWords.test(content);
  }

  private isActionable(content: string): boolean {
    const actionableWords = /can|should|will|here's how|follow these steps|you can|try/i;
    return actionableWords.test(content) || content.includes('```') || content.includes('1.');
  }

  private containsHarmfulContent(content: string): boolean {
    const harmfulPatterns = [
      /kill|murder|suicide|bomb|weapon/i,
      /hack|crack|steal|illegal/i,
      /hate|discrimination|bias/i
    ];
    return harmfulPatterns.some(pattern => pattern.test(content));
  }
}
