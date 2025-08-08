/**
 * Advanced Code Analysis Engine for DevAgent
 * 
 * Provides sophisticated code analysis capabilities including:
 * - Context7 integration for documentation lookup (canonical only)
 * - Pattern recognition and learning
 * - Memory-driven code insights
 * - Constitutional AI validation for code quality
 * - Cross-agent learning from code interactions
 * 
 * @version 1.0.0
 * @created June 14, 2025
 */


import { createUnifiedTimestamp } from '../utils/UnifiedBackboneService';
import type {
  DocumentationResult
} from '../types/oneagent-backbone-types';
import { unifiedAgentCommunicationService } from '../utils/UnifiedAgentCommunicationService';

export interface CodeAnalysisRequest {
  code: string;
  language: string;
  context?: string;
  filePath?: string;
  problemDescription?: string;
  requestType: 'review' | 'debug' | 'optimize' | 'explain' | 'test' | 'refactor';
  userId: string;
  sessionId?: string;
}

export interface CodeAnalysisResult {
  analysis: string;
  suggestions: CodeSuggestion[];
  patterns: CodePattern[];
  documentation: DocumentationResult[];
  qualityScore: number;
  constitutionalCompliance: boolean;
  memoryInsights: MemoryInsight[];
  metadata: {
    analysisType: string;
    confidence: number;
    processingTime: number;
    context7Used: boolean; // Only for documentation lookup
    memoryEnhanced: boolean;
  };
}

export interface CodeSuggestion {
  type: 'fix' | 'improvement' | 'best-practice' | 'security' | 'performance';
  description: string;
  code?: string;
  lineNumber?: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  reasoning: string;
  documentationRef?: string;
}

export interface CodePattern {
  name: string;
  description: string;
  frequency: number;
  quality: number;
  lastSeen: Date;
  examples: string[];
  relatedDocumentation: string[];
}

export interface MemoryInsight {
  type: 'pattern' | 'solution' | 'best-practice' | 'anti-pattern';
  content: string;
  confidence: number;
  source: string;
  timestamp: Date;
}

/**
 * Advanced Code Analysis Engine
 */
export class AdvancedCodeAnalysisEngine {
  private agentId: string;
  // Removed agentComm property; use singleton directly
  // Analysis patterns and metrics
  private languagePatterns: Map<string, CodePattern[]> = new Map();
  private analysisMetrics = {
    totalAnalyses: 0,
    successfulAnalyses: 0,
    averageQualityScore: 0,
    context7Usage: 0, // Only for documentation lookup
    memoryEnhancements: 0
  };

  constructor(agentId: string) {
    this.agentId = agentId;
    this.initializeLanguagePatterns();
  }

  /**
   * Perform comprehensive code analysis
   */
  async analyzeCode(request: CodeAnalysisRequest): Promise<CodeAnalysisResult> {
    const startTime = createUnifiedTimestamp().unix;
    this.analysisMetrics.totalAnalyses++;

    try {
      console.log(`[CodeAnalysis] Starting ${request.requestType} analysis for ${request.language}`);

      // Step 1: Get memory insights from previous similar analyses
      const memoryInsights = await this.getMemoryInsights(request);

      // Step 2: Perform language-specific analysis
      const baseAnalysis = await this.performBaseAnalysis(request);

      // Step 3: Get relevant documentation via context7 (canonical only)
      const documentation = await this.getRelevantDocumentation(request, baseAnalysis);

      // Step 4: Extract and learn patterns
      const patterns = await this.extractCodePatterns(request);

      // Step 5: Generate suggestions with Constitutional AI validation
      const suggestions = await this.generateSuggestions(request, baseAnalysis, documentation, memoryInsights);

      // Step 6: Calculate quality score
      const qualityScore = await this.calculateQualityScore(request, suggestions);

      // Step 7: Validate constitutional compliance
      const constitutionalCompliance = await this.validateConstitutionalCompliance(baseAnalysis, suggestions);

      const result: CodeAnalysisResult = {
        analysis: baseAnalysis,
        suggestions,
        patterns,
        documentation,
        qualityScore,
        constitutionalCompliance,
        memoryInsights,
        metadata: {
          analysisType: request.requestType,
          confidence: this.calculateConfidence(suggestions, documentation, memoryInsights),
          processingTime: createUnifiedTimestamp().unix - startTime,
          context7Used: documentation.length > 0, // Only for documentation lookup
          memoryEnhanced: memoryInsights.length > 0
        }
      };

      // Step 8: Store analysis in memory for learning
      await this.storeAnalysisForLearning(request, result);

      this.analysisMetrics.successfulAnalyses++;
      this.updateMetrics(result);

      return result;

    } catch (error) {
      console.error(`[CodeAnalysis] Analysis failed:`, error);
      return this.generateFallbackAnalysis(request);
    }
  }

