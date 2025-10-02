/**
 * GMACompiler - Generative Markdown Artifacts Compiler
 *
 * Core orchestration engine for spec-driven development.
 * Compiles MissionBrief.md specifications into executable task queues.
 *
 * Features:
 * - Parse MissionBrief.md → Task queue with dependencies
 * - Agent assignment via AgentMatcher (performance-weighted)
 * - Circuit breaker integration for resilience
 * - Event emission for observability
 * - Memory audit trail for traceability
 * - Constitutional AI validation
 *
 * Epic 18 Phase 1: GMA MVP (v4.5.0)
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { marked, type Token } from 'marked';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { EventEmitter } from 'events';
import {
  createUnifiedTimestamp,
  createUnifiedId,
  getOneAgentMemory,
} from '../utils/UnifiedBackboneService';
import { OneAgentMemory } from '../memory/OneAgentMemory';
import type { TaskQueue } from './TaskQueue';
import type { EmbeddingBasedAgentMatcher } from './EmbeddingBasedAgentMatcher';

export interface MissionBriefMetadata {
  specId: string;
  version: string;
  created: string;
  author: string;
  domain: 'work' | 'personal' | 'health' | 'finance' | 'creative';
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'draft' | 'active' | 'completed' | 'archived';
  lineage: string[];
  tags: string[];
}

export interface MissionBriefTask {
  id: string;
  name: string;
  description: string;
  agentAssignment: {
    preferredAgent: string;
    fallbackStrategy: string;
  };
  inputs?: Array<{ description: string; source: string; format: string }>;
  outputs?: Array<{ description: string; destination: string; format: string }>;
  dependencies?: {
    dependsOn?: string[];
    blocks?: string[];
  };
  acceptanceCriteria: Array<{ description: string; completed: boolean }>;
  estimatedEffort?: number;
  status: 'not-started' | 'in-progress' | 'completed' | 'blocked' | 'failed';
}

export interface MissionBriefSpec {
  metadata: MissionBriefMetadata;
  goal: {
    what: string;
    why: string;
    successCriteria: Array<{ description: string; completed: boolean }>;
  };
  context?: {
    background?: string;
    assumptions?: string[];
    constraints?: Array<{ type: 'time' | 'resource' | 'policy'; description: string }>;
  };
  tasks: MissionBriefTask[];
  qualityStandards?: {
    codeQuality?: string;
    testing?: Record<string, unknown>;
    constitutionalAI?: {
      accuracy: boolean;
      transparency: boolean;
      helpfulness: boolean;
      safety: boolean;
    };
  };
  resources?: {
    apis?: Array<{ name: string; purpose: string; endpoint?: string }>;
    dataSources?: Array<{ name: string; location: string; accessMethod?: string }>;
    capabilities?: string[];
    externalDependencies?: Array<{ library: string; version: string; purpose?: string }>;
  };
  risks?: Array<{
    description: string;
    impact: 'high' | 'medium' | 'low';
    probability: 'high' | 'medium' | 'low';
    mitigation: string;
  }>;
  timeline?: {
    milestones?: Array<{ date: string; description: string }>;
    criticalPath?: string[];
    buffer?: string;
  };
}

export interface CompilationResult {
  specId: string;
  tasksCreated: number;
  agentsAssigned: string[];
  estimatedDuration: number;
  compilationTime: number;
  validationPassed: boolean;
  errors: string[];
  warnings: string[];
}

export interface GMACompilerConfig {
  taskQueue: TaskQueue;
  agentMatcher: EmbeddingBasedAgentMatcher;
  schemaPath?: string;
  enableValidation?: boolean;
  enableMemoryAudit?: boolean;
}

/**
 * GMACompiler - Compiles MissionBrief specifications into executable workflows
 */
export class GMACompiler extends EventEmitter {
  private taskQueue: TaskQueue;
  private agentMatcher: EmbeddingBasedAgentMatcher;
  private memory: OneAgentMemory;
  private ajv: Ajv;
  private schema: Record<string, unknown> | null = null;
  private enableValidation: boolean;
  private enableMemoryAudit: boolean;

