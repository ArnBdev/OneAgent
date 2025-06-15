"use strict";
/**
 * RealOfficeAgent.ts - ACTUAL Office Productivity Agent Implementation
 *
 * This is a REAL BaseAgent instance that:
 * - Inherits from BaseAgent with full functionality
 * - Handles office tasks and productivity
 * - Manages documents, emails, scheduling
 * - Uses memory for user preferences and history
 * - Provides actual office assistance
 *
 * NOT just metadata - this is a functioning office agent!
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.officeAgent = exports.OfficeAgent = void 0;
const BaseAgent_1 = require("../base/BaseAgent");
const uuid_1 = require("uuid");
/**
 * REAL Office Agent - Actual BaseAgent implementation for productivity
 */
class OfficeAgent extends BaseAgent_1.BaseAgent {
    constructor() {
        const config = {
            id: 'OfficeAgent',
            name: 'OfficeAgent',
            description: 'REAL office productivity agent with memory, AI, and task management',
            capabilities: [
                'document_creation',
                'email_drafting',
                'calendar_scheduling',
                'meeting_planning',
                'task_management',
                'productivity_optimization',
                'memory_integration'
            ],
            memoryEnabled: true, // REAL memory integration
            aiEnabled: true // REAL AI integration
        };
        super(config);
        this.officeTasks = new Map();
        this.userPreferences = new Map();
        this.conversationHistory = [];
    }
    /**
     * REAL message processing with office productivity logic
     */
    async processMessage(context, message) {
        this.validateContext(context);
        // Store the incoming message in memory
        await this.storeUserMessage(context.user.id, message, context);
        // Add to conversation history
        const userMessage = {
            id: (0, uuid_1.v4)(),
            content: message,
            sender: 'user',
            timestamp: new Date(),
            metadata: {
                sessionId: context.sessionId,
                userId: context.user.id
            }
        };
        this.conversationHistory.push(userMessage);
        // Analyze the office request type
        const requestAnalysis = await this.analyzeOfficeRequest(message, context);
        // Generate office assistance response
        const response = await this.generateOfficeResponse(message, context, requestAnalysis);
        // Handle specific office tasks
        await this.handleOfficeTask(requestAnalysis, context);
        // Store the agent response in memory
        await this.storeAgentResponse(context.user.id, response, context);
        // Add to conversation history
        const agentMessage = {
            id: (0, uuid_1.v4)(),
            content: response,
            sender: 'agent',
            timestamp: new Date(),
            metadata: {
                sessionId: context.sessionId,
                requestType: requestAnalysis.type,
                tasksCreated: requestAnalysis.createTask ? 1 : 0
            }
        };
        this.conversationHistory.push(agentMessage);
        return this.createOfficeResponse(response, requestAnalysis);
    }
    /**
     * Analyze office productivity request
     */
    async analyzeOfficeRequest(message, _context) {
        const messageLower = message.toLowerCase();
        let type = 'general';
        if (messageLower.includes('document') || messageLower.includes('write') || messageLower.includes('draft')) {
            type = 'document';
        }
        else if (messageLower.includes('email') || messageLower.includes('mail')) {
            type = 'email';
        }
        else if (messageLower.includes('calendar') || messageLower.includes('schedule') || messageLower.includes('appointment')) {
            type = 'calendar';
        }
        else if (messageLower.includes('meeting') || messageLower.includes('conference')) {
            type = 'meeting';
        }
        else if (messageLower.includes('task') || messageLower.includes('todo') || messageLower.includes('remind')) {
            type = 'task';
        }
        // Determine urgency
        let urgency = 'medium';
        if (messageLower.includes('urgent') || messageLower.includes('asap') || messageLower.includes('immediately')) {
            urgency = 'high';
        }
        else if (messageLower.includes('later') || messageLower.includes('when possible')) {
            urgency = 'low';
        }
        // Should we create a task?
        const createTask = messageLower.includes('create') || messageLower.includes('add') ||
            messageLower.includes('schedule') || messageLower.includes('remind');
        return {
            type,
            urgency,
            createTask,
            ...(createTask && { taskDescription: message })
        };
    }
    /**
     * Generate office assistance response using AI
     */
    async generateOfficeResponse(message, context, analysis) {
        // Search for relevant office memories and preferences
        const relevantMemories = await this.searchMemories(context.user.id, message, 5);
        // Load user preferences
        const userPrefs = this.userPreferences.get(context.user.id) || {};
        // Build office assistance prompt
        const officePrompt = this.buildOfficePrompt(message, analysis, relevantMemories, userPrefs);
        // Generate response using AI
        const response = await this.generateResponse(officePrompt, relevantMemories);
        return response;
    }
    /**
     * Build specialized office assistance prompt
     */
    buildOfficePrompt(message, analysis, memories, userPrefs) {
        const memoryContext = memories.length > 0
            ? `\nRelevant office history:\n${memories.map(m => `- ${m.content}`).join('\n')}`
            : '';
        const preferencesContext = Object.keys(userPrefs).length > 0
            ? `\nUser preferences: ${JSON.stringify(userPrefs)}`
            : '';
        const systemPrompt = `You are RealOfficeAgent, a professional office productivity assistant with expertise in:

Core Capabilities:
- Document creation and editing
- Email drafting and communication
- Calendar management and scheduling
- Meeting planning and coordination
- Task management and reminders
- Productivity optimization

Current request analysis:
- Type: ${analysis.type}
- Urgency: ${analysis.urgency}
- Create task: ${analysis.createTask}

${memoryContext}${preferencesContext}

User request: ${message}

Provide helpful, professional office assistance. If creating documents or emails, offer specific templates or structures. For scheduling, suggest optimal times and considerations.`;
        return systemPrompt;
    }
    /**
     * Handle specific office tasks (create, update, etc.)
     */
    async handleOfficeTask(analysis, context) {
        if (analysis.createTask && analysis.taskDescription) {
            await this.createOfficeTask(analysis.type, analysis.taskDescription, analysis.urgency, context.user.id);
        }
    }
    /**
     * Create a new office task
     */
    async createOfficeTask(type, description, priority = 'medium', userId) {
        const task = {
            id: (0, uuid_1.v4)(),
            type,
            title: description.substring(0, 50) + (description.length > 50 ? '...' : ''),
            description,
            status: 'pending',
            priority,
            createdAt: new Date()
        };
        this.officeTasks.set(task.id, task);
        // Store task in memory for persistence
        await this.addMemory(userId, `Office task created: ${description}`, {
            taskId: task.id,
            taskType: type,
            priority,
            createdAt: task.createdAt.toISOString()
        });
        return task;
    }
    /**
     * Update task status
     */
    async updateTaskStatus(taskId, status, userId) {
        const task = this.officeTasks.get(taskId);
        if (!task)
            return false;
        task.status = status;
        // Store update in memory
        await this.addMemory(userId, `Office task ${taskId} updated to ${status}`, {
            taskId,
            newStatus: status,
            updatedAt: new Date().toISOString()
        });
        return true;
    }
    /**
     * Get user's office tasks
     */
    getUserTasks(_userId) {
        // In a real implementation, we'd filter by userId
        return Array.from(this.officeTasks.values());
    }
    /**
     * Update user preferences
     */
    async updateUserPreferences(userId, preferences) {
        this.userPreferences.set(userId, { ...this.userPreferences.get(userId), ...preferences });
        await this.addMemory(userId, `Office preferences updated`, {
            preferences,
            updatedAt: new Date().toISOString()
        });
    }
    /**
     * Store user message in memory
     */
    async storeUserMessage(userId, message, context) {
        const content = `User office request: ${message}`;
        const metadata = {
            messageType: 'office_request',
            agentId: this.config.id,
            sessionId: context.sessionId,
            timestamp: new Date().toISOString(),
            userId: userId
        };
        await this.addMemory(userId, content, metadata);
    }
    /**
     * Store agent response in memory
     */
    async storeAgentResponse(userId, response, context) {
        const content = `RealOfficeAgent response: ${response}`;
        const metadata = {
            messageType: 'office_response',
            agentId: this.config.id,
            sessionId: context.sessionId,
            timestamp: new Date().toISOString(),
            userId: userId
        };
        await this.addMemory(userId, content, metadata);
    }
    /**
     * Create specialized office response
     */
    createOfficeResponse(content, analysis) {
        return {
            content,
            actions: [{
                    type: 'office_assistance',
                    description: `Provided ${analysis.type} assistance`,
                    parameters: {
                        requestType: analysis.type,
                        urgency: analysis.urgency,
                        taskCreated: analysis.createTask
                    }
                }],
            memories: [], // Memories are handled separately
            metadata: {
                agentId: this.config.id,
                timestamp: new Date().toISOString(),
                requestAnalysis: analysis,
                totalTasks: this.officeTasks.size,
                isRealAgent: true // NOT just metadata!
            }
        };
    }
    /**
     * Get office productivity summary
     */
    getProductivitySummary() {
        const tasks = Array.from(this.officeTasks.values());
        return {
            totalTasks: tasks.length,
            pendingTasks: tasks.filter(t => t.status === 'pending').length,
            completedTasks: tasks.filter(t => t.status === 'completed').length,
            conversationLength: this.conversationHistory.length
        };
    }
    /**
     * Override cleanup to save state
     */
    async cleanup() {
        // Save final productivity state to memory
        const summary = this.getProductivitySummary();
        await this.addMemory('system', `RealOfficeAgent session ended. Summary: ${JSON.stringify(summary)}`, {
            sessionEnd: true,
            productivitySummary: summary
        });
        await super.cleanup();
    }
}
exports.OfficeAgent = OfficeAgent;
// Export singleton instance for use in the server
exports.officeAgent = new OfficeAgent();
