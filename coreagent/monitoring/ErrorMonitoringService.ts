/**
 * ErrorMonitoringService - Centralized Error Monitoring and TriageAgent Integration
 * 
 * Provides comprehensive error monitoring, classification, and automatic
 * escalation to TriageAgent for systematic error recovery.
 */

import { ConstitutionalAI } from '../agents/base/ConstitutionalAI';
import { TriageAgent } from '../agents/specialized/TriageAgent';
import { SimpleAuditLogger } from '../audit/auditLogger';
import { OneAgentUnifiedBackbone, createUnifiedTimestamp } from '../utils/UnifiedBackboneService.js';

export interface ErrorContext {
  agentId?: string;
  userId?: string;
  sessionId?: string;
  taskType?: string;
  timestamp?: Date;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  metadata?: Record<string, any>;
  /**
   * Name of the tool (if error is associated with a tool call)
   */
  toolName?: string;
}

export interface ErrorClassification {
  category: 'connection' | 'validation' | 'memory' | 'processing' | 'unknown';
  severity: 'low' | 'medium' | 'high' | 'critical';
  requiresTriage: boolean;
  recoveryStrategy: 'retry' | 'fallback' | 'escalate' | 'ignore';
  constitutionalCompliance: boolean;
}

export interface ErrorReport {
  id: string;
  error: Error;
  context: ErrorContext;
  classification: ErrorClassification;
  triageTriggered: boolean;
  recoveryAttempts: number;
  resolved: boolean;
  timestamp: Date;
}

/**
 * Centralized error monitoring service with Constitutional AI integration
 */
export class ErrorMonitoringService {
  private constitutionalAI: ConstitutionalAI;
  private triageAgent: TriageAgent | undefined;
  private auditLogger: SimpleAuditLogger;
  private errorReports: Map<string, ErrorReport> = new Map();
  private errorPatterns: Map<string, number> = new Map();
  private unifiedBackbone: OneAgentUnifiedBackbone;
  
  constructor(
    constitutionalAI: ConstitutionalAI,
    auditLogger: SimpleAuditLogger,
    triageAgent?: TriageAgent
  ) {
    this.constitutionalAI = constitutionalAI;
    this.auditLogger = auditLogger;
    this.triageAgent = triageAgent;
    this.unifiedBackbone = OneAgentUnifiedBackbone.getInstance();
  }

  /**
   * Report and process error with Constitutional AI classification
   */
  async reportError(
    error: Error,
    context: ErrorContext = {}
  ): Promise<ErrorReport> {
    const errorId = this.generateErrorId();
    const classification = await this.classifyError(error, context);
    const timestamp = createUnifiedTimestamp();
    
    // Create error report
    const report: ErrorReport = {
      id: errorId,
      error,
      context: {
        ...context,
        timestamp: new Date(timestamp.utc),
        severity: classification.severity
      },
      classification,
      triageTriggered: false,
      recoveryAttempts: 0,
      resolved: false,
      timestamp: new Date(timestamp.utc)
    };

    // Store error report
    this.errorReports.set(errorId, report);
    
    // Update error patterns
    this.updateErrorPatterns(error, classification);
    
    // Log error with Constitutional AI compliance
    await this.logErrorWithCompliance(report);
    
    // Trigger TriageAgent if required
    if (classification.requiresTriage && this.triageAgent) {
      report.triageTriggered = await this.triggerTriageIntervention(report);
    }
    
    // Attempt automatic recovery
    if (classification.recoveryStrategy !== 'ignore') {
      await this.attemptRecovery(report);
    }
    
    return report;
  }

