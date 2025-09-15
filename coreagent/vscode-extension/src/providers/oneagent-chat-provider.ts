import * as vscode from 'vscode';
import { OneAgentClient, AIAssistantResponse } from '../connection/oneagent-client';
import { createUnifiedTimestamp } from '../utils/backbone';

// Canonical timestamp function using UnifiedBackboneService
const getCanonicalTimestamp = () => {
  return createUnifiedTimestamp().unix;
};

export class OneAgentChatProvider {
  constructor(private client: OneAgentClient) {}
  async handleRequest(
    request: vscode.ChatRequest,
    _context: vscode.ChatContext,
    response: vscode.ChatResponseStream,
    token: vscode.CancellationToken,
  ): Promise<void> {
    // Check if OneAgent is available
    const isAvailable = await this.client.healthCheck();
    if (!isAvailable) {
      response.markdown(
        '⚠️ **OneAgent server is not available**\n\nPlease ensure OneAgent is running (check .env for port configuration).\n\nYou can check the connection in OneAgent settings.',
      );
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
        qualityThreshold: config.qualityThreshold,
      });
      if (!aiResponse.success) {
        response.markdown(
          `❌ **Error**: ${aiResponse.error}\n\nPlease check OneAgent server status and try again.`,
        );
        return;
      }

      // Check for cancellation again
      if (token.isCancellationRequested) {
        return;
      }

      // Display response with quality indicator
      const aiData = (aiResponse.data || {}) as AIAssistantResponse;
      if (aiData.qualityScore !== undefined) {
        const qualityEmoji = this.getQualityEmoji(aiData.qualityScore);
        const grade = this.getQualityGrade(aiData.qualityScore);
        response.markdown(
          `${qualityEmoji} **Quality Score**: ${aiData.qualityScore}% (Grade: ${grade})\n\n`,
        );
      }

      // Display main content
      if (aiData.content) {
        response.markdown(aiData.content);
      } else if (aiData.response) {
        response.markdown(aiData.response);
      } else {
        response.markdown('Response received but content format was unexpected.');
      }

      // Add Constitutional AI compliance note
      if (config.enableConstitutionalAI && aiData.constitutionalCompliance) {
        response.markdown(
          '\n\n✅ **Constitutional AI Validated**: Response meets accuracy, transparency, helpfulness, and safety standards',
        );
      }