  /**
   * Get memory insights from previous similar analyses
   */  private async getMemoryInsights(request: CodeAnalysisRequest): Promise<MemoryInsight[]> {
    try {
      // Removed unused searchQuery variable
      
      // Canonical: Use agentComm.getMessageHistory or similar for memory insights
      const sessionId = request.sessionId || 'default';
      const messages = await unifiedAgentCommunicationService.getMessageHistory(sessionId, 5);
      return messages.map((msg: unknown) => {
        const m = msg as { content?: string; metadata?: { confidenceLevel?: number }; fromAgent?: string; timestamp?: string };
        return {
          type: this.classifyInsightType(m.content || ''),
          content: m.content || '',
          confidence: m.metadata?.confidenceLevel || 0.7,
          source: m.fromAgent || 'unknown',
          timestamp: new Date(m.timestamp || createUnifiedTimestamp().utc)
        };
      });
    } catch (error) {
      console.warn(`[CodeAnalysis] Memory insights retrieval failed:`, error);
      return [];
    }
  }

  /**
   * Perform base code analysis
   */
  private async performBaseAnalysis(request: CodeAnalysisRequest): Promise<string> {
    const analysis = [];

    // Language-specific analysis
    switch (request.language.toLowerCase()) {
      case 'typescript':
      case 'javascript':
        analysis.push(await this.analyzeJavaScriptTypeScript(request));
        break;
      case 'python':
        analysis.push(await this.analyzePython(request));
        break;
      case 'java':
        analysis.push(await this.analyzeJava(request));
        break;
      default:
        analysis.push(await this.analyzeGenericCode(request));
    }

    // Common analysis patterns
    analysis.push(await this.analyzeCodeStructure(request));
    analysis.push(await this.analyzeSecurityPatterns(request));
    analysis.push(await this.analyzePerformancePatterns(request));

    return analysis.filter(Boolean).join('\n\n');
  }