  /**
   * Classify error using Constitutional AI principles
   */
  private async classifyError(
    error: Error,
    context: ErrorContext
  ): Promise<ErrorClassification> {
    const errorMessage = error.message || error.toString();
    
    // Basic category classification
    let category: ErrorClassification['category'] = 'unknown';
    if (errorMessage.includes('ECONNREFUSED') || errorMessage.includes('connection')) {
      category = 'connection';
    } else if (errorMessage.includes('validation') || errorMessage.includes('invalid')) {
      category = 'validation';
    } else if (errorMessage.includes('memory') || errorMessage.includes('Mem0')) {
      category = 'memory';
    } else if (errorMessage.includes('processing') || errorMessage.includes('timeout')) {
      category = 'processing';
    }
      // Severity assessment based on context and error type
    let severity: ErrorClassification['severity'] = 'medium';
    if (category === 'connection' && (errorMessage.includes('memory') || errorMessage.includes('8000') || errorMessage.includes('8001'))) {
      severity = 'medium'; // Memory fallback available
    } else if (context.taskType === 'critical' || category === 'validation') {
      severity = 'high';
    } else if (errorMessage.includes('fatal') || errorMessage.includes('critical')) {
      severity = 'critical';
    }
    
    // Determine if TriageAgent intervention required
    const requiresTriage = severity === 'high' || severity === 'critical' ||
                          this.getErrorPatternCount(errorMessage) > 3;
    
    // Recovery strategy selection
    let recoveryStrategy: ErrorClassification['recoveryStrategy'] = 'retry';
    if (category === 'connection') {
      recoveryStrategy = 'fallback';
    } else if (severity === 'critical') {
      recoveryStrategy = 'escalate';
    } else if (category === 'validation') {
      recoveryStrategy = 'retry';
    }
    
    // Constitutional AI compliance assessment
    const constitutionalCompliance = await this.assessConstitutionalCompliance(error, context);
    
    return {
      category,
      severity,
      requiresTriage,
      recoveryStrategy,
      constitutionalCompliance
    };
  }

  /**
   * Assess Constitutional AI compliance for error handling
   */
  private async assessConstitutionalCompliance(
    error: Error,
    context: ErrorContext
  ): Promise<boolean> {
    try {
      // Only validate user-facing errors, not canonical memory tool errors
      const canonicalMemoryTools = [
        'oneagent_memory_add',
        'oneagent_memory_edit',
        'oneagent_memory_delete',
        'oneagent_memory_search'
      ];
      if (context && context.toolName && canonicalMemoryTools.includes(context.toolName)) {
        return true; // Always compliant for canonical memory tools
      }
      const errorResponse = `Error occurred: ${error.message}. Context: ${JSON.stringify(context)}`;
      const validation = await this.constitutionalAI.validateResponse(
        errorResponse,
        'System error assessment',
        context as Record<string, unknown>
      );
      // Check if error handling meets Constitutional AI principles
      return validation.isValid && validation.score >= 75;
    } catch {
      return false; // Default to non-compliant if validation fails
    }
  }

  /**
   * Trigger TriageAgent intervention for systematic error recovery
   */
  private async triggerTriageIntervention(report: ErrorReport): Promise<boolean> {
    if (!this.triageAgent) {
      return false;
    }

    try {
      const timestamp = createUnifiedTimestamp();
      const triageContext = {
        user: {
          id: report.context.userId || 'system',
          name: 'System Error Handler',
          createdAt: timestamp.iso,
          lastActiveAt: timestamp.iso
        },
        sessionId: report.context.sessionId || `error_${report.id}`,
        conversationHistory: []
      };

      const triageTask = `System error requiring intervention: ${report.error.message}. 
                         Category: ${report.classification.category}, 
                         Severity: ${report.classification.severity}. 
                         Context: ${JSON.stringify(report.context)}`;

      await this.triageAgent.processMessage(triageContext, triageTask);
        // Log successful TriageAgent intervention
      await this.auditLogger.logInfo('triage_intervention', 'TriageAgent intervention completed', {
        errorId: report.id,
        category: report.classification.category,
        severity: report.classification.severity,
        success: true
      });
      
      return true;
    } catch (triageError) {
      console.error('TriageAgent intervention failed:', triageError);
        // Log failed intervention
      await this.auditLogger.logError('triage_intervention_failed', 'TriageAgent intervention failed', {
        errorId: report.id,
        triageError: triageError instanceof Error ? triageError.message : 'Unknown error'
      });
      
      return false;
    }
  }

