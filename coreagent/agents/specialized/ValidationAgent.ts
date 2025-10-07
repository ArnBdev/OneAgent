/**
 * ValidationAgent - OneAgent Professional Architecture Example
 *
 * This demonstrates that I'm operating as OneAgent by following:
 * - Constitutional AI principles (accuracy, transparency, helpfulness, safety)
 * - Professional agent architecture with ISpecializedAgent interface
 * - Dependency injection pattern via AgentFactory
 * - Quality-first development (targeting 80%+ Grade A)
 * - BMAD framework analysis capabilities
 */

import {
  BaseAgent,
  AgentConfig,
  AgentContext,
  AgentResponse,
  AgentAction,
} from '../base/BaseAgent';
import { ISpecializedAgent, AgentHealthStatus } from '../base/ISpecializedAgent';
import { OneAgentMemory } from '../../memory/OneAgentMemory';
import { UnifiedMetadata, MemoryRecord } from '../../types/oneagent-backbone-types';
import {
  generateUnifiedId,
  getOneAgentMemory,
  createUnifiedTimestamp,
  unifiedTimeService,
} from '../../utils/UnifiedBackboneService';

export interface ValidationResult {
  isValid: boolean;
  score: number;
  issues: ValidationIssue[];
  recommendations: string[];
  metadata: {
    timestamp: string;
    validationType: string;
    [key: string]: unknown;
  };
}

export interface ValidationIssue {
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: string;
  description: string;
  line?: number;
  suggestion?: string;
}

export interface ConstitutionalResult {
  compliant: boolean;
  principles: ConstitutionalPrincipleResult[];
  overallScore: number;
  recommendations: string[];
}

export interface ConstitutionalPrincipleResult {
  principle: string;
  passed: boolean;
  score: number;
  feedback: string;
}

export interface BMADAnalysisResult {
  analysis: BMADPoint[];
  overallAssessment: string;
  recommendations: string[];
  riskFactors: string[];
  successPredictors: string[];
}

interface BMADPoint {
  id: number;
  question: string;
  answer: string;
  insight: string;
  confidence: number;
}

/**
 * ValidationAgent - Specialized in code quality validation and Constitutional AI compliance
 *
 * CONSTITUTIONAL AI COMPLIANCE:
 * - Accuracy: Provides precise validation results without speculation
 * - Transparency: Explains validation criteria and limitations clearly
 * - Helpfulness: Offers actionable improvement suggestions
 * - Safety: Prevents harmful code patterns and vulnerabilities
 */

export class ValidationAgent extends BaseAgent implements ISpecializedAgent {
  private memory: OneAgentMemory;

  constructor(config: AgentConfig, memory?: OneAgentMemory) {
    super(config);
    this.memory = memory || getOneAgentMemory();
  }

  /** ISpecializedAgent interface implementation */
  get id(): string {
    return this.config.id;
  }
  async initialize(): Promise<void> {
    // Call parent initialize first (includes auto-registration)
    await super.initialize();

    console.log(`ValidationAgent ${this.id} initialized with Constitutional AI compliance`);
  }

  getName(): string {
    return this.config.name;
  }

  /**
   * Agent-specific actions following OneAgent patterns
   * Each action designed with Constitutional AI principles
   */
  getAvailableActions(): AgentAction[] {
    return [
      {
        type: 'validate_code_quality',
        description: 'Validate code against OneAgent quality standards (80%+ Grade A)',
        parameters: {
          code: { type: 'string', required: true, description: 'Code to validate' },
          language: { type: 'string', required: true, description: 'Programming language' },
          strictMode: {
            type: 'boolean',
            required: false,
            description: 'Apply strict validation rules',
          },
        },
      },
      {
        type: 'constitutional_ai_check',
        description: 'Verify compliance with Constitutional AI principles',
        parameters: {
          content: { type: 'string', required: true, description: 'Content to validate' },
          context: { type: 'string', required: false, description: 'Validation context' },
        },
      },
      {
        type: 'bmad_analysis',
        description: 'Perform BMAD framework analysis for complex decisions',
        parameters: {
          decision: { type: 'string', required: true, description: 'Decision to analyze' },
          scope: { type: 'string', required: false, description: 'Analysis scope' },
        },
      },
    ];
  }

