/**
 * GMA Compiler Service - Epic 18 Phase 1
 *
 * Converts MissionBrief.md specifications into actionable agent plans and task queues.
 * Integrates with canonical OneAgent systems: UnifiedBackboneService, TaskDelegationService,
 * Constitutional AI validation, and memory systems.
 *
 * @version 1.0.0
 * @date 2025-10-04
 */

import * as fs from 'fs/promises';
import * as yaml from 'js-yaml';
import { unifiedLogger } from '../utils/UnifiedLogger';
import { createUnifiedId, createUnifiedTimestamp } from '../utils/UnifiedBackboneService';

// GMA Schema Types
export interface MissionBriefMetadata {
  missionId?: string;
  version: string;
  priority: 'low' | 'normal' | 'high' | 'critical';
  estimatedDuration: string; // ISO 8601 duration
  requiredAgents: string[];
  constraints: {
    maxConcurrency: number;
    timeout: string; // ISO 8601 duration
    memory: boolean;
    constitutional: boolean;
  };
  tags: string[];
  author: string;
  created: string; // ISO 8601 timestamp
  updated: string; // ISO 8601 timestamp
}

export interface GMATask {
  id: string;
  name: string;
  agent: string; // Agent type or 'auto-select'
  priority: 'low' | 'normal' | 'high' | 'critical';
  dependencies: string[]; // Task IDs
  estimatedDuration: string; // ISO 8601 duration
  description: string;
  acceptanceCriteria: string[];
  inputs: string;
  outputs: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed' | 'blocked';
}

export interface MissionBriefSpec {
  metadata: MissionBriefMetadata;
  title: string;
  description: string;
  objectives: {
    primary: string;
    secondary?: string[];
  };
  context: string;
  tasks: GMATask[];
  successCriteria: {
    definitionOfDone: string[];
    qualityMetrics: Record<string, string>;
  };
  constraints: {
    technical: string[];
    business: string[];
    constitutional: string[];
  };
  fallbackStrategies: Record<string, string[]>;
  monitoring: {
    keyMetrics: string[];
    alerts: string[];
  };
  memoryIntegration: {
    requiredContext: string[];
    memoryUpdates: string[];
  };
  postMissionActions: {
    documentation: string[];
    memoryPersistence: string[];
  };
}

export interface CompiledMissionPlan {
  missionId: string;
  metadata: MissionBriefMetadata;
  spec: MissionBriefSpec;
  executionPlan: {
    taskQueue: GMATask[];
    agentAssignments: Record<string, string[]>; // agentType -> taskIds
    dependencyGraph: Record<string, string[]>; // taskId -> dependentTaskIds
    parallelGroups: string[][]; // Groups of tasks that can run in parallel
  };
  validation: {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    constitutionalCompliant: boolean;
  };
  compiledAt: string;
}

/**
 * GMA Compiler Service
 * Parses MissionBrief.md files and compiles them into executable mission plans
 */
export class GMACompilerService {
  private static instance: GMACompilerService;

  static getInstance(): GMACompilerService {
    if (!GMACompilerService.instance) {
      GMACompilerService.instance = new GMACompilerService();
    }
    return GMACompilerService.instance;
  }

  /**
   * Compile a MissionBrief.md file into an executable mission plan
   */
  async compileMissionBrief(filePath: string): Promise<CompiledMissionPlan> {
    try {
      unifiedLogger.info('🔧 GMACompiler: Starting compilation', { filePath });

      const rawContent = await fs.readFile(filePath, 'utf-8');
      const spec = await this.parseMissionBrief(rawContent);
      const plan = await this.compileToPlan(spec);

      unifiedLogger.info('✅ GMACompiler: Compilation successful', {
        missionId: plan.missionId,
        taskCount: plan.executionPlan.taskQueue.length,
        isValid: plan.validation.isValid,
      });

      return plan;
    } catch (error) {
      unifiedLogger.error('❌ GMACompiler: Compilation failed', { filePath, error });
      throw error;
    }
  }