  /**
   * Attempt automatic error recovery
   */
  private async attemptRecovery(report: ErrorReport): Promise<void> {
    report.recoveryAttempts++;
    
    try {
      switch (report.classification.recoveryStrategy) {
        case 'retry':
          await this.retryOperation(report);
          break;
        case 'fallback':
          await this.activateFallback(report);
          break;
        case 'escalate':
          await this.escalateError(report);
          break;
        default:
          // No automatic recovery
          break;
      }
      
      report.resolved = true;        // Log successful recovery
        await this.auditLogger.logInfo('error_recovery_success', 'Error recovery completed successfully', {
          errorId: report.id,
          strategy: report.classification.recoveryStrategy,
          attempts: report.recoveryAttempts
        });
      
    } catch (recoveryError) {
      console.error('Error recovery failed:', recoveryError);
        // Log failed recovery
      await this.auditLogger.logError('error_recovery_failed', 'Error recovery attempt failed', {
        errorId: report.id,
        strategy: report.classification.recoveryStrategy,
        attempts: report.recoveryAttempts,
        error: recoveryError instanceof Error ? recoveryError.message : 'Unknown error'
      });
    }
  }
  /**
   * Log error with Constitutional AI compliance
   */
  private async logErrorWithCompliance(report: ErrorReport): Promise<void> {
    await this.auditLogger.logError('system_error', 'System error reported with Constitutional AI compliance assessment', {
      errorId: report.id,
      message: report.error.message,
      category: report.classification.category,
      severity: report.classification.severity,
      constitutionalCompliance: report.classification.constitutionalCompliance,
      context: report.context,
      timestamp: report.timestamp.toISOString()
    });
  }

  /**
   * Update error pattern tracking
   */
  private updateErrorPatterns(error: Error, classification: ErrorClassification): void {
    const patternKey = `${classification.category}:${error.message.substring(0, 50)}`;
    const currentCount = this.errorPatterns.get(patternKey) || 0;
    this.errorPatterns.set(patternKey, currentCount + 1);
  }

  /**
   * Get error pattern count for pattern recognition
   */
  private getErrorPatternCount(errorMessage: string): number {
    const patternKey = Array.from(this.errorPatterns.keys())
      .find(key => key.includes(errorMessage.substring(0, 20)));
    return patternKey ? this.errorPatterns.get(patternKey) || 0 : 0;
  }

  /**
   * Generate unique error ID
   */
  private generateErrorId(): string {
    const timestamp = createUnifiedTimestamp();
    return `err_${timestamp.unix}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Retry operation (placeholder for specific implementations)
   */
  private async retryOperation(report: ErrorReport): Promise<void> {
    // Implementation depends on specific operation context
    console.log(`Retrying operation for error ${report.id}`);
  }

  /**
   * Activate fallback mechanism (placeholder for specific implementations)
   */
  private async activateFallback(report: ErrorReport): Promise<void> {
    // Implementation depends on specific service context
    console.log(`Activating fallback for error ${report.id}`);
  }

  /**
   * Escalate error to human intervention
   */
  private async escalateError(report: ErrorReport): Promise<void> {
    console.log(`Escalating critical error ${report.id} for human intervention`);
      // Log escalation
    await this.auditLogger.logError('error_escalation', 'Critical error escalated for human intervention', {
      errorId: report.id,
      severity: report.classification.severity,
      escalationReason: 'Critical error requiring human intervention'
    });
  }

  /**
   * Get error statistics for monitoring
   */
  getErrorStatistics(): {
    totalErrors: number;
    errorsByCategory: Record<string, number>;
    errorsBySeverity: Record<string, number>;
    triageInterventions: number;
    recoveryRate: number;
  } {
    const reports = Array.from(this.errorReports.values());
    
    const errorsByCategory: Record<string, number> = {};
    const errorsBySeverity: Record<string, number> = {};
    let triageInterventions = 0;
    let resolvedErrors = 0;

    reports.forEach(report => {
      errorsByCategory[report.classification.category] = 
        (errorsByCategory[report.classification.category] || 0) + 1;
      
      errorsBySeverity[report.classification.severity] = 
        (errorsBySeverity[report.classification.severity] || 0) + 1;
      
      if (report.triageTriggered) {
        triageInterventions++;
      }
      
      if (report.resolved) {
        resolvedErrors++;
      }
    });

    return {
      totalErrors: reports.length,
      errorsByCategory,
      errorsBySeverity,
      triageInterventions,
      recoveryRate: reports.length > 0 ? resolvedErrors / reports.length : 0
    };
  }

  /**
   * Clear old error reports (cleanup)
   */
  clearOldReports(olderThan: number = 24 * 60 * 60 * 1000): void {
    const timestamp = createUnifiedTimestamp();
    const cutoffTime = timestamp.unix - olderThan;
    
    for (const [id, report] of this.errorReports.entries()) {
      if (report.timestamp.getTime() < cutoffTime) {
        this.errorReports.delete(id);
      }
    }
  }
}
