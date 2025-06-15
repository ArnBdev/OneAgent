import * as vscode from 'vscode';
import { OneAgentClient } from '../connection/oneagent-client';

export class OneAgentChatProvider {
    constructor(private client: OneAgentClient) {}
      async handleRequest(
        request: vscode.ChatRequest,
        _context: vscode.ChatContext,
        response: vscode.ChatResponseStream,
        token: vscode.CancellationToken
    ): Promise<void> {
          // Check if OneAgent is available
        const isAvailable = await this.client.healthCheck();
        if (!isAvailable) {
            response.markdown('⚠️ **OneAgent server is not available**\n\nPlease ensure OneAgent is running (check .env for port configuration).\n\nYou can check the connection in OneAgent settings.');
            return;
        }
        
        try {
            // Show thinking indicator
            response.markdown('🧠 **OneAgent is analyzing your request...**\n\n');
            
            // Check if cancellation was requested
            if (token.isCancellationRequested) {
                return;
            }
            
            // Get configuration
            const config = this.client.getConfiguration();
            
            // Get AI response with Constitutional AI
            const aiResponse = await this.client.aiAssistant({
                message: request.prompt,
                applyConstitutional: config.enableConstitutionalAI,
                qualityThreshold: config.qualityThreshold
            });
              if (!aiResponse.success) {
                response.markdown(`❌ **Error**: ${aiResponse.error}\n\nPlease check OneAgent server status and try again.`);
                return;
            }
            
            // Check for cancellation again
            if (token.isCancellationRequested) {
                return;
            }
            
            // Display response with quality indicator
            if (aiResponse.data?.qualityScore !== undefined) {
                const qualityEmoji = this.getQualityEmoji(aiResponse.data.qualityScore);
                const grade = this.getQualityGrade(aiResponse.data.qualityScore);
                response.markdown(`${qualityEmoji} **Quality Score**: ${aiResponse.data.qualityScore}% (Grade: ${grade})\n\n`);
            }
            
            // Display main content
            if (aiResponse.data?.content) {
                response.markdown(aiResponse.data.content);
            } else if (aiResponse.data?.response) {
                response.markdown(aiResponse.data.response);
            } else {
                response.markdown('Response received but content format was unexpected.');
            }
            
            // Add Constitutional AI compliance note
            if (config.enableConstitutionalAI && aiResponse.data?.constitutionalCompliance) {
                response.markdown('\n\n✅ **Constitutional AI Validated**: Response meets accuracy, transparency, helpfulness, and safety standards');
            }
            
            // Store interaction in memory for context
            try {
                const userId = vscode.env.machineId;
                await this.client.memoryCreate(
                    `User: ${request.prompt}\nAssistant: ${aiResponse.data?.content || aiResponse.data?.response}`,
                    userId,
                    'session'
                );
            } catch (error) {
                // Silent fail for memory storage - not critical
                console.warn('Failed to store interaction in memory:', error);
            }
              } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            response.markdown(`❌ **Unexpected error**: ${errorMessage}\n\nPlease check OneAgent server connection and try again.`);
            console.error('OneAgent chat error:', error);
        }
    }
      async provideFollowups(
        _result: vscode.ChatResult,
        _context: vscode.ChatContext,
        _token: vscode.CancellationToken
    ): Promise<vscode.ChatFollowup[]> {
        
        // Check if OneAgent is available before providing followups
        const isAvailable = await this.client.healthCheck();
        if (!isAvailable) {
            return [
                {
                    prompt: 'Check OneAgent connection',
                    label: '🔌 Check Connection'
                }
            ];
        }
        
        return [
            {
                prompt: 'Analyze this with BMAD framework',
                label: '🔍 BMAD Analysis',
                command: 'oneagent.bmadAnalyze'
            },
            {
                prompt: 'Check code quality score',
                label: '📊 Quality Score',
                command: 'oneagent.qualityScore'
            },
            {
                prompt: 'Apply Constitutional AI validation',
                label: '⚖️ Constitutional Validate',
                command: 'oneagent.constitutionalValidate'
            },
            {
                prompt: 'Search project memory context',
                label: '🧠 Memory Search',
                command: 'oneagent.memorySearch'
            },
            {
                prompt: 'Open OneAgent dashboard',
                label: '📊 Dashboard',
                command: 'oneagent.openDashboard'
            }
        ];
    }
    
    private getQualityEmoji(score: number): string {
        if (score >= 90) return '🌟';      // Excellent
        if (score >= 80) return '✅';      // Good
        if (score >= 70) return '⚠️';     // Acceptable
        if (score >= 60) return '⚡';      // Needs improvement
        return '❌';                       // Poor
    }
    
    private getQualityGrade(score: number): string {
        if (score >= 90) return 'A';
        if (score >= 80) return 'B';
        if (score >= 70) return 'C';
        if (score >= 60) return 'D';
        return 'F';
    }
}