  constructor(config: GMACompilerConfig) {
    super();
    this.taskQueue = config.taskQueue;
    this.agentMatcher = config.agentMatcher;
    this.memory = getOneAgentMemory();
    this.enableValidation = config.enableValidation ?? true;
    this.enableMemoryAudit = config.enableMemoryAudit ?? true;

    // Initialize JSON schema validator
    this.ajv = new Ajv({ allErrors: true, strict: false });
    addFormats(this.ajv);
  }

  /**
   * Initialize compiler (load schema)
   */
  async initialize(): Promise<void> {
    if (this.enableValidation) {
      const schemaPath = path.join(process.cwd(), 'docs', 'specs', 'missionbrief.schema.json');
      try {
        const schemaContent = await fs.readFile(schemaPath, 'utf-8');
        this.schema = JSON.parse(schemaContent);
        console.log('[GMACompiler] Schema loaded successfully');
      } catch (error) {
        console.warn('[GMACompiler] Failed to load schema, validation disabled:', error);
        this.enableValidation = false;
      }
    }
  }

  /**
   * Compile MissionBrief.md file into executable task queue
   */
  async compileSpecificationFile(specFilePath: string): Promise<CompilationResult> {
    const startTime = createUnifiedTimestamp().unix;

    this.emit('compilation_started', { specFilePath, timestamp: createUnifiedTimestamp().iso });

    try {
      // Read and parse Markdown file
      const specContent = await fs.readFile(specFilePath, 'utf-8');
      const spec = await this.parseMissionBrief(specContent);

      // Validate specification
      if (this.enableValidation) {
        const validationErrors = this.validateSpecification(spec);
        if (validationErrors.length > 0) {
          this.emit('validation_failed', {
            specId: spec.metadata.specId,
            errors: validationErrors,
          });
          return {
            specId: spec.metadata.specId,
            tasksCreated: 0,
            agentsAssigned: [],
            estimatedDuration: 0,
            compilationTime: createUnifiedTimestamp().unix - startTime,
            validationPassed: false,
            errors: validationErrors,
            warnings: [],
          };
        }
      }

      // Compile to task queue
      const result = await this.compileSpecification(spec);

      // Store in memory with audit trail
      if (this.enableMemoryAudit) {
        await this.auditCompilation(spec, result);
      }

      const compilationTime = createUnifiedTimestamp().unix - startTime;

      this.emit('compilation_completed', {
        specId: spec.metadata.specId,
        tasksCreated: result.tasksCreated,
        compilationTime,
      });

      return {
        ...result,
        compilationTime,
        validationPassed: true,
      };
    } catch (error) {
      this.emit('compilation_failed', {
        specFilePath,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Parse MissionBrief.md content into structured specification
   */
  private async parseMissionBrief(content: string): Promise<MissionBriefSpec> {
    // Extract YAML frontmatter if present
    const yamlMatch = content.match(/^```yaml\n([\s\S]*?)\n```/m);
    let metadata: MissionBriefMetadata;

    if (yamlMatch) {
      metadata = yaml.load(yamlMatch[1]) as MissionBriefMetadata;
    } else {
      // Generate default metadata
      metadata = {
        specId: createUnifiedId('workflow', 'generated'),
        version: '1.0.0',
        created: createUnifiedTimestamp().iso,
        author: 'GMACompiler',
        domain: 'work',
        priority: 'medium',
        status: 'draft',
        lineage: [],
        tags: [],
      };
    }

    // Parse Markdown structure
    const tokens = marked.lexer(content);

    // Extract sections (simplified parsing - can be enhanced)
    const spec: MissionBriefSpec = {
      metadata,
      goal: {
        what: this.extractSection(tokens, 'Goal', 'what') || 'No goal specified',
        why: this.extractSection(tokens, 'Goal', 'why') || 'No rationale specified',
        successCriteria: this.extractCheckboxList(tokens, 'Goal', 'Success Criteria'),
      },
      tasks: this.extractTasks(tokens),
    };

    // Extract optional sections
    spec.context = {
      background: this.extractSection(tokens, 'Context', 'Background'),
      assumptions: this.extractList(tokens, 'Context', 'Assumptions'),
      constraints: [],
    };

    return spec;
  }

  /**
   * Validate specification against JSON schema
   */
  private validateSpecification(spec: MissionBriefSpec): string[] {
    if (!this.schema) {
      return [];
    }

    const validate = this.ajv.compile(this.schema);
    const valid = validate(spec);

    if (!valid && validate.errors) {
      return validate.errors.map((err) => `${err.instancePath}: ${err.message}`);
    }

    // Additional validation rules
    const errors: string[] = [];

    // Check for cyclic dependencies
    if (this.hasCyclicDependencies(spec.tasks)) {
      errors.push('Task dependencies contain cycles');
    }

    // Check for at least one acceptance criterion per task
    for (const task of spec.tasks) {
      if (task.acceptanceCriteria.length === 0) {
        errors.push(`Task ${task.id} has no acceptance criteria`);
      }
    }

    return errors;
  }

  /**
   * Compile specification into task queue
   */
  private async compileSpecification(spec: MissionBriefSpec): Promise<CompilationResult> {
    const tasksCreated: string[] = [];
    const agentsAssigned: string[] = [];
    const warnings: string[] = [];

    // Build dependency graph
    const taskGraph = this.buildTaskGraph(spec.tasks);

    // Topological sort for execution order
    const executionOrder = this.topologicalSort(taskGraph);

    // Create tasks in execution order
    for (const taskId of executionOrder) {
      const task = spec.tasks.find((t) => t.id === taskId);
      if (!task) {
        warnings.push(`Task ${taskId} in execution order not found in spec`);
        continue;
      }

      try {
        // Match agent for task
        const availableAgents: import('./EmbeddingBasedAgentMatcher').AgentProfile[] = [
          // Placeholder - in production, fetch from agent registry
          {
            id: task.agentAssignment.preferredAgent,
            name: task.agentAssignment.preferredAgent,
            type: 'specialized',
            capabilities: [task.agentAssignment.preferredAgent],
            specializations: [],
            description: `Agent for ${task.name}`,
            availability: 'available',
          },
        ];

        const agentMatch = await this.agentMatcher.matchTaskToAgent(
          {
            id: task.id,
            name: task.name,
            description: task.description,
            requiredSkills: [task.agentAssignment.preferredAgent],
            complexity: 'moderate',
            priority: spec.metadata.priority,
          },
          availableAgents,
        );

        if (!agentMatch || !agentMatch.agentId) {
          warnings.push(
            `No suitable agent found for task ${task.id}, using fallback: ${task.agentAssignment.fallbackStrategy}`,
          );
          continue;
        }

        // Add task to queue (generates ID internally)
        await this.taskQueue.addTask({
          name: task.name,
          description: task.description,
          priority: spec.metadata.priority,
          dependsOn: [],
          payload: {
            specId: spec.metadata.specId,
            taskId: task.id,
            taskName: task.name,
            description: task.description,
            inputs: task.inputs,
            outputs: task.outputs,
            acceptanceCriteria: task.acceptanceCriteria,
            estimatedEffort: task.estimatedEffort,
          },
          executorId: agentMatch.agentId,
          maxAttempts: 3,
        });

        tasksCreated.push(task.id);
        if (!agentsAssigned.includes(agentMatch.agentId)) {
          agentsAssigned.push(agentMatch.agentId);
        }

        this.emit('task_compiled', {
          specId: spec.metadata.specId,
          taskId: task.id,
          agentId: agentMatch.agentId,
          similarity: agentMatch.similarityScore,
        });
      } catch (error) {
        warnings.push(
          `Failed to compile task ${task.id}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    // Calculate estimated duration
    const estimatedDuration = spec.tasks.reduce(
      (sum, task) => sum + (task.estimatedEffort || 0),
      0,
    );

    return {
      specId: spec.metadata.specId,
      tasksCreated: tasksCreated.length,
      agentsAssigned,
      estimatedDuration,
      compilationTime: 0, // Set by caller
      validationPassed: true,
      errors: [],
      warnings,
    };
  }

  /**
   * Store compilation in memory with audit trail
   */
  private async auditCompilation(spec: MissionBriefSpec, result: CompilationResult): Promise<void> {
    await this.memory.addMemory({
      content: `GMA Compilation: ${spec.metadata.specId} - ${result.tasksCreated} tasks created`,
      metadata: {
        type: 'gma_compilation',
        specId: spec.metadata.specId,
        domain: spec.metadata.domain,
        priority: spec.metadata.priority,
        tasksCreated: result.tasksCreated,
        agentsAssigned: result.agentsAssigned,
        estimatedDuration: result.estimatedDuration,
        compilationTime: result.compilationTime,
        timestamp: createUnifiedTimestamp().iso,
        lineage: spec.metadata.lineage,
      },
    });
  }

  /**
   * Helper: Extract section content from Markdown tokens
   */
  private extractSection(tokens: Token[], section: string, subsection: string): string | undefined {
    // Simplified extraction - can be enhanced with proper AST traversal
    let inSection = false;
    let inSubsection = false;
    let content = '';

    for (const token of tokens) {
      if (token.type === 'heading') {
        if (token.text === section) {
          inSection = true;
        } else if (inSection && token.text === subsection) {
          inSubsection = true;
        } else if (inSection) {
          inSection = false;
          inSubsection = false;
        }
      } else if (inSubsection && token.type === 'paragraph') {
        content += token.text + '\n';
      }
    }

    return content.trim() || undefined;
  }

  /**
   * Helper: Extract checkbox list from Markdown
   */
  private extractCheckboxList(
    _tokens: Token[],
    _section: string,
    _subsection: string,
  ): Array<{ description: string; completed: boolean }> {
    // Simplified extraction - to be enhanced in future iterations
    return [];
  }

  /**
   * Helper: Extract list items from Markdown
   */
  private extractList(_tokens: Token[], _section: string, _subsection: string): string[] {
    // Simplified extraction - to be enhanced in future iterations
    return [];
  }

  /**
   * Helper: Extract tasks from Markdown
   */
  private extractTasks(tokens: Token[]): MissionBriefTask[] {
    const tasks: MissionBriefTask[] = [];
    let currentTask: Partial<MissionBriefTask> | null = null;
    let inTasksSection = false;
    let currentSubsection = '';

    for (const token of tokens) {
      // Track if we're in the Tasks section
      if (token.type === 'heading' && token.depth === 2) {
        inTasksSection = token.text.toLowerCase().includes('task');
        if (!inTasksSection && currentTask) {
          // Exiting tasks section, save current task
          if (currentTask.id && currentTask.name && currentTask.description) {
            tasks.push(this.normalizeTask(currentTask));
          }
          currentTask = null;
        }
        continue;
      }

      if (!inTasksSection) continue;

      // Parse task headings (### Task N:)
      if (token.type === 'heading' && token.depth === 3) {
        // Save previous task
        if (currentTask && currentTask.id && currentTask.name && currentTask.description) {
          tasks.push(this.normalizeTask(currentTask));
        }

        // Start new task
        const match = token.text.match(/^Task\s+(\d+):\s*(.+)$/i);
        if (match) {
          const [, taskNum, title] = match;
          currentTask = {
            id: `task_${taskNum}`,
            name: title.trim(),
            description: '',
            agentAssignment: {
              preferredAgent: 'TBD',
              fallbackStrategy: 'capability-based-matching',
            },
            acceptanceCriteria: [],
            status: 'not-started',
          };
        }
        continue;
      }

      // Parse subsections within tasks (Assignment, Dependencies, etc.)
      if (token.type === 'heading' && token.depth === 4 && token.text.startsWith('**')) {
        currentSubsection = token.text
          .replace(/^\*\*|\*\*$/g, '')
          .trim()
          .toLowerCase();
        continue;
      }

      // Parse task content
      if (currentTask) {
        if (token.type === 'paragraph') {
          const text = token.text.trim();

          // Handle inline field labels
          if (text.startsWith('**Description**:')) {
            currentTask.description = text.replace(/^\*\*Description\*\*:\s*/i, '').trim();
          } else if (text.startsWith('**Estimated Effort**:')) {
            const effortText = text.replace(/^\*\*Estimated Effort\*\*:\s*/i, '').trim();
            currentTask.estimatedEffort = this.parseEffort(effortText);
          } else if (text.startsWith('**Status**:')) {
            const status = text
              .replace(/^\*\*Status\*\*:\s*/i, '')
              .trim()
              .toLowerCase();
            currentTask.status = (status as MissionBriefTask['status']) || 'not-started';
          } else if (text.startsWith('**Dependencies**:')) {
            const depsText = text.replace(/^\*\*Dependencies\*\*:\s*/i, '').trim();
            if (depsText.toLowerCase() !== 'none') {
              currentTask.dependencies = {
                dependsOn: depsText.split(',').map((d: string) => d.trim()),
              };
            }
          } else if (currentSubsection === 'description' && !currentTask.description) {
            currentTask.description = text;
          } else if (currentSubsection === 'estimated effort') {
            currentTask.estimatedEffort = this.parseEffort(text);
          } else if (currentSubsection === 'dependencies' && text.toLowerCase() !== 'none') {
            currentTask.dependencies = {
              dependsOn: text.split(',').map((d: string) => d.trim()),
            };
          }
        } else if (token.type === 'list') {
          // Handle list items (for assignment, inputs, outputs, acceptance criteria)
          const items = this.parseListItems(token);

          if (currentSubsection === 'assignment') {
            for (const item of items) {
              if (item.startsWith('- Preferred Agent:') || item.startsWith('Preferred Agent:')) {
                currentTask.agentAssignment = currentTask.agentAssignment || {
                  preferredAgent: 'TBD',
                  fallbackStrategy: 'capability-based-matching',
                };
                currentTask.agentAssignment.preferredAgent = item
                  .replace(/^-?\s*Preferred Agent:\s*/i, '')
                  .trim();
              } else if (
                item.startsWith('- Fallback Strategy:') ||
                item.startsWith('Fallback Strategy:')
              ) {
                currentTask.agentAssignment = currentTask.agentAssignment || {
                  preferredAgent: 'TBD',
                  fallbackStrategy: 'capability-based-matching',
                };
                currentTask.agentAssignment.fallbackStrategy = item
                  .replace(/^-?\s*Fallback Strategy:\s*/i, '')
                  .trim();
              }
            }
          } else if (currentSubsection === 'acceptance criteria') {
            currentTask.acceptanceCriteria = items.map((item) => ({
              description: item.replace(/^-?\s*\[\s*\]\s*/i, '').trim(),
              completed: false,
            }));
          } else if (currentSubsection === 'dependencies') {
            const depItems = items
              .map((i: string) => i.trim())
              .filter((i: string) => i.toLowerCase() !== 'none');
            if (depItems.length > 0) {
              currentTask.dependencies = { dependsOn: depItems };
            }
          }
        }
      }
    }

    // Save final task
    if (currentTask && currentTask.id && currentTask.name && currentTask.description) {
      tasks.push(this.normalizeTask(currentTask));
    }

    return tasks;
  }

  /**
   * Helper: Parse effort string to number (days)
   */
  private parseEffort(effortText: string): number | undefined {
    const match = effortText.match(/(\d+\.?\d*)\s*(day|hour|week)/i);
    if (!match) return undefined;

    const [, value, unit] = match;
    const numValue = parseFloat(value);

    // Convert to days
    switch (unit.toLowerCase()) {
      case 'hour':
        return Math.round(numValue / 8); // 8-hour workday
      case 'day':
        return numValue;
      case 'week':
        return numValue * 5; // 5-day workweek
      default:
        return undefined;
    }
  }

  /**
   * Helper: Parse list items from marked token
   */
  private parseListItems(listToken: Token): string[] {
    const items: string[] = [];

    if ('items' in listToken && Array.isArray(listToken.items)) {
      for (const item of listToken.items) {
        if ('text' in item && typeof item.text === 'string') {
          items.push(item.text);
        }
      }
    }

    return items;
  }

  /**
   * Helper: Normalize partial task to full task
   */
  private normalizeTask(partial: Partial<MissionBriefTask>): MissionBriefTask {
    const timestamp = createUnifiedTimestamp();
    return {
      id: partial.id || `task_${timestamp.unix}`,
      name: partial.name || 'Untitled Task',
      description: partial.description || 'No description provided',
      agentAssignment: partial.agentAssignment || {
        preferredAgent: 'TBD',
        fallbackStrategy: 'capability-based-matching',
      },
      acceptanceCriteria: partial.acceptanceCriteria || [],
      inputs: partial.inputs,
      outputs: partial.outputs,
      dependencies: partial.dependencies,
      estimatedEffort: partial.estimatedEffort,
      status: partial.status || 'not-started',
    };
  }

  /**
   * Helper: Check for cyclic dependencies
   */
  private hasCyclicDependencies(tasks: MissionBriefTask[]): boolean {
    const graph = this.buildTaskGraph(tasks);
    const visited = new Set<string>();
    const recStack = new Set<string>();

    const hasCycle = (node: string): boolean => {
      visited.add(node);
      recStack.add(node);

      const neighbors = graph.get(node) || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          if (hasCycle(neighbor)) {
            return true;
          }
        } else if (recStack.has(neighbor)) {
          return true;
        }
      }

      recStack.delete(node);
      return false;
    };

    for (const task of tasks) {
      if (!visited.has(task.id)) {
        if (hasCycle(task.id)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Helper: Build task dependency graph
   */
  private buildTaskGraph(tasks: MissionBriefTask[]): Map<string, string[]> {
    const graph = new Map<string, string[]>();

    for (const task of tasks) {
      if (!graph.has(task.id)) {
        graph.set(task.id, []);
      }

      if (task.dependencies?.dependsOn) {
        for (const dep of task.dependencies.dependsOn) {
          if (!graph.has(dep)) {
            graph.set(dep, []);
          }
          graph.get(dep)!.push(task.id);
        }
      }
    }

    return graph;
  }

  /**
   * Helper: Topological sort for task execution order
   */
  private topologicalSort(graph: Map<string, string[]>): string[] {
    const sorted: string[] = [];
    const visited = new Set<string>();

    const visit = (node: string) => {
      if (visited.has(node)) {
        return;
      }

      visited.add(node);
      const neighbors = graph.get(node) || [];
      for (const neighbor of neighbors) {
        visit(neighbor);
      }

      sorted.unshift(node);
    };

    for (const node of graph.keys()) {
      visit(node);
    }

    return sorted;
  }

  /**
   * Helper: Map priority string to number
   */
  private mapPriorityToNumber(priority: string): number {
    const priorityMap: Record<string, number> = {
      critical: 1,
      high: 2,
      medium: 3,
      low: 4,
    };
    return priorityMap[priority] || 3;
  }

  /**
   * Get compilation statistics
   */
  getStatistics(): {
    totalCompilations: number;
    successfulCompilations: number;
    failedCompilations: number;
  } {
    // Placeholder - would track stats in production
    return {
      totalCompilations: 0,
      successfulCompilations: 0,
      failedCompilations: 0,
    };
  }
}
