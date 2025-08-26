import * as fs from 'fs/promises';
import * as path from 'path';

export interface BMADPlanStatus {
  message: string;
  docs: {
    brainstorming: string;
    featureSpec: string;
    technicalDesign: string;
  };
  awaitingApproval: boolean;
}

/**
 * DevAgent.ts - Development Agent Implementation
 *
 * BaseAgent instance that:
 * - Inherits from BaseAgent with memory integration
 * - Processes actual user messages
 * - Stores conversations in memory
 * - Uses AI for responses
 * - Has Constitutional AI validation
 * - Provides actual development assistance
 */

import { BaseAgent, AgentConfig, AgentContext, AgentResponse } from '../base/BaseAgent';
import type { AgentMessage, MemoryRecord } from '../../types/oneagent-backbone-types';
import { createUnifiedTimestamp } from '../../utils/UnifiedBackboneService';
import { ISpecializedAgent } from '../base/ISpecializedAgent';

export interface ExecutionResult {
  success: boolean;
  filesCreated: string[];
  reviewNotes?: string;
}

import { PromptConfig } from '../base/PromptEngine';

export interface DevAgentCapabilities {
  codeReview: boolean;
  debugging: boolean;
  codeGeneration: boolean;
  architectureGuidance: boolean;
  testingSupport: boolean;
  performanceOptimization: boolean;
}

export interface DevAgentResponse extends AgentResponse {
  codeExamples?: string[];
  suggestions?: string[];
  qualityScore?: number;
}

/**
 * Development Agent - ISpecializedAgent implementation
 */
export class DevAgent extends BaseAgent implements ISpecializedAgent {
  private capabilities: DevAgentCapabilities;
  private conversationHistory: AgentMessage[] = [];

  constructor(config: AgentConfig, promptConfig?: PromptConfig) {
    super(config, promptConfig);

    this.capabilities = {
      codeReview: true,
      debugging: true,
      codeGeneration: true,
      architectureGuidance: true,
      testingSupport: true,
      performanceOptimization: true,
    };
  }

  /**
   * Executes code generation and QA review for an approved plan (Epic 4, User Story 4.2)
   */
  public async executeApprovedPlan(taskId: string): Promise<ExecutionResult> {
    const tempDir = path.join('temp', `devagent_${taskId}`);
    const technicalDesignPath = path.join(tempDir, 'technical_design.md');
    let technicalDesign: string;
    try {
      technicalDesign = await fs.readFile(technicalDesignPath, 'utf8');
    } catch (err) {
      return {
        success: false,
        filesCreated: [],
        reviewNotes: `Fant ikke technical_design.md: ${err}`,
      };
    }

    // Parse coding tasks from technical_design.md
    // Example format: "Opprett filen `user.controller.ts`: Implementer createUser-funksjonen"
    const taskRegex = /Opprett filen `(.*?)`:(.*?)(?=Opprett filen|$)/gs;
    const codingTasks: { file: string; instruction: string }[] = [];
    let match;
    while ((match = taskRegex.exec(technicalDesign)) !== null) {
      codingTasks.push({ file: match[1].trim(), instruction: match[2].trim() });
    }
    if (codingTasks.length === 0) {
      return {
        success: false,
        filesCreated: [],
        reviewNotes: 'Ingen kodingsoppgaver funnet i technical_design.md.',
      };
    }

    // Canonical LLM client
    const SmartGeminiClient = (await import('../../tools/SmartGeminiClient')).default;
    const llmClient = new SmartGeminiClient({ useWrapperFirst: true });

    // Load coder persona
    const coderPersona = await fs.readFile(path.join('prompts', 'personas', 'coder.yaml'), 'utf8');
    const filesCreated: string[] = [];

    // Step 4: Generate code for each task
    for (const { file, instruction } of codingTasks) {
      const coderPrompt = `${coderPersona}\n\n${instruction}`;
      let codeResult;
      try {
        codeResult = await llmClient.generateContent(coderPrompt);
      } catch (err) {
        return {
          success: false,
          filesCreated,
          reviewNotes: `Feil under kodegenerering for ${file}: ${err}`,
        };
      }
      const code = String(codeResult.response);
      const filePath = path.join(tempDir, file);
      try {
        await fs.writeFile(filePath, code);
      } catch (fsErr) {
        return {
          success: false,
          filesCreated,
          reviewNotes: `Feil under skriving av fil ${file}: ${fsErr}`,
        };
      }
      filesCreated.push(filePath);
    }

    // Step 5: QA review
    const qaPersona = await fs.readFile(path.join('prompts', 'personas', 'qa.yaml'), 'utf8');
    let allCode = '';
    for (const filePath of filesCreated) {
      const code = await fs.readFile(filePath, 'utf8');
      allCode += `\n\n--- ${path.basename(filePath)} ---\n${code}`;
    }
    const qaPrompt = `${qaPersona}\n\n${allCode}`;
    let qaResult;
    try {
      qaResult = await llmClient.generateContent(qaPrompt);
    } catch (err) {
      return { success: true, filesCreated, reviewNotes: `QA feilet: ${err}` };
    }
    const reviewNotes = String(qaResult.response);

    // Optionally save QA report
    const qaReportPath = path.join(tempDir, 'qa_review.md');
    await fs.writeFile(qaReportPath, reviewNotes);

    return { success: true, filesCreated, reviewNotes };
  }

