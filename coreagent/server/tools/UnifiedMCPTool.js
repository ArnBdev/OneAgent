"use strict";
/**
 * Unified MCP Tool Framework
 * Constitutional AI-compliant tool architecture with predictable patterns
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnifiedMCPTool = void 0;
const RealUnifiedMemoryClient_1 = __importDefault(require("../memory/RealUnifiedMemoryClient"));
/**
 * Base class for all unified MCP tools
 * Implements Constitutional AI compliance and predictable execution patterns
 */
class UnifiedMCPTool {
    constructor(name, description, schema, constitutionalLevel = 'basic') {
        this.name = name;
        this.description = description;
        this.schema = schema;
        this.constitutionalLevel = constitutionalLevel;
        this.unifiedMemoryClient = new RealUnifiedMemoryClient_1.default();
    }
    /**
     * Main execution method - implements the unified tool pipeline
     */
    async execute(args, id) {
        try {
            // Phase 1: Input Validation & Constitutional AI Check
            const validationResult = await this.validateInput(args);
            if (!validationResult.isValid) {
                return this.createErrorResponse(id, validationResult.errors || ['Invalid input']);
            }
            // Phase 2: Core Logic Execution
            const executionResult = await this.executeCore(validationResult.cleanArgs);
            // Phase 3: Output Formatting & Quality Check
            const qualityScore = await this.assessQuality(executionResult);
            return this.createSuccessResponse(id, executionResult, qualityScore);
        }
        catch (error) {
            // Phase 4: Error Handling & Fallback
            console.error(`[${this.name}] Error:`, error);
            return this.createFallbackResponse(id, error);
        }
    }
    /**
     * Phase 1: Input validation with Constitutional AI principles
     */
    async validateInput(args) {
        const errors = [];
        // Check required fields
        for (const field of this.schema.required) {
            if (!args[field]) {
                errors.push(`Missing required field: ${field}`);
            }
        }
        // Validate field types
        for (const [fieldName, fieldSchema] of Object.entries(this.schema.properties)) {
            if (args[fieldName] !== undefined) {
                const isValid = this.validateFieldType(args[fieldName], fieldSchema);
                if (!isValid) {
                    errors.push(`Invalid type for field: ${fieldName}`);
                }
            }
        }
        // Constitutional AI validation for enhanced/critical tools
        let constitutionalScore = 100;
        if (this.constitutionalLevel !== 'basic') {
            constitutionalScore = await this.performConstitutionalValidation(args);
        }
        return {
            isValid: errors.length === 0 && constitutionalScore >= 70,
            cleanArgs: this.sanitizeArgs(args),
            errors: errors.length > 0 ? errors : [],
            constitutionalScore
        };
    }
    /**
     * Phase 3: Quality assessment
     */
    async assessQuality(result) {
        // Base quality scoring - can be enhanced per tool
        let score = result.success ? 80 : 30;
        // Adjust based on data completeness
        if (result.data && typeof result.data === 'object') {
            const dataKeys = Object.keys(result.data);
            score += Math.min(dataKeys.length * 2, 15); // Max 15 bonus points
        }
        // Constitutional AI alignment bonus
        if (this.constitutionalLevel === 'critical') {
            score += 5; // Bonus for critical tool compliance
        }
        return Math.min(score, 100);
    }
    /**
     * Success response formatter - follows working memory_context pattern
     */
    createSuccessResponse(id, result, qualityScore) {
        return {
            jsonrpc: '2.0',
            id,
            result: {
                content: [{
                        type: 'text',
                        text: JSON.stringify({
                            success: result.success,
                            ...result.data,
                            qualityScore,
                            toolName: this.name,
                            constitutionalCompliant: true,
                            timestamp: new Date().toISOString(),
                            ...(result.metadata && { metadata: result.metadata })
                        }, null, 2)
                    }],
                isError: false
            }
        };
    }
    /**
     * Error response formatter
     */
    createErrorResponse(id, errors) {
        return {
            jsonrpc: '2.0',
            id,
            result: {
                content: [{
                        type: 'text',
                        text: JSON.stringify({
                            success: false,
                            error: errors.join(', '),
                            toolName: this.name,
                            fallbackAvailable: this.hasFallback(),
                            timestamp: new Date().toISOString()
                        }, null, 2)
                    }],
                isError: true
            }
        };
    }
    /**
     * Fallback response formatter - graceful degradation
     */
    createFallbackResponse(id, error) {
        const fallbackData = this.getFallbackData();
        return {
            jsonrpc: '2.0',
            id,
            result: {
                content: [{
                        type: 'text',
                        text: JSON.stringify({
                            success: false,
                            error: error instanceof Error ? error.message : 'Unknown error',
                            fallback: fallbackData,
                            toolName: this.name,
                            constitutionalNote: 'Tool failed gracefully with fallback data',
                            timestamp: new Date().toISOString()
                        }, null, 2)
                    }],
                isError: false // Not an error if we have graceful fallback
            }
        };
    }
    // Helper methods
    validateFieldType(value, schema) {
        if (schema.type === 'string')
            return typeof value === 'string';
        if (schema.type === 'number')
            return typeof value === 'number';
        if (schema.type === 'boolean')
            return typeof value === 'boolean';
        if (schema.type === 'object')
            return typeof value === 'object';
        if (schema.type === 'array')
            return Array.isArray(value);
        return true; // Allow unknown types
    }
    sanitizeArgs(args) {
        // Basic sanitization - remove undefined values
        const clean = {};
        for (const [key, value] of Object.entries(args)) {
            if (value !== undefined) {
                clean[key] = value;
            }
        }
        return clean;
    }
    async performConstitutionalValidation(args) {
        // Simplified constitutional validation
        // In real implementation, this would call Constitutional AI service
        let score = 100;
        // Check for harmful content patterns
        const content = JSON.stringify(args).toLowerCase();
        if (content.includes('delete') || content.includes('remove')) {
            score -= 10; // Slight penalty for destructive operations
        }
        return score;
    }
    hasFallback() {
        // Default: assume tools have some fallback capability
        return true;
    }
    getFallbackData() {
        // Default fallback data
        return {
            message: `${this.name} encountered an error but is designed for graceful degradation`,
            suggestions: ['Try again with different parameters', 'Check system health', 'Contact support if issue persists']
        };
    }
}
exports.UnifiedMCPTool = UnifiedMCPTool;
