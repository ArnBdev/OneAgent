/**
 * Workflow Type Definitions
 * 
 * Definerer alle typer og interfaces relatert til arbeidsflyter (workflows)
 * i OneAgent systemet.
 */

/**
 * Basis metadata for alle workflows
 */
export interface WorkflowMetadata {
  id: string;
  name: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  agentType: 'core' | 'code' | 'office' | 'home' | 'custom';
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string; // userId
}

/**
 * Workflow status og fremgang
 */
export interface WorkflowStatus {
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  progress: number; // 0-100
  currentStep?: string;
  lastError?: string;
  startedAt?: Date;
  completedAt?: Date;
}

/**
 * Enkelt workflow-steg
 */
export interface WorkflowStep {
  id: string;
  name: string;
  description?: string;
  type: 'action' | 'condition' | 'wait' | 'input';
  parameters: Record<string, unknown>;
  dependencies?: string[]; // IDs av andre steg som må fullføres først
}

/**
 * Komplett workflow definisjon
 */
export interface Workflow {
  metadata: WorkflowMetadata;
  status: WorkflowStatus;
  steps: WorkflowStep[];
  variables?: Record<string, unknown>; // Workflow-spesifikke variabler
  context?: Record<string, unknown>; // Kontekst data som kan deles mellom steg
}

/**
 * Filter for å søke etter workflows
 */
export interface WorkflowFilter {
  userId?: string;
  agentType?: WorkflowMetadata['agentType'];
  status?: WorkflowStatus['status'];
  priority?: WorkflowMetadata['priority'];
  tags?: string[];
  createdAfter?: Date;
  createdBefore?: Date;
}