  /**
   * BMAD Analysis & Planning entrypoint (Epic 4, User Story 4.1)
   * Orchestrates the three persona-driven LLM calls and pauses for approval.
   */
  async execute(task: string): Promise<BMADPlanStatus> {
    // Canonical unique ID for this BMAD planning task
    const taskId = createUnifiedTimestamp().unix.toString();
    return await this.executeBMADPlanning(task, taskId);
  }

  private async executeBMADPlanning(task: string, taskId: string): Promise<BMADPlanStatus> {
    const tempDir = path.join('temp', `devagent_${taskId}`);
    await fs.mkdir(tempDir, { recursive: true });

    // Use canonical premium LLM client
    const SmartGeminiClient = (await import('../../tools/SmartGeminiClient')).default;
    const llmClient = new SmartGeminiClient({ useWrapperFirst: true });

    // Step 1: Analyst persona
    const analystPersona = await fs.readFile(
      path.join('prompts', 'personas', 'analyst.yaml'),
      'utf8',
    );
    const analystPrompt = `${analystPersona}\n\n${task}`;
    const brainstormingResp = await llmClient.generateContent(analystPrompt);
    const brainstormingDoc = String(brainstormingResp.response);
    const brainstormingPath = path.join(tempDir, 'brainstorming_doc.md');
    await fs.writeFile(brainstormingPath, brainstormingDoc);

    // Step 2: Product Manager persona
    const pmPersona = await fs.readFile(path.join('prompts', 'personas', 'pm.yaml'), 'utf8');
    const pmPrompt = `${pmPersona}\n\n${brainstormingDoc}`;
    const featureSpecResp = await llmClient.generateContent(pmPrompt);
    const featureSpecDoc = String(featureSpecResp.response);
    const featureSpecPath = path.join(tempDir, 'feature.spec.md');
    await fs.writeFile(featureSpecPath, featureSpecDoc);

    // Step 3: Architect persona
    const architectPersona = await fs.readFile(
      path.join('prompts', 'personas', 'architect.yaml'),
      'utf8',
    );
    const architectPrompt = `${architectPersona}\n\n${featureSpecDoc}`;
    const technicalDesignResp = await llmClient.generateContent(architectPrompt);
    const technicalDesignDoc = String(technicalDesignResp.response);
    const technicalDesignPath = path.join(tempDir, 'technical_design.md');
    await fs.writeFile(technicalDesignPath, technicalDesignDoc);

    // Pause for approval
    return {
      message: 'Planen er klar for din godkjenning. Se dokumentene nedenfor.',
      docs: {
        brainstorming: brainstormingPath,
        featureSpec: featureSpecPath,
        technicalDesign: technicalDesignPath,
      },
      awaitingApproval: true,
    };
  }

  /**
   * REAL message processing - not just metadata!
  async execute(task: string): Promise<BMADPlanStatus> {
    // Canonical unique ID for this BMAD planning task
    const taskId = generateUnifiedId('bmad_task', 'DevAgent');
    return await this.executeBMADPlanning(task, taskId);
  }
    const userMessage: AgentMessage = {
      sessionId: context.sessionId,
      fromAgent: this.config.id,
      toAgent: undefined,
      content: message,
      messageType: 'question',
      metadata: {
        userId: context.user.id,
      },
    };
    this.conversationHistory.push(userMessage);

    // Persist user message in unified memory (canonical) with timestamp
    const brainstormingDoc = await llmClient.generate({
      const metadata = unifiedMetadataService.create('dev_agent_user_message', 'DevAgent', {
        system: {
          source: 'dev_agent',
          component: 'DevAgent',
          sessionId: context.sessionId,
          userId: context.user.id,
        },
        content: {
    const featureSpecDoc = await llmClient.generate({
          tags: ['dev', 'user_message'],
          sensitivity: 'internal',
          relevanceScore: 0.1,
          contextDependency: 'session',
        },
      });
      await this.memoryClient?.addMemoryCanonical(message, metadata, context.user.id);
    } catch (memoryErr) {
      console.warn(`⚠️ DevAgent memory add failed: ${memoryErr}`);
    }

    const technicalDesignDoc = await llmClient.generate({
    let priorMemories: MemoryRecord[] = [];
    try {
      const search = await this.memoryClient?.searchMemory({
        query: message.slice(0, 80),
        limit: 3,
        filters: { type: 'dev_agent_user_message', agentId: this.config.id },
      });
      priorMemories = search?.results || [];
    } catch (searchErr) {
      console.warn(`⚠️ DevAgent memory search failed: ${searchErr}`);
    }

    // Analyze the request type
    const requestType = this.analyzeRequestType(message);

    // Generate AI response using the enhanced prompt system
    const aiResponse = await this.generateDevelopmentResponse(message, context, requestType);

    // Add to conversation history
    const agentMessage: AgentMessage = {
      sessionId: context.sessionId,
      fromAgent: this.config.id,
      toAgent: undefined,
      content: aiResponse,
      messageType: 'update',
      metadata: {
        requestType,
        qualityScore: 85, // TODO: Calculate actual quality score
      },
    };
    this.conversationHistory.push(agentMessage);

    return this.createDevResponse(aiResponse, requestType, priorMemories);
  }

  /**
   * REAL AI-powered development response generation with personality enhancement
   */
  private async generateDevelopmentResponse(
    message: string,
    context: AgentContext,
    requestType: string,
  ): Promise<string> {
    // Build enhanced development prompt
    const developmentPrompt = this.buildDevelopmentPrompt(message, requestType);

    // Generate base response using AI
    const baseResponse = await this.generateResponse(developmentPrompt);

    // Apply personality enhancement for authentic DevAgent perspective
    const personalityEnhancedResponse = await this.generatePersonalityResponse(
      baseResponse,
      context,
      // Create a basic persona for DevAgent
      {
        role: 'Developer Assistant',
        style: 'Professional and analytical',
        coreStrength: 'Software development expertise and problem-solving',
        principles: ['accuracy', 'helpfulness', 'technical_precision'],
        frameworks: ['systematic_analysis', 'problem_solving'],
      },
    );

    return personalityEnhancedResponse;
  }