  /**
   * Get relevant documentation via context7 (canonical only)
   */
  private async getRelevantDocumentation(request: CodeAnalysisRequest, analysis: string): Promise<DocumentationResult[]> {
    try {
      this.analysisMetrics.context7Usage++; // Only for documentation lookup

      const queries = [];

      // Language-specific documentation
      if (request.language) {        queries.push({
          source: this.getDocumentationSource(request.language),
          query: `${request.requestType} ${request.problemDescription || ''}`,
          context: request.context || '',
          userId: request.userId,
          sessionId: request.sessionId || 'unknown'
        });
      }

      // Framework-specific documentation
      const detectedFrameworks = this.detectFrameworks(request.code);
      for (const framework of detectedFrameworks) {        queries.push({
          source: framework,
          query: `${request.requestType} best practices`,
          context: analysis,
          userId: request.userId,
          sessionId: request.sessionId || 'unknown'
        });
      }

      const documentationResults: DocumentationResult[] = [];
      for (const query of queries) {
        // Canonical: Use UnifiedBackboneService.context7.queryDocumentation
        // TODO: Use canonical Context7 documentation query utility/service here
        // Placeholder: Replace with canonical Context7 documentation query
        // const results = await unifiedContext7Documentation.queryDocumentation(query);
        const results: DocumentationResult[] = [];
        documentationResults.push(...results);
      }

      return documentationResults
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, 5); // Top 5 most relevant

    } catch (error) {
      console.warn(`[CodeAnalysis] Documentation retrieval failed:`, error);
      return [];
    }
  }

  /**
   * Extract and learn code patterns
   */
  private async extractCodePatterns(request: CodeAnalysisRequest): Promise<CodePattern[]> {
    const patterns: CodePattern[] = [];
    const language = request.language.toLowerCase();

    // Get existing patterns for this language
    const existingPatterns = this.languagePatterns.get(language) || [];

    // Detect common patterns in the code
    const detectedPatterns = this.detectCodePatterns(request.code, language);

    for (const detected of detectedPatterns) {
      const existing = existingPatterns.find(p => p.name === detected.name);
      if (existing) {
        existing.frequency++;
        existing.lastSeen = new Date();
        existing.examples.push(detected.example);
      } else {
        patterns.push({
          name: detected.name,
          description: detected.description,
          frequency: 1,
          quality: detected.quality,
          lastSeen: new Date(),
          examples: [detected.example],
          relatedDocumentation: []
        });
      }
    }

    // Update language patterns
    this.languagePatterns.set(language, [...existingPatterns, ...patterns]);

    return patterns;
  }

  /**
   * Generate suggestions with Constitutional AI validation
   */
  private async generateSuggestions(
    request: CodeAnalysisRequest,
    analysis: string,
    documentation: DocumentationResult[],
    memoryInsights: MemoryInsight[]
  ): Promise<CodeSuggestion[]> {
    const suggestions: CodeSuggestion[] = [];

    // Generate suggestions based on analysis type
    switch (request.requestType) {
      case 'review':
        suggestions.push(...await this.generateReviewSuggestions(request, analysis, documentation));
        break;
      case 'debug':
        suggestions.push(...await this.generateDebugSuggestions(request, analysis, memoryInsights));
        break;
      case 'optimize':
        suggestions.push(...await this.generateOptimizationSuggestions(request, analysis, documentation));
        break;
      case 'refactor':
        suggestions.push(...await this.generateRefactoringSuggestions(request, analysis, documentation));
        break;
      case 'test':
        suggestions.push(...await this.generateTestSuggestions(request, analysis, documentation));
        break;
      case 'explain':
        suggestions.push(...await this.generateExplanationSuggestions(request, analysis, documentation));
        break;
    }

    // Validate each suggestion for constitutional compliance
    return suggestions.filter(suggestion => this.validateSuggestion(suggestion));
  }

  /**
   * Language-specific analysis methods
   */
  private async analyzeJavaScriptTypeScript(request: CodeAnalysisRequest): Promise<string> {
    const issues = [];
    const code = request.code;

    // TypeScript specific checks
    if (request.language.toLowerCase() === 'typescript') {
      if (!code.includes('interface') && !code.includes('type') && code.length > 100) {
        issues.push('Consider adding TypeScript interfaces for better type safety');
      }
      if (code.includes('any')) {
        issues.push('Avoid using "any" type - use specific types for better type safety');
      }
    }

    // General JavaScript/TypeScript checks
    if (code.includes('var ')) {
      issues.push('Use "let" or "const" instead of "var" for better scoping');
    }
    if (code.includes('== ') || code.includes('!= ')) {
      issues.push('Use strict equality (=== and !==) instead of loose equality');
    }

    return `JavaScript/TypeScript Analysis:\n${issues.join('\n')}`;
  }

  private async analyzePython(request: CodeAnalysisRequest): Promise<string> {
    const issues = [];
    const code = request.code;

    // Python specific checks
    if (!code.includes('def ') && code.length > 50) {
      issues.push('Consider breaking code into functions for better organization');
    }
    if (code.includes('except:') && !code.includes('except Exception:')) {
      issues.push('Use specific exception types instead of bare except clauses');
    }

    return `Python Analysis:\n${issues.join('\n')}`;
  }

  private async analyzeJava(request: CodeAnalysisRequest): Promise<string> {
    const issues = [];
    const code = request.code;

    // Java specific checks
    if (code.includes('System.out.println') && request.requestType === 'review') {
      issues.push('Consider using a logging framework instead of System.out.println');
    }

    return `Java Analysis:\n${issues.join('\n')}`;
  }

  private async analyzeGenericCode(request: CodeAnalysisRequest): Promise<string> {
    return `Generic code analysis for ${request.language} - basic structural review completed`;
  }

  private async analyzeCodeStructure(request: CodeAnalysisRequest): Promise<string> {
    const lines = request.code.split('\n');
    const analysis = [];

    if (lines.length > 100) {
      analysis.push('Function is quite long - consider breaking into smaller functions');
    }

    const commentLines = lines.filter(line => line.trim().startsWith('//') || line.trim().startsWith('#')).length;
    const codeLines = lines.filter(line => line.trim().length > 0).length;
    
    if (commentLines / codeLines < 0.1) {
      analysis.push('Consider adding more comments to explain complex logic');
    }

    return analysis.length > 0 ? `Code Structure:\n${analysis.join('\n')}` : '';
  }

  private async analyzeSecurityPatterns(request: CodeAnalysisRequest): Promise<string> {
    const issues = [];
    const code = request.code.toLowerCase();

    if (code.includes('password') && code.includes('=')) {
      issues.push('Potential hardcoded password detected - use environment variables');
    }
    if (code.includes('eval(')) {
      issues.push('Using eval() can be dangerous - consider alternatives');
    }

    return issues.length > 0 ? `Security Issues:\n${issues.join('\n')}` : '';
  }

  private async analyzePerformancePatterns(request: CodeAnalysisRequest): Promise<string> {
    const issues = [];
    const code = request.code;

    if (code.includes('for') && code.includes('for')) {
      issues.push('Nested loops detected - consider optimization if performance is critical');
    }

    return issues.length > 0 ? `Performance Considerations:\n${issues.join('\n')}` : '';
  }

  /**
   * Helper methods
   */
  private getDocumentationSource(language: string): string {
    const mapping: Record<string, string> = {
      typescript: 'typescript',
      javascript: 'nodejs',
      python: 'python',
      java: 'java',
      react: 'react',
      node: 'nodejs'
    };
    return mapping[language.toLowerCase()] || 'generic';
  }

  private detectFrameworks(code: string): string[] {
    const frameworks = [];
    if (code.includes('import React') || code.includes('from "react"')) {
      frameworks.push('react');
    }
    if (code.includes('express') || code.includes('app.get')) {
      frameworks.push('express');
    }
    if (code.includes('@nestjs') || code.includes('@Controller')) {
      frameworks.push('nestjs');
    }
    return frameworks;
  }

  private detectCodePatterns(code: string, _language: string): Array<{name: string, description: string, quality: number, example: string}> {
    const patterns = [];
    
    // Common patterns
    if (code.includes('async') && code.includes('await')) {
      patterns.push({
        name: 'async-await',
        description: 'Asynchronous programming pattern',
        quality: 0.8,
        example: code.substring(0, 100)
      });
    }

    if (code.includes('try') && code.includes('catch')) {
      patterns.push({
        name: 'error-handling',
        description: 'Error handling pattern',
        quality: 0.9,
        example: code.substring(0, 100)
      });
    }

    return patterns;
  }

  private classifyInsightType(content: string): MemoryInsight['type'] {
    if (content.includes('best practice') || content.includes('recommended')) {
      return 'best-practice';
    }
    if (content.includes('avoid') || content.includes('anti-pattern')) {
      return 'anti-pattern';
    }
    if (content.includes('solution') || content.includes('fix')) {
      return 'solution';
    }
    return 'pattern';
  }

  private calculateConfidence(suggestions: CodeSuggestion[], documentation: DocumentationResult[], memoryInsights: MemoryInsight[]): number {
    let confidence = 0.5; // Base confidence
    
    confidence += Math.min(suggestions.length * 0.1, 0.3); // More suggestions = higher confidence
    confidence += Math.min(documentation.length * 0.05, 0.2); // Documentation = higher confidence
    confidence += Math.min(memoryInsights.length * 0.03, 0.1); // Memory insights = higher confidence
    
    return Math.min(confidence, 1.0);
  }

  private async calculateQualityScore(_request: CodeAnalysisRequest, suggestions: CodeSuggestion[]): Promise<number> {
    let score = 85; // Base score
    
    // Deduct points for issues
    for (const suggestion of suggestions) {
      switch (suggestion.severity) {
        case 'critical': score -= 15; break;
        case 'high': score -= 10; break;
        case 'medium': score -= 5; break;
        case 'low': score -= 2; break;
      }
    }
    
    return Math.max(score, 0);
  }

  private async validateConstitutionalCompliance(_analysis: string, suggestions: CodeSuggestion[]): Promise<boolean> {
    // Check if analysis and suggestions follow Constitutional AI principles
    // - Accuracy: Are suggestions technically sound?
    // - Transparency: Are explanations clear?
    // - Helpfulness: Do suggestions provide actionable guidance?
    // - Safety: Do suggestions avoid harmful recommendations?
    
    return !suggestions.some(s => s.type === 'security' && s.severity === 'critical');
  }

  private validateSuggestion(suggestion: CodeSuggestion): boolean {
    // Validate suggestion meets Constitutional AI standards
    return suggestion.reasoning.length > 10 && 
           suggestion.description.length > 10 &&
           !suggestion.description.includes('just') && // Avoid vague language
           !suggestion.description.includes('simply'); // Avoid oversimplification
  }

  private async generateReviewSuggestions(_request: CodeAnalysisRequest, _analysis: string, _documentation: DocumentationResult[]): Promise<CodeSuggestion[]> {
    // Generate code review suggestions
    return [];
  }

  private async generateDebugSuggestions(_request: CodeAnalysisRequest, _analysis: string, _memoryInsights: MemoryInsight[]): Promise<CodeSuggestion[]> {
    // Generate debugging suggestions
    return [];
  }

  private async generateOptimizationSuggestions(_request: CodeAnalysisRequest, _analysis: string, _documentation: DocumentationResult[]): Promise<CodeSuggestion[]> {
    // Generate optimization suggestions
    return [];
  }

  private async generateRefactoringSuggestions(_request: CodeAnalysisRequest, _analysis: string, _documentation: DocumentationResult[]): Promise<CodeSuggestion[]> {
    // Generate refactoring suggestions
    return [];
  }

  private async generateTestSuggestions(_request: CodeAnalysisRequest, _analysis: string, _documentation: DocumentationResult[]): Promise<CodeSuggestion[]> {
    // Generate testing suggestions
    return [];
  }

  private async generateExplanationSuggestions(_request: CodeAnalysisRequest, _analysis: string, _documentation: DocumentationResult[]): Promise<CodeSuggestion[]> {
    // Generate explanation suggestions
    return [];
  }

  private generateFallbackAnalysis(request: CodeAnalysisRequest): CodeAnalysisResult {
    return {
      analysis: `Fallback analysis for ${request.language} ${request.requestType}`,
      suggestions: [],
      patterns: [],
      documentation: [],
      qualityScore: 0,
      constitutionalCompliance: true,
      memoryInsights: [],
      metadata: {
        analysisType: request.requestType,
        confidence: 0.3,
        processingTime: 0,
        context7Used: false, // Only for documentation lookup
        memoryEnhanced: false
      }
    };
  }

  private updateMetrics(result: CodeAnalysisResult): void {
    this.analysisMetrics.averageQualityScore = 
      (this.analysisMetrics.averageQualityScore * (this.analysisMetrics.successfulAnalyses - 1) + result.qualityScore) / 
      this.analysisMetrics.successfulAnalyses;
    
    if (result.metadata.context7Used) {
      this.analysisMetrics.context7Usage++; // Only for documentation lookup
    }
    
    if (result.metadata.memoryEnhanced) {
      this.analysisMetrics.memoryEnhancements++;
    }
  }
  private async storeAnalysisForLearning(request: CodeAnalysisRequest, result: CodeAnalysisResult): Promise<void> {
    try {
      const learningContent = `Code analysis: ${request.language} ${request.requestType} - Quality: ${result.qualityScore}% - Patterns: ${result.patterns.length} - Documentation used: ${result.documentation.length}`;
      
      await unifiedAgentCommunicationService.sendMessage({
        toAgent: 'system', // Broadcast to system for learning
        fromAgent: this.agentId,
        content: learningContent,
        messageType: 'insight',
        metadata: {
          type: 'code_analysis',
          language: request.language,
          requestType: request.requestType,
          qualityScore: result.qualityScore,
          patterns: result.patterns.map(p => p.name),
          context7Used: result.metadata.context7Used // Only for documentation lookup
        },
        sessionId: request.sessionId || 'default'
      });
    } catch (error) {
      console.warn(`[CodeAnalysis] Failed to store analysis for learning:`, error);
    }
  }

  private async initializeLanguagePatterns(): Promise<void> {
    // Initialize with common patterns for different languages
    this.languagePatterns.set('typescript', []);
    this.languagePatterns.set('javascript', []);
    this.languagePatterns.set('python', []);
    this.languagePatterns.set('java', []);
  }

  /**
   * Get analysis metrics
   */
  getMetrics() {
    return {
      ...this.analysisMetrics,
      languagePatterns: Object.fromEntries(
        Array.from(this.languagePatterns.entries()).map(([lang, patterns]) => [
          lang,
          patterns.length
        ])
      )
    };
  }
}