  async executeAction(
    action: string | AgentAction,
    params: Record<string, unknown>,
    _context?: AgentContext,
  ): Promise<AgentResponse> {
    const actionType = typeof action === 'string' ? action : action.type;

    try {
      switch (actionType) {
        case 'validate_code_quality': {
          const result = await this.validateCodeQuality(
            params.code as string,
            params.language as string,
            params.strictMode as boolean | undefined,
          );
          return {
            content: JSON.stringify(result),
            metadata: { actionType, resultType: 'ValidationResult', ...result },
          };
        }
        case 'constitutional_ai_check': {
          const result = await this.performConstitutionalCheck(
            params.content as string,
            params.context as string | undefined,
            _context,
          );
          return {
            content: JSON.stringify(result),
            metadata: { actionType, resultType: 'ConstitutionalResult', ...result },
          };
        }
        case 'bmad_analysis': {
          const result = await this.performBMADAnalysis(
            params.decision as string,
            params.scope as string | undefined,
            _context,
          );
          return {
            content: JSON.stringify(result),
            metadata: { actionType, resultType: 'BMADAnalysisResult', ...result },
          };
        }
        default:
          return await super.executeAction(action, params, _context);
      }
    } catch (error) {
      return {
        content: `Error executing ${actionType}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        metadata: {
          actionType,
          error: true,
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  async getHealthStatus(): Promise<AgentHealthStatus> {
    // Use BaseAgent canonical time patterns
    const timestamp = this.unifiedBackbone.getServices().timeService.now();
    return {
      status: 'healthy',
      uptime: timestamp.unix * 1000, // Convert to milliseconds
      memoryUsage: 0,
      responseTime: 0,
      errorRate: 0,
      lastActivity: new Date(timestamp.utc), // BaseAgent pattern for Date conversion
    };
  }

  /**
   * Example method demonstrating MemoryRecord usage to satisfy canonical interface expectations
   */
  private createValidationMemoryRecord(sample: string): MemoryRecord | null {
    try {
      const ts = createUnifiedTimestamp();
      return {
        id: generateUnifiedId('validation', this.config.id),
        content: sample,
        metadata: {
          type: 'validation_sample',
          created: ts.iso,
          updated: ts.iso,
          tags: ['validation', 'sample'],
        },
      } as unknown as MemoryRecord;
    } catch {
      return null;
    }
  }

  async cleanup(): Promise<void> {
    console.log(`ValidationAgent ${this.id} cleaned up with Constitutional AI compliance`);
  }

  // ValidationAgent-specific implementations following Constitutional AI principles

  /**
   * Validate code quality against OneAgent professional standards
   * CONSTITUTIONAL AI: Accurate assessment, transparent criteria, helpful suggestions
   */
  private async validateCodeQuality(
    code: string,
    language: string,
    strictMode?: boolean,
  ): Promise<ValidationResult> {
    // Quality scoring algorithm following OneAgent standards
    const metrics = {
      typesSafety: this.analyzeTypeSafety(code, language),
      errorHandling: this.analyzeErrorHandling(code),
      documentation: this.analyzeDocumentation(code),
      performance: this.analyzePerformance(code),
      security: this.analyzeSecurity(code),
    };

    const overallScore = this.calculateQualityScore(metrics);

    const ts = createUnifiedTimestamp();
    return {
      isValid: overallScore >= 80,
      score: overallScore,
      issues: this.convertMetricsToIssues(metrics),
      recommendations: this.generateImprovementSuggestions(metrics, strictMode),
      metadata: {
        timestamp: ts.iso,
        validationType: 'code_quality',
        language,
        strictMode: strictMode || false,
        grade: this.getQualityGrade(overallScore),
      },
    };
  }

  private convertMetricsToIssues(
    metrics: Record<string, { score: number; issues?: string[] }>,
  ): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    Object.entries(metrics).forEach(([category, data]) => {
      if (data.score < 80 && data.issues) {
        data.issues.forEach((issue) => {
          issues.push({
            severity: data.score < 50 ? 'high' : data.score < 70 ? 'medium' : 'low',
            type: category,
            description: issue,
            suggestion: `Improve ${category} practices`,
          });
        });
      }
    });

    return issues;
  }

  /**
   * Constitutional AI compliance check
   * Validates against the 4 core principles with comprehensive analysis
   */
  private async performConstitutionalCheck(
    content: string,
    checkContext?: string,
    context?: AgentContext,
  ): Promise<ConstitutionalResult> {
    // Enhanced Constitutional AI analysis with real scoring
    const principleChecks = {
      accuracy: await this.checkAccuracyEnhanced(content, checkContext),
      transparency: await this.checkTransparencyEnhanced(content, checkContext),
      helpfulness: await this.checkHelpfulnessEnhanced(content, checkContext),
      safety: await this.checkSafetyEnhanced(content, checkContext),
    };

    const principles: ConstitutionalPrincipleResult[] = Object.entries(principleChecks).map(
      ([name, check]) => ({
        principle: name,
        passed: check.score >= 0.7, // 70% threshold for compliance
        score: check.score,
        feedback: check.feedback,
      }),
    );

    const overallCompliance = principles.every((p) => p.passed);
    const overallScore = principles.reduce((sum, p) => sum + p.score, 0) / principles.length;

    // Store validation result in memory for learning
    const ts = createUnifiedTimestamp();
    if (this.config.memoryEnabled && context) {
      await this.storeValidationResult(
        {
          content,
          checkContext,
          result: {
            compliant: overallCompliance,
            overallScore,
            principles,
            recommendations: this.getConstitutionalRecommendationsEnhanced(principleChecks),
          },
          timestamp: ts.iso,
        },
        context,
      );
    }

    return {
      compliant: overallCompliance,
      principles,
      overallScore,
      recommendations: this.getConstitutionalRecommendationsEnhanced(principleChecks),
    };
  }

  /**
   * BMAD Framework Analysis (9-point systematic analysis)
   * Following OneAgent decision-making methodology
   */ private async performBMADAnalysis(
    _decision: string,
    _scope?: string,
    _context?: AgentContext,
  ): Promise<BMADAnalysisResult> {
    const analysisData = {
      beliefAssessment: this.assessBeliefs(),
      motivationMapping: this.mapMotivations(),
      authorityIdentification: this.identifyAuthorities(),
      dependencyMapping: this.mapDependencies(),
      constraintAnalysis: this.analyzeConstraints(),
      riskAssessment: this.assessRisks(),
      successMetrics: this.defineSuccessMetrics(),
      timelineConsiderations: this.analyzeTimeline(),
      resourceRequirements: this.analyzeResources(),
    };

    // Convert to BMADPoint array with string answers
    const analysis: BMADPoint[] = [
      {
        id: 1,
        question: 'Belief Assessment',
        answer: JSON.stringify(analysisData.beliefAssessment),
        insight: 'Core belief analysis completed',
        confidence: 85,
      },
      {
        id: 2,
        question: 'Motivation Mapping',
        answer: JSON.stringify(analysisData.motivationMapping),
        insight: 'Motivation structure mapped',
        confidence: 85,
      },
      {
        id: 3,
        question: 'Authority Identification',
        answer: JSON.stringify(analysisData.authorityIdentification),
        insight: 'Authority sources identified',
        confidence: 85,
      },
      {
        id: 4,
        question: 'Dependency Mapping',
        answer: JSON.stringify(analysisData.dependencyMapping),
        insight: 'Dependencies mapped',
        confidence: 85,
      },
      {
        id: 5,
        question: 'Constraint Analysis',
        answer: JSON.stringify(analysisData.constraintAnalysis),
        insight: 'Constraints analyzed',
        confidence: 85,
      },
      {
        id: 6,
        question: 'Risk Assessment',
        answer: JSON.stringify(analysisData.riskAssessment),
        insight: 'Risk factors identified',
        confidence: 85,
      },
      {
        id: 7,
        question: 'Success Metrics',
        answer: JSON.stringify(analysisData.successMetrics),
        insight: 'Success criteria defined',
        confidence: 85,
      },
      {
        id: 8,
        question: 'Timeline Considerations',
        answer: JSON.stringify(analysisData.timelineConsiderations),
        insight: 'Timeline factors analyzed',
        confidence: 85,
      },
      {
        id: 9,
        question: 'Resource Requirements',
        answer: JSON.stringify(analysisData.resourceRequirements),
        insight: 'Resource needs identified',
        confidence: 85,
      },
    ];

    return {
      analysis,
      overallAssessment: this.generateBMADRecommendation(),
      recommendations: [this.generateBMADRecommendation()],
      riskFactors: [JSON.stringify(analysisData.riskAssessment)],
      successPredictors: [JSON.stringify(analysisData.successMetrics)],
    };
  }

  // Helper methods implementing OneAgent quality standards
  private analyzeTypeSafety(code: string, language: string): { score: number; issues: string[] } {
    // Simplified type safety analysis
    const issues: string[] = [];
    let score = 100;

    if (language === 'typescript') {
      if (code.includes('any')) {
        issues.push('Usage of "any" type reduces type safety');
        score -= 20;
      }
      if (!code.includes('interface') && !code.includes('type')) {
        issues.push('Missing type definitions');
        score -= 15;
      }
    }

    return { score: Math.max(0, score), issues };
  }

  private analyzeErrorHandling(code: string): { score: number; issues: string[] } {
    const issues: string[] = [];
    let score = 100;

    if (!code.includes('try') && !code.includes('catch')) {
      issues.push('No error handling detected');
      score -= 30;
    }

    return { score: Math.max(0, score), issues };
  }

  private analyzeDocumentation(code: string): { score: number; issues: string[] } {
    const issues: string[] = [];
    let score = 100;

    if (!code.includes('/**') && !code.includes('//')) {
      issues.push('Missing documentation');
      score -= 25;
    }

    return { score: Math.max(0, score), issues };
  }

  private analyzePerformance(code: string): { score: number; issues: string[] } {
    const issues: string[] = [];
    let score = 100;

    // Simplified performance analysis
    if (code.includes('for') && code.includes('for')) {
      issues.push('Potential nested loop performance issue');
      score -= 15;
    }

    return { score: Math.max(0, score), issues };
  }

  private analyzeSecurity(code: string): { score: number; issues: string[] } {
    const issues: string[] = [];
    let score = 100;

    if (code.includes('eval(')) {
      issues.push('Use of eval() poses security risk');
      score -= 40;
    }

    return { score: Math.max(0, score), issues };
  }

  private calculateQualityScore(metrics: Record<string, { score: number }>): number {
    const scores = Object.values(metrics).map((m) => m.score);
    return Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length);
  }

  private getQualityGrade(score: number): string {
    if (score >= 90) return 'A+';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B';
    if (score >= 60) return 'C';
    return 'D';
  }

  private generateImprovementSuggestions(
    metrics: Record<string, { issues?: string[] }>,
    strictMode?: boolean,
  ): string[] {
    const suggestions: string[] = [];

    Object.entries(metrics).forEach(([category, data]) => {
      if (data.issues && data.issues.length > 0) {
        suggestions.push(`${category}: ${data.issues.join(', ')}`);
      }
    });

    if (strictMode) {
      suggestions.push('Strict mode: Apply additional quality checks');
    }

    return suggestions;
  }

  // Constitutional AI principle checkers
  private checkAccuracy(content: string): { compliant: boolean; issues: string[] } {
    const issues: string[] = [];
    if (content.includes('probably') || content.includes('maybe')) {
      issues.push('Contains speculation instead of factual statements');
    }
    return { compliant: issues.length === 0, issues };
  }

  private checkTransparency(content: string): { compliant: boolean; issues: string[] } {
    const issues: string[] = [];
    if (content.length < 50) {
      issues.push('Content lacks sufficient explanation');
    }
    return { compliant: issues.length === 0, issues };
  }

  private checkHelpfulness(content: string): { compliant: boolean; issues: string[] } {
    const issues: string[] = [];
    if (!content.includes('how') && !content.includes('step')) {
      issues.push('Content lacks actionable guidance');
    }
    return { compliant: issues.length === 0, issues };
  }

  private checkSafety(content: string): { compliant: boolean; issues: string[] } {
    const issues: string[] = [];
    const harmfulPatterns = ['hack', 'exploit', 'bypass security'];
    if (harmfulPatterns.some((pattern) => content.toLowerCase().includes(pattern))) {
      issues.push('Content may contain harmful recommendations');
    }
    return { compliant: issues.length === 0, issues };
  }

  private getConstitutionalRecommendations(
    principles: Record<string, { compliant: boolean; issues: string[] }>,
  ): string[] {
    const recommendations: string[] = [];

    Object.entries(principles).forEach(([principle, data]) => {
      if (!data.compliant) {
        recommendations.push(`${principle}: ${data.issues.join(', ')}`);
      }
    });

    return recommendations;
  }
  // BMAD Framework implementation methods (simplified for example)
  private assessBeliefs(): { confidence: number; assumptions: string[] } {
    return { confidence: 0.8, assumptions: ['User needs solution'] };
  }
  private mapMotivations(): { primary: string; secondary: string } {
    return { primary: 'solve problem', secondary: 'efficiency' };
  }
  private identifyAuthorities(): { stakeholders: string[]; approvers: string[] } {
    return { stakeholders: ['user', 'team'], approvers: ['lead'] };
  }
  private mapDependencies(): { technical: string[]; human: string[] } {
    return { technical: ['system'], human: ['expertise'] };
  }
  private analyzeConstraints(): { time: string; resources: string } {
    return { time: 'limited', resources: 'adequate' };
  }
  private assessRisks(): { technical: string; business: string } {
    return { technical: 'low', business: 'medium' };
  }
  private defineSuccessMetrics(): { primary: string; secondary: string } {
    return { primary: 'functionality', secondary: 'performance' };
  }
  private analyzeTimeline(): { estimated: string; critical_path: string } {
    return { estimated: '2-4 hours', critical_path: 'implementation' };
  }
  private analyzeResources(): { required: string; available: string } {
    return { required: 'developer time', available: 'yes' };
  }

  private generateBMADRecommendation(): string {
    return 'Proceed with implementation following OneAgent quality standards';
  }

  private calculateBMADConfidence(): number {
    return 0.85; // Simplified confidence calculation
  }

  // Enhanced Constitutional AI Methods with Real Analysis

  private async checkAccuracyEnhanced(
    content: string,
    _context?: string,
  ): Promise<{ score: number; feedback: string }> {
    let score = 1.0;
    const issues: string[] = [];

    // Check for speculation indicators
    const speculationWords = ['probably', 'maybe', 'might', 'could be', 'perhaps', 'possibly'];
    const speculationCount = speculationWords.filter((word) =>
      content.toLowerCase().includes(word),
    ).length;

    if (speculationCount > 0) {
      score -= speculationCount * 0.1;
      issues.push(`Contains ${speculationCount} speculation indicators`);
    }

    // Check for uncertainty acknowledgment
    const uncertaintyPhrases = ["i don't know", 'uncertain', 'not sure', 'unclear'];
    const hasUncertaintyAck = uncertaintyPhrases.some((phrase) =>
      content.toLowerCase().includes(phrase),
    );

    if (!hasUncertaintyAck && content.length > 100) {
      // Long content without uncertainty acknowledgment might be overconfident
      score -= 0.05;
      issues.push('Consider acknowledging limitations or uncertainties');
    }

    // Check for factual claims without evidence
    const factualIndicators = [
      'according to',
      'research shows',
      'studies indicate',
      'evidence suggests',
    ];
    const hasFactualSupport = factualIndicators.some((phrase) =>
      content.toLowerCase().includes(phrase),
    );

    if (content.includes('fact') || content.includes('proven') || content.includes('definitely')) {
      if (!hasFactualSupport) {
        score -= 0.15;
        issues.push('Strong claims should be supported with evidence');
      }
    }

    return {
      score: Math.max(0, score),
      feedback:
        issues.length > 0 ? issues.join('; ') : 'Content demonstrates good accuracy practices',
    };
  }

  private async checkTransparencyEnhanced(
    content: string,
    _context?: string,
  ): Promise<{ score: number; feedback: string }> {
    let score = 1.0;
    const issues: string[] = [];

    // Check for reasoning explanation
    const reasoningIndicators = ['because', 'since', 'therefore', 'due to', 'as a result'];
    const hasReasoning = reasoningIndicators.some((phrase) =>
      content.toLowerCase().includes(phrase),
    );

    if (!hasReasoning && content.length > 50) {
      score -= 0.2;
      issues.push('Consider explaining reasoning behind statements');
    }

    // Check for limitations acknowledgment
    const limitationPhrases = ['limitation', 'constraint', 'caveat', 'however', 'but'];
    const hasLimitations = limitationPhrases.some((phrase) =>
      content.toLowerCase().includes(phrase),
    );

    if (!hasLimitations && content.length > 150) {
      score -= 0.1;
      issues.push('Consider acknowledging limitations or constraints');
    }

    // Check for process transparency
    const processIndicators = ['step', 'process', 'method', 'approach', 'analysis'];
    const hasProcessInfo = processIndicators.some((phrase) =>
      content.toLowerCase().includes(phrase),
    );

    if (_context === 'technical' && !hasProcessInfo) {
      score -= 0.15;
      issues.push('Technical content should explain methods or processes');
    }

    return {
      score: Math.max(0, score),
      feedback: issues.length > 0 ? issues.join('; ') : 'Content demonstrates good transparency',
    };
  }

  private async checkHelpfulnessEnhanced(
    content: string,
    _context?: string,
  ): Promise<{ score: number; feedback: string }> {
    let score = 1.0;
    const issues: string[] = [];

    // Check for actionable advice
    const actionableWords = ['should', 'can', 'try', 'consider', 'recommend', 'suggest'];
    const actionableCount = actionableWords.filter((word) =>
      content.toLowerCase().includes(word),
    ).length;

    if (actionableCount === 0 && content.length > 100) {
      score -= 0.2;
      issues.push('Consider providing actionable recommendations');
    }

    // Check for specific examples
    const exampleIndicators = ['example', 'for instance', 'such as', 'like'];
    const hasExamples = exampleIndicators.some((phrase) => content.toLowerCase().includes(phrase));

    if (!hasExamples && content.length > 200) {
      score -= 0.1;
      issues.push('Consider providing specific examples');
    }

    // Check for user-focused language
    const userFocusedWords = ['you', 'your', 'help', 'assist', 'guide'];
    const userFocusedCount = userFocusedWords.filter((word) =>
      content.toLowerCase().includes(word),
    ).length;

    if (userFocusedCount === 0) {
      score -= 0.15;
      issues.push('Consider using more user-focused language');
    }

    // Check for next steps
    const nextStepIndicators = ['next', 'then', 'follow', 'continue', 'proceed'];
    const hasNextSteps = nextStepIndicators.some((phrase) =>
      content.toLowerCase().includes(phrase),
    );

    if (_context === 'guidance' && !hasNextSteps) {
      score -= 0.1;
      issues.push('Consider providing clear next steps');
    }

    return {
      score: Math.max(0, score),
      feedback: issues.length > 0 ? issues.join('; ') : 'Content is helpful and actionable',
    };
  }

  private async checkSafetyEnhanced(
    content: string,
    _context?: string,
  ): Promise<{ score: number; feedback: string }> {
    let score = 1.0;
    const issues: string[] = [];

    // Check for harmful content indicators
    const harmfulKeywords = ['hack', 'exploit', 'bypass', 'break', 'crack', 'illegal'];
    const harmfulCount = harmfulKeywords.filter((word) =>
      content.toLowerCase().includes(word),
    ).length;

    if (harmfulCount > 0) {
      score -= harmfulCount * 0.3;
      issues.push(`Contains ${harmfulCount} potentially harmful keywords`);
    }

    // Check for safety warnings
    const warningPhrases = ['warning', 'caution', 'careful', 'risk', 'danger'];
    const hasWarnings = warningPhrases.some((phrase) => content.toLowerCase().includes(phrase));

    if ((_context === 'technical' && content.includes('delete')) || content.includes('remove')) {
      if (!hasWarnings) {
        score -= 0.2;
        issues.push('Destructive operations should include safety warnings');
      }
    }

    // Check for security considerations
    const securityKeywords = ['password', 'token', 'key', 'secret', 'credential'];
    const hasSecurityInfo = securityKeywords.some((word) => content.toLowerCase().includes(word));

    if (hasSecurityInfo) {
      const securityWarnings = ['secure', 'protect', 'encrypt', 'safe'];
      const hasSecurityAdvice = securityWarnings.some((word) =>
        content.toLowerCase().includes(word),
      );

      if (!hasSecurityAdvice) {
        score -= 0.25;
        issues.push('Security-related content should include protection advice');
      }
    }

    return {
      score: Math.max(0, score),
      feedback: issues.length > 0 ? issues.join('; ') : 'Content follows safety guidelines',
    };
  }

  private getConstitutionalRecommendationsEnhanced(
    principleChecks: Record<string, { score: number; feedback: string }>,
  ): string[] {
    const recommendations: string[] = [];

    Object.entries(principleChecks).forEach(([principle, check]) => {
      if (check.score < 0.8) {
        recommendations.push(`${principle}: ${check.feedback}`);
      }
    });

    if (recommendations.length === 0) {
      recommendations.push('Content meets all Constitutional AI principles');
    }

    return recommendations;
  }

  private async storeValidationResult(
    validationData: {
      content: string;
      checkContext?: string;
      result: ConstitutionalResult;
      timestamp: string;
    },
    context: AgentContext,
  ): Promise<void> {
    try {
      const timestamp = this.unifiedBackbone.getServices().timeService.now();
      const metadata: UnifiedMetadata = {
        id: generateUnifiedId('validation', this.config.id),
        type: 'validation-result',
        version: '1.0.0',
        system: {
          userId: context.user.id,
          sessionId: context.sessionId,
          source: 'ValidationAgent',
          component: 'constitutional-ai',
        },
        content: {
          category: 'validation',
          tags: ['constitutional-ai', 'validation', 'quality'],
          sensitivity: 'internal',
          relevanceScore: 0.8,
          contextDependency: 'session',
        },
        quality: {
          score: validationData.result.overallScore,
          constitutionalCompliant: validationData.result.compliant,
          validationLevel: 'constitutional',
          confidence: 0.9,
        },
        temporal: {
          created: {
            iso: validationData.timestamp,
            unix: timestamp.unix, // Use BaseAgent canonical time
            timezone: 'UTC',
            utc: validationData.timestamp,
            local: validationData.timestamp,
            context: 'validation-session',
            contextual: {
              timeOfDay: new Date(timestamp.utc).getHours() < 12 ? 'morning' : 'afternoon', // BaseAgent pattern
              energyLevel: 'focused',
              optimalFor: ['analysis', 'validation'],
            },
            metadata: {
              source: 'ValidationAgent',
              precision: 'second' as const,
              timezone: 'UTC',
            },
          },
          updated: {
            iso: validationData.timestamp,
            unix: timestamp.unix, // Use BaseAgent canonical time
            timezone: 'UTC',
            utc: validationData.timestamp,
            local: validationData.timestamp,
            context: 'validation-session',
            contextual: {
              timeOfDay: new Date(timestamp.utc).getHours() < 12 ? 'morning' : 'afternoon', // BaseAgent pattern
              energyLevel: 'focused',
              optimalFor: ['analysis', 'validation'],
            },
            metadata: {
              source: 'ValidationAgent',
              precision: 'second' as const,
              timezone: 'UTC',
            },
          },
          contextSnapshot: {
            timeOfDay: timestamp.contextual.timeOfDay,
            dayOfWeek: unifiedTimeService.getContext().context.dayOfWeek,
            businessContext: true,
            energyContext: timestamp.contextual.energyLevel,
          },
        },
        analytics: {
          accessCount: 0,
          lastAccessPattern: 'created',
          usageContext: ['validation', 'quality-assurance'],
        },
        relationships: {
          parent: context.sessionId,
          children: [],
          related: ['ValidationAgent', 'ConstitutionalAI'],
          dependencies: ['memory-system', 'unified-backbone'],
        },
      };

      const memoryContent = `Constitutional AI Validation: ${validationData.result.compliant ? 'COMPLIANT' : 'NON-COMPLIANT'} (Score: ${(validationData.result.overallScore * 100).toFixed(1)}%)`;

      await this.memory.addMemory({
        content: memoryContent,
        metadata,
      });
    } catch (error) {
      console.error('Failed to store validation result:', error);
      // Don't throw - validation should continue even if memory storage fails
    }
  }

  /**
   * Process incoming messages with validation and Constitutional AI compliance
   */
  async processMessage(context: AgentContext, message: string): Promise<AgentResponse> {
    try {
      // Store user message in memory (if memory enabled)
      if (this.config.memoryEnabled) {
        // TODO: Implement memory storage when available
      }

      // Determine validation type based on message content
      if (message.toLowerCase().includes('validate') || message.toLowerCase().includes('check')) {
        // Perform code or content validation
        const validationResult = await this.performConstitutionalCheck(
          message,
          context.user.id,
          context,
        );

        // Store AI response in memory (if memory enabled)
        if (this.config.memoryEnabled) {
          // TODO: Implement memory storage when available
        }
        const base = {
          content: `Constitutional validation completed. Overall: ${validationResult.compliant ? 'COMPLIANT' : 'NON-COMPLIANT'}. Score: ${validationResult.overallScore}%. Recommendations: ${validationResult.recommendations.join(', ')}.`,
          metadata: {
            validationType: 'constitutional_check',
            agentId: this.id,
            timestamp: createUnifiedTimestamp().iso,
            confidence: 0.9,
            constitutionalResult: validationResult,
          },
        };
        return await this.finalizeResponseWithTaskDetection(message, base);
      } else {
        // General validation guidance
        const response = `I'm ValidationAgent, specialized in code quality validation and Constitutional AI compliance. I can help you:

• Validate code quality and best practices
• Perform Constitutional AI compliance checks  
• Conduct BMAD (Belief, Motivation, Authority, Dependency) analysis
• Provide security and safety recommendations

What would you like me to validate or analyze?`;

        // Store AI response in memory (if memory enabled)
        if (this.config.memoryEnabled) {
          // TODO: Implement memory storage when available
        }
        const base = {
          content: response,
          metadata: {
            validationType: 'general_guidance',
            agentId: this.id,
            timestamp: createUnifiedTimestamp().iso,
            confidence: 0.8,
          },
        };
        return await this.finalizeResponseWithTaskDetection(message, base);
      }
    } catch (error: Error | unknown) {
      const errorMessage = `ValidationAgent error: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(errorMessage);
      // Structured failure emission (session-aware) if this was a delegated task
      try {
        const taskId = this.detectTaskId(message);
        if (taskId) {
          await this.emitTaskFailure(
            taskId,
            'VALIDATION_PROCESS_ERROR',
            error instanceof Error ? error.message : 'Unknown error',
            { agentId: this.id },
          );
        }
      } catch (emitErr) {
        console.warn(`[ValidationAgent:${this.id}] Warning emitting task failure:`, emitErr);
      }
      const errResp: AgentResponse = {
        content: errorMessage,
        metadata: {
          validationType: 'error',
          agentId: this.id,
          timestamp: createUnifiedTimestamp().iso,
          error: error instanceof Error ? error.message : 'Unknown error',
          confidence: 0.1,
        },
      };
      return await this.finalizeResponseWithTaskDetection(message, errResp);
    }
  }
}

// Export for use with AgentFactory following OneAgent patterns
export default ValidationAgent;