  /**
   * Override domain context for DevAgent personality
   */
  protected getDomainContext(): string {
    return 'software-development';
  }

  /**
   * Override domain keywords for DevAgent expertise assessment
   */
  protected getDomainKeywords(): string[] {
    return [
      'code',
      'function',
      'class',
      'variable',
      'method',
      'api',
      'bug',
      'debug',
      'test',
      'architecture',
      'database',
      'algorithm',
      'performance',
      'security',
      'framework',
      'library',
      'typescript',
      'javascript',
      'python',
      'node',
      'react',
      'git',
      'deployment',
      'refactor',
      'optimize',
      'implement',
    ];
  }

  /**
   * Build specialized development prompt
   */
  private buildDevelopmentPrompt(message: string, requestType: string): string {
    const systemPrompt = `You are DevAgent, a professional development assistant with expertise in:
- Code review and quality analysis
- Debugging and troubleshooting
- Code generation and implementation
- Architecture and design guidance
- Testing strategies and implementation
- Performance optimization

Request type: ${requestType}

User request: ${message}

Provide helpful, actionable development guidance with specific examples where appropriate.`;

    return systemPrompt;
  }

  /**
   * Analyze what type of development request this is
   */
  private analyzeRequestType(message: string): string {
    const messageLower = message.toLowerCase();

    if (messageLower.includes('review') || messageLower.includes('check')) {
      return 'code_review';
    } else if (
      messageLower.includes('debug') ||
      messageLower.includes('error') ||
      messageLower.includes('fix')
    ) {
      return 'debugging';
    } else if (
      messageLower.includes('generate') ||
      messageLower.includes('create') ||
      messageLower.includes('build')
    ) {
      return 'code_generation';
    } else if (
      messageLower.includes('architecture') ||
      messageLower.includes('design') ||
      messageLower.includes('structure')
    ) {
      return 'architecture_guidance';
    } else if (messageLower.includes('test') || messageLower.includes('testing')) {
      return 'testing_support';
    } else if (
      messageLower.includes('optimize') ||
      messageLower.includes('performance') ||
      messageLower.includes('speed')
    ) {
      return 'performance_optimization';
    }

    return 'general_development';
  }

  /**
   * Create specialized development response
   */
  private createDevResponse(
    content: string,
    requestType: string,
    priorMemories: MemoryRecord[] = [],
  ): DevAgentResponse {
    const ts = createUnifiedTimestamp();
    return {
      content,
      actions: [
        {
          type: 'development_assistance',
          description: `Provided ${requestType} assistance`,
          parameters: { requestType },
        },
      ],
      memories: priorMemories, // Surface a few contextual memories
      metadata: {
        agentId: this.config.id,
        timestamp: ts.iso,
        requestType,
        capabilities: Object.keys(this.capabilities),
        isRealAgent: true, // NOT just metadata!
        priorMemoriesUsed: priorMemories.length,
      },
    };
  }

  /**
   * Get conversation history for this session
   */
  getConversationHistory(): AgentMessage[] {
    return [...this.conversationHistory];
  }

  /**
   * Get agent capabilities
   */
  getCapabilities(): DevAgentCapabilities {
    return { ...this.capabilities };
  }

  get id(): string {
    return this.config.id;
  }
}