  /**
   * Parse MissionBrief.md content into structured specification
   */
  private async parseMissionBrief(content: string): Promise<MissionBriefSpec> {
    // Extract YAML frontmatter
    const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
    const match = content.match(frontmatterRegex);

    if (!match) {
      throw new Error('Invalid MissionBrief format: Missing YAML frontmatter');
    }

    const [, yamlContent, markdownContent] = match;
    const metadata = yaml.load(yamlContent) as MissionBriefMetadata;

    // Generate missionId if not provided
    if (!metadata.missionId) {
      metadata.missionId = createUnifiedId('task', 'gma');
    }

    // Parse Markdown sections
    const sections = this.parseMarkdownSections(markdownContent);

    // Extract title (first heading)
    const titleMatch = markdownContent.match(/^# (.+)$/m);
    const title = titleMatch ? titleMatch[1] : 'Untitled Mission';

    // Extract description (first paragraph after title)
    const descMatch = markdownContent.match(/^# .+\n\n(.+?)(?:\n\n|\n##)/s);
    const description = descMatch ? descMatch[1].trim() : '';

    return {
      metadata,
      title,
      description,
      objectives: this.parseObjectives(sections),
      context: this.parseSection(sections, 'Context & Background') || '',
      tasks: await this.parseTasks(sections),
      successCriteria: this.parseSuccessCriteria(sections),
      constraints: this.parseConstraints(sections),
      fallbackStrategies: this.parseFallbackStrategies(sections),
      monitoring: this.parseMonitoring(sections),
      memoryIntegration: this.parseMemoryIntegration(sections),
      postMissionActions: this.parsePostMissionActions(sections),
    };
  }

  /**
   * Parse Markdown content into sections
   */
  private parseMarkdownSections(content: string): Record<string, string> {
    const sections: Record<string, string> = {};
    const sectionRegex = /^## (.+)$\n([\s\S]*?)(?=\n## |\n---|\n$)/gm;

    let match;
    while ((match = sectionRegex.exec(content)) !== null) {
      const [, heading, content] = match;
      sections[heading] = content.trim();
    }

    return sections;
  }

  /**
   * Parse tasks from Task Breakdown section
   */
  private async parseTasks(sections: Record<string, string>): Promise<GMATask[]> {
    const taskSection = sections['Task Breakdown'];
    if (!taskSection) {
      throw new Error('Missing Task Breakdown section');
    }

    const tasks: GMATask[] = [];
    const taskRegex = /### (.+?)\n([\s\S]*?)(?=\n### |\n## |$)/g;

    let match;
    while ((match = taskRegex.exec(taskSection)) !== null) {
      const [, taskName, taskContent] = match;
      const task = await this.parseTask(taskName, taskContent);
      tasks.push(task);
    }

    return tasks;
  }

  /**
   * Parse individual task from content
   */
  private async parseTask(name: string, content: string): Promise<GMATask> {
    const extractField = (field: string): string => {
      const regex = new RegExp(`- \\*\\*${field}\\*\\*: \`?(.+?)\`?$`, 'm');
      const match = content.match(regex);
      return match ? match[1] : '';
    };

    const extractList = (field: string): string[] => {
      const regex = new RegExp(`- \\*\\*${field}\\*\\*:\\s*\`?\\[(.+?)\\]\`?`, 'm');
      const match = content.match(regex);
      if (!match) return [];

      const listStr = match[1];
      if (listStr === 'none') return [];

      return listStr.split(',').map((item) => item.trim());
    };

    const extractCheckboxList = (section: string): string[] => {
      const sectionRegex = new RegExp(
        `- \\*\\*${section}\\*\\*:\\s*\\n([\\s\\S]*?)(?=\\n- \\*\\*|$)`,
        'm',
      );
      const sectionMatch = content.match(sectionRegex);
      if (!sectionMatch) return [];

      const checkboxRegex = /- \[ \] (.+)/g;
      const criteria: string[] = [];
      let checkboxMatch;

      while ((checkboxMatch = checkboxRegex.exec(sectionMatch[1])) !== null) {
        criteria.push(checkboxMatch[1].trim());
      }

      return criteria;
    };

    const taskId = createUnifiedId('task', name.toLowerCase().replace(/\s+/g, '-'));

    return {
      id: taskId,
      name: name.replace(/^Task \d+: /, ''), // Remove "Task N:" prefix
      agent: extractField('Agent'),
      priority: (extractField('Priority') as GMATask['priority']) || 'normal',
      dependencies: extractList('Dependencies'),
      estimatedDuration: extractField('Estimated Duration'),
      description: extractField('Description'),
      acceptanceCriteria: extractCheckboxList('Acceptance Criteria'),
      inputs: extractField('Inputs'),
      outputs: extractField('Outputs'),
      status: 'pending',
    };
  }

  /**
   * Parse objectives section
   */
  private parseObjectives(sections: Record<string, string>): {
    primary: string;
    secondary?: string[];
  } {
    const objectiveSection = sections['Objectives'];
    if (!objectiveSection) {
      throw new Error('Missing Objectives section');
    }

    const primaryMatch = objectiveSection.match(/### Primary Objective\n(.+?)(?=\n###|\n##|$)/s);
    const primary = primaryMatch ? primaryMatch[1].trim() : '';

    const secondaryMatch = objectiveSection.match(
      /### Secondary Objectives.*?\n([\s\S]*?)(?=\n###|\n##|$)/,
    );
    const secondary: string[] = [];

    if (secondaryMatch) {
      const listRegex = /^- (.+)$/gm;
      let listMatch;
      while ((listMatch = listRegex.exec(secondaryMatch[1])) !== null) {
        secondary.push(listMatch[1].trim());
      }
    }

    return { primary, secondary: secondary.length > 0 ? secondary : undefined };
  }

  /**
   * Generic section parser
   */
  private parseSection(sections: Record<string, string>, sectionName: string): string | undefined {
    return sections[sectionName]?.trim();
  }

  /**
   * Parse success criteria section
   */
  private parseSuccessCriteria(sections: Record<string, string>): {
    definitionOfDone: string[];
    qualityMetrics: Record<string, string>;
  } {
    const section = sections['Success Criteria'] || '';

    const dodMatch = section.match(/### Definition of Done\n([\s\S]*?)(?=\n### |$)/);
    const definitionOfDone: string[] = [];

    if (dodMatch) {
      const checkboxRegex = /- \[ \] (.+)/g;
      let match;
      while ((match = checkboxRegex.exec(dodMatch[1])) !== null) {
        definitionOfDone.push(match[1].trim());
      }
    }

    const metricsMatch = section.match(/### Quality Metrics\n([\s\S]*?)(?=\n### |$)/);
    const qualityMetrics: Record<string, string> = {};

    if (metricsMatch) {
      const metricRegex = /- \*\*(.+?)\*\*: (.+)/g;
      let match;
      while ((match = metricRegex.exec(metricsMatch[1])) !== null) {
        qualityMetrics[match[1]] = match[2].trim();
      }
    }

    return { definitionOfDone, qualityMetrics };
  }

  /**
   * Parse constraints section
   */
  private parseConstraints(sections: Record<string, string>): {
    technical: string[];
    business: string[];
    constitutional: string[];
  } {
    const section = sections['Constraints & Limitations'] || '';

    const parseConstraintList = (subsection: string): string[] => {
      const regex = new RegExp(`### ${subsection}\\n([\\s\\S]*?)(?=\\n### |$)`, 'm');
      const match = section.match(regex);
      if (!match) return [];

      const listRegex = /^- (.+)$/gm;
      const items: string[] = [];
      let listMatch;

      while ((listMatch = listRegex.exec(match[1])) !== null) {
        items.push(listMatch[1].trim());
      }

      return items;
    };

    return {
      technical: parseConstraintList('Technical Constraints'),
      business: parseConstraintList('Business Constraints'),
      constitutional: parseConstraintList('Constitutional Constraints'),
    };
  }

  /**
   * Parse fallback strategies section
   */
  private parseFallbackStrategies(sections: Record<string, string>): Record<string, string[]> {
    const section = sections['Fallback Strategies'] || '';
    const strategies: Record<string, string[]> = {};

    const strategyRegex = /### (.+?)\n([\s\S]*?)(?=\n### |$)/g;
    let match;

    while ((match = strategyRegex.exec(section)) !== null) {
      const [, heading, content] = match;
      const steps: string[] = [];
      const stepRegex = /^\d+\. (.+)$/gm;
      let stepMatch;

      while ((stepMatch = stepRegex.exec(content)) !== null) {
        steps.push(stepMatch[1].trim());
      }

      strategies[heading] = steps;
    }

    return strategies;
  }

  /**
   * Parse monitoring section
   */
  private parseMonitoring(sections: Record<string, string>): {
    keyMetrics: string[];
    alerts: string[];
  } {
    const section = sections['Monitoring & Observability'] || '';

    const parseList = (subsection: string): string[] => {
      const regex = new RegExp(`### ${subsection}\\n([\\s\\S]*?)(?=\\n### |$)`, 'm');
      const match = section.match(regex);
      if (!match) return [];

      const listRegex = /^- (.+)$/gm;
      const items: string[] = [];
      let listMatch;

      while ((listMatch = listRegex.exec(match[1])) !== null) {
        items.push(listMatch[1].trim());
      }

      return items;
    };

    return {
      keyMetrics: parseList('Key Metrics'),
      alerts: parseList('Alerts'),
    };
  }

  /**
   * Parse memory integration section
   */
  private parseMemoryIntegration(sections: Record<string, string>): {
    requiredContext: string[];
    memoryUpdates: string[];
  } {
    const section = sections['Memory Integration'] || '';

    const parseList = (subsection: string): string[] => {
      const regex = new RegExp(`### ${subsection}\\n([\\s\\S]*?)(?=\\n### |$)`, 'm');
      const match = section.match(regex);
      if (!match) return [];

      const listRegex = /^- (.+)$/gm;
      const items: string[] = [];
      let listMatch;

      while ((listMatch = listRegex.exec(match[1])) !== null) {
        items.push(listMatch[1].trim());
      }

      return items;
    };

    return {
      requiredContext: parseList('Required Context'),
      memoryUpdates: parseList('Memory Updates'),
    };
  }

  /**
   * Parse post-mission actions section
   */
  private parsePostMissionActions(sections: Record<string, string>): {
    documentation: string[];
    memoryPersistence: string[];
  } {
    const section = sections['Post-Mission Actions'] || '';

    const parseList = (subsection: string): string[] => {
      const regex = new RegExp(`### ${subsection}\\n([\\s\\S]*?)(?=\\n### |$)`, 'm');
      const match = section.match(regex);
      if (!match) return [];

      const listRegex = /^- (.+)$/gm;
      const items: string[] = [];
      let listMatch;

      while ((listMatch = listRegex.exec(match[1])) !== null) {
        items.push(listMatch[1].trim());
      }

      return items;
    };

    return {
      documentation: parseList('Documentation'),
      memoryPersistence: parseList('Memory Persistence'),
    };
  }

  /**
   * Compile parsed specification into executable mission plan
   */
  private async compileToPlan(spec: MissionBriefSpec): Promise<CompiledMissionPlan> {
    const validation = await this.validateSpec(spec);
    const executionPlan = await this.buildExecutionPlan(spec);

    return {
      missionId: spec.metadata.missionId!,
      metadata: spec.metadata,
      spec,
      executionPlan,
      validation,
      compiledAt: createUnifiedTimestamp().iso,
    };
  }

  /**
   * Validate mission specification
   */
  private async validateSpec(spec: MissionBriefSpec): Promise<CompiledMissionPlan['validation']> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required field validation
    if (!spec.metadata.version) errors.push('Missing version in metadata');
    if (!spec.metadata.priority) errors.push('Missing priority in metadata');
    if (!spec.objectives.primary) errors.push('Missing primary objective');
    if (spec.tasks.length === 0) errors.push('No tasks defined');

    // Task validation
    const taskIds = new Set<string>();
    for (const task of spec.tasks) {
      if (taskIds.has(task.id)) {
        errors.push(`Duplicate task ID: ${task.id}`);
      }
      taskIds.add(task.id);

      // Validate dependencies
      for (const depId of task.dependencies) {
        if (!spec.tasks.some((t) => t.id === depId)) {
          errors.push(`Task ${task.id} depends on non-existent task: ${depId}`);
        }
      }

      // Validate agent type
      if (task.agent !== 'auto-select' && !this.isValidAgentType(task.agent)) {
        warnings.push(`Unknown agent type: ${task.agent} in task ${task.id}`);
      }
    }

    // Circular dependency check
    if (this.hasCircularDependencies(spec.tasks)) {
      errors.push('Circular dependencies detected in task graph');
    }

    // Constitutional compliance check
    const constitutionalCompliant =
      spec.metadata.constraints.constitutional && spec.constraints.constitutional.length > 0;

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      constitutionalCompliant,
    };
  }

  /**
   * Build execution plan from specification
   */
  private async buildExecutionPlan(
    spec: MissionBriefSpec,
  ): Promise<CompiledMissionPlan['executionPlan']> {
    const taskQueue = [...spec.tasks].sort((a, b) => {
      // Sort by priority first, then by dependency order
      const priorityOrder = { critical: 0, high: 1, normal: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    // Build dependency graph
    const dependencyGraph: Record<string, string[]> = {};
    for (const task of spec.tasks) {
      dependencyGraph[task.id] = task.dependencies;
    }

    // Build agent assignments
    const agentAssignments: Record<string, string[]> = {};
    for (const task of spec.tasks) {
      const agentType = task.agent === 'auto-select' ? this.selectOptimalAgent(task) : task.agent;
      if (!agentAssignments[agentType]) {
        agentAssignments[agentType] = [];
      }
      agentAssignments[agentType].push(task.id);
    }

    // Build parallel execution groups
    const parallelGroups = this.buildParallelGroups(spec.tasks, dependencyGraph);

    return {
      taskQueue,
      agentAssignments,
      dependencyGraph,
      parallelGroups,
    };
  }

  /**
   * Check for circular dependencies in task graph
   */
  private hasCircularDependencies(tasks: GMATask[]): boolean {
    const graph: Record<string, string[]> = {};
    for (const task of tasks) {
      graph[task.id] = task.dependencies;
    }

    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycle = (nodeId: string): boolean => {
      if (recursionStack.has(nodeId)) return true;
      if (visited.has(nodeId)) return false;

      visited.add(nodeId);
      recursionStack.add(nodeId);

      for (const depId of graph[nodeId] || []) {
        if (hasCycle(depId)) return true;
      }

      recursionStack.delete(nodeId);
      return false;
    };

    for (const task of tasks) {
      if (hasCycle(task.id)) return true;
    }

    return false;
  }

  /**
   * Build groups of tasks that can execute in parallel
   */
  private buildParallelGroups(
    tasks: GMATask[],
    _dependencyGraph: Record<string, string[]>,
  ): string[][] {
    const groups: string[][] = [];
    const processed = new Set<string>();

    while (processed.size < tasks.length) {
      const readyTasks: string[] = [];

      for (const task of tasks) {
        if (processed.has(task.id)) continue;

        // Check if all dependencies are processed
        const allDepsReady = task.dependencies.every((depId) => processed.has(depId));
        if (allDepsReady) {
          readyTasks.push(task.id);
        }
      }

      if (readyTasks.length === 0) {
        // This shouldn't happen if validation passed
        break;
      }

      groups.push(readyTasks);
      readyTasks.forEach((taskId) => processed.add(taskId));
    }

    return groups;
  }

  /**
   * Select optimal agent for auto-select tasks
   */
  private selectOptimalAgent(task: GMATask): string {
    // Simple heuristic for MVP - can be enhanced with ML/memory-driven selection
    const keywords = task.description.toLowerCase();

    if (keywords.includes('data') || keywords.includes('analysis')) {
      return 'data-analyst';
    }
    if (keywords.includes('memory') || keywords.includes('context')) {
      return 'memory-specialist';
    }
    if (keywords.includes('report') || keywords.includes('document')) {
      return 'report-generator';
    }
    if (keywords.includes('validate') || keywords.includes('quality')) {
      return 'quality-validator';
    }

    return 'general-agent'; // Fallback
  }

  /**
   * Check if agent type is valid/registered
   */
  private isValidAgentType(agentType: string): boolean {
    // This should check against actual registered agent types
    // For MVP, we'll use a basic list
    const knownAgents = [
      'data-analyst',
      'memory-specialist',
      'report-generator',
      'quality-validator',
      'general-agent',
      'triage-agent',
      'constitutional-validator',
      'spec-linter',
    ];

    return knownAgents.includes(agentType);
  }
}

// Export singleton instance
export const gmaCompilerService = GMACompilerService.getInstance();