      // Enhanced Memory Storage with ALITA Integration
      try {
        const userId = vscode.env.machineId;
        const userMessage = request.prompt;
        const assistantResponse = aiData.content || aiData.response || '';
        // Store basic interaction with Memory Intelligence
        await this.client.memoryCreate({
          content: `User: ${userMessage}\nAssistant: ${assistantResponse}`,
          userId,
          memoryType: 'session',
          useIntelligence: true, // Enable intelligence for pattern recognition
        });

        // Store enhanced metadata for ALITA learning with Memory Intelligence
        await this.client.memoryCreate({
          content: JSON.stringify({
            type: 'copilot_chat_interaction',
            timestamp: createUnifiedTimestamp().iso,
            userMessage,
            assistantResponse,
            qualityScore: aiData.qualityScore,
            constitutionalCompliance: aiData.constitutionalCompliance,
            context: {
              activeFile: vscode.window.activeTextEditor?.document.fileName,
              workspaceFolder: vscode.workspace.workspaceFolders?.[0]?.name,
              language: vscode.window.activeTextEditor?.document.languageId,
            },
            userBehavior: {
              responseTime: getCanonicalTimestamp(), // TODO: Replace with actual timing from UnifiedBackboneService
              followupUsed: false, // Will be updated if user uses followups
            },
          }),
          userId,
          memoryType: 'long_term',
          useIntelligence: true, // Enable intelligence for enhanced metadata analysis
        });

        // Trigger ALITA Auto-Evolution if configured
        const evolutionConfig = vscode.workspace.getConfiguration('oneagent');
        if (evolutionConfig.get('autoEvolution', false)) {
          this.triggerALITAEvolution(userMessage, assistantResponse, aiData);
        }

        // Auto-sync to settings.json if enabled
        if (evolutionConfig.get('autoSyncSettings', true)) {
          this.syncToSettingsJson(userMessage, assistantResponse, aiData);
        }
      } catch (error) {
        // Silent fail for memory storage - not critical
        console.warn('Failed to store enhanced interaction in memory:', error);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      response.markdown(
        `❌ **Unexpected error**: ${errorMessage}\n\nPlease check OneAgent server connection and try again.`,
      );
      console.error('OneAgent chat error:', error);
    }
  }
  async provideFollowups(
    _result: vscode.ChatResult,
    _context: vscode.ChatContext,
    _token: vscode.CancellationToken,
  ): Promise<vscode.ChatFollowup[]> {
    // Check if OneAgent is available before providing followups
    const isAvailable = await this.client.healthCheck();
    if (!isAvailable) {
      return [
        {
          prompt: 'Check OneAgent connection',
          label: '🔌 Check Connection',
        },
      ];
    }
    return [
      {
        prompt: 'Analyze this with BMAD framework',
        label: '🔍 BMAD Analysis',
        command: 'oneagent.bmadAnalyze',
      },
      {
        prompt: 'Check code quality score',
        label: '📊 Quality Score',
        command: 'oneagent.qualityScore',
      },
      {
        prompt: 'Apply Constitutional AI validation',
        label: '⚖️ Constitutional Validate',
        command: 'oneagent.constitutionalValidate',
      },
      {
        prompt: 'Search project memory context',
        label: '🧠 Memory Search',
        command: 'oneagent.memorySearch',
      },
      {
        prompt: 'Perform semantic analysis on selection',
        label: '🧬 Semantic Analysis',
        command: 'oneagent.semanticAnalysis',
      },
      {
        prompt: 'Search web with quality filtering',
        label: '🔍 Enhanced Search',
        command: 'oneagent.enhancedSearch',
      },
      {
        prompt: 'View evolution analytics',
        label: '📈 Evolution Analytics',
        command: 'oneagent.evolutionAnalytics',
      },
      {
        prompt: 'Check agent network health',
        label: '🕸️ Network Health',
        command: 'oneagent.agentNetworkHealth',
      },
      {
        prompt: 'Open OneAgent dashboard',
        label: '📊 Dashboard',
        command: 'oneagent.openDashboard',
      },
    ];
  }

  private getQualityEmoji(score: number): string {
    if (score >= 90) return '🌟'; // Excellent
    if (score >= 80) return '✅'; // Good
    if (score >= 70) return '⚠️'; // Acceptable
    if (score >= 60) return '⚡'; // Needs improvement
    return '❌'; // Poor
  }

  private getQualityGrade(score: number): string {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  // ALITA Auto-Evolution Integration
  private async triggerALITAEvolution(
    userMessage: string,
    assistantResponse: string,
    responseData: AIAssistantResponse,
  ): Promise<void> {
    try {
      // Analyze conversation patterns for evolution triggers
      const shouldEvolve = await this.shouldTriggerEvolution(
        userMessage,
        assistantResponse,
        responseData,
      );

      if (shouldEvolve) {
        console.log('🧬 ALITA Auto-Evolution triggered by conversation pattern');

        // Trigger evolution with conversation context
        const evolutionResult = await this.client.evolveProfile(
          'conversation_analysis',
          'moderate',
        );

        if (evolutionResult.success) {
          // Notify user of evolution
          vscode.window
            .showInformationMessage(
              '🧬 OneAgent evolved based on your conversation patterns!',
              'View Changes',
            )
            .then((selection) => {
              if (selection === 'View Changes') {
                vscode.commands.executeCommand('oneagent.evolutionAnalytics');
              }
            });
        }
      }
    } catch (error) {
      console.warn('ALITA auto-evolution failed:', error);
    }
  }

  private async shouldTriggerEvolution(
    userMessage: string,
    assistantResponse: string,
    responseData: AIAssistantResponse,
  ): Promise<boolean> {
    // Evolution triggers based on conversation analysis
    const triggers = [
      (responseData.qualityScore ?? 100) < 70, // Low quality response
      userMessage.toLowerCase().includes('improve') || userMessage.toLowerCase().includes('better'),
      userMessage.toLowerCase().includes('error') || userMessage.toLowerCase().includes('wrong'),
      assistantResponse.length < 50, // Very short responses might indicate inadequacy
      responseData.constitutionalCompliance === false,
    ];

    // Trigger if any condition is met and it's been some time since last evolution
    return triggers.some((trigger) => trigger);
  }

  // Settings.json Auto-Sync Integration
  private async syncToSettingsJson(
    userMessage: string,
    assistantResponse: string,
    responseData: AIAssistantResponse,
  ): Promise<void> {
    try {
      // Extract learnable preferences from conversation
      const preferences = this.extractUserPreferences(userMessage, assistantResponse, responseData);

      if (preferences && Object.keys(preferences).length > 0) {
        // Update VS Code settings with learned preferences
        const config = vscode.workspace.getConfiguration('oneagent');

        for (const [key, value] of Object.entries(preferences)) {
          await config.update(key, value, vscode.ConfigurationTarget.Global);
        }

        console.log('📝 Auto-synced preferences to settings.json:', preferences);

        // Optionally notify user
        const showNotification = config.get('showAutoSyncNotifications', false);
        if (showNotification) {
          vscode.window.showInformationMessage(
            `📝 OneAgent learned your preferences and updated settings.json`,
          );
        }
      }
    } catch (error) {
      console.warn('Settings.json auto-sync failed:', error);
    }
  }

  private extractUserPreferences(
    userMessage: string,
    _assistantResponse: string,
    responseData: AIAssistantResponse,
  ): Record<string, unknown> {
    const preferences: Record<string, unknown> = {};
    const message = userMessage.toLowerCase();

    // Quality threshold learning
    if (responseData?.qualityScore) {
      if (
        message.includes('good') ||
        message.includes('excellent') ||
        message.includes('perfect')
      ) {
        if ((responseData.qualityScore ?? 0) < 90) {
          preferences['qualityThreshold'] = Math.min((responseData.qualityScore ?? 0) + 5, 95);
        }
      } else if (message.includes('bad') || message.includes('poor') || message.includes('wrong')) {
        if ((responseData.qualityScore ?? 0) > 70) {
          preferences['qualityThreshold'] = Math.max((responseData.qualityScore ?? 0) + 10, 85);
        }
      }
    }

    // Constitutional AI preference learning
    if (
      message.includes('be more careful') ||
      message.includes('safety') ||
      message.includes('validate')
    ) {
      preferences['enableConstitutionalAI'] = true;
    }

    // Memory retention learning
    if (
      message.includes('remember') ||
      message.includes('context') ||
      message.includes('previous')
    ) {
      preferences['memoryRetention'] = 'long_term';
    } else if (
      message.includes('forget') ||
      message.includes('clear') ||
      message.includes('reset')
    ) {
      preferences['memoryRetention'] = 'session';
    }

    // Evolution preferences
    if (message.includes('improve') || message.includes('evolve') || message.includes('learn')) {
      preferences['autoEvolution'] = true;
    } else if (message.includes('stop learning') || message.includes('no changes')) {
      preferences['autoEvolution'] = false;
    }

    return preferences;
  }
}
