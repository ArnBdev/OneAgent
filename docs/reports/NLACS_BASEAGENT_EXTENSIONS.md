/\*\*

- NLACS Phase 1 BaseAgent Extensions Restoration
-
- This file contains the Phase 1 NLACS extensions that need to be
- added back to BaseAgent after the git revert.
  \*/

// Add these methods to BaseAgent class:

/\*\*

- NLACS Phase 1 Extensions for BaseAgent
-
- Add these methods inside the BaseAgent class definition
  \*/

/\*
// =============================================================================
// NLACS (Natural Language Agent Coordination System) Extensions - Phase 1
// =============================================================================

protected nlacsCapabilities: NLACSCapability[] = [];
protected nlacsEnabled: boolean = false;

/\*\*

- Enable NLACS capabilities for this agent
  \*/
  protected enableNLACS(capabilities: NLACSCapability[]): void {
  this.nlacsCapabilities = capabilities;
  this.nlacsEnabled = true;
  console.log(`🧠 NLACS enabled for ${this.config.id} with capabilities: ${capabilities.join(', ')}`);
  }

/\*\*

- Join a natural language discussion
  \*/
  protected async joinDiscussion(discussionId: string, \_context?: string): Promise<boolean> {
  if (!this.nlacsEnabled) {
  console.warn(`⚠️ NLACS not enabled for ${this.config.id}`);
  return false;
  }

  try {
  // In a real implementation, this would connect to NLACSCoordinator
  console.log(`💬 ${this.config.id} joining discussion: ${discussionId}`);

      // Store participation in memory
      if (this.memoryClient) {
        await this.memoryClient.addMemory({
          content: `Joined NLACS discussion: ${discussionId}`,
          metadata: {
            type: 'nlacs_participation',
            discussionId,
            agentId: this.config.id,
            timestamp: new Date().toISOString()
          }
        });
      }

      return true;

  } catch (error) {
  console.error(`❌ Error joining discussion ${discussionId}:`, error);
  return false;
  }

}

/\*\*

- Contribute to a natural language discussion
  \*/
  protected async contributeToDiscussion(
  discussionId: string,
  content: string,
  messageType: 'question' | 'contribution' | 'synthesis' | 'insight' | 'consensus' = 'contribution',
  context?: string
  ): Promise<NLACSMessage | null> {
  if (!this.nlacsEnabled) {
  console.warn(`⚠️ NLACS not enabled for ${this.config.id}`);
  return null;
  }

  try {
  const message: NLACSMessage = {
  id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  discussionId,
  agentId: this.config.id,
  content,
  messageType,
  timestamp: new Date(),
  metadata: {
  context: context || 'standard_contribution',
  agentCapabilities: this.nlacsCapabilities
  }
  };

      // Store in memory for cross-conversation learning
      if (this.memoryClient) {
        await this.memoryClient.addMemory({
          content: `NLACS Discussion Contribution: ${content}`,
          metadata: {
            type: 'nlacs_contribution',
            discussionId,
            messageType,
            agentId: this.config.id,
            timestamp: message.timestamp.toISOString()
          }
        });
      }

      console.log(`💬 ${this.config.id} contributed to discussion ${discussionId}: ${messageType}`);
      return message;

  } catch (error) {
  console.error(`❌ Error contributing to discussion ${discussionId}:`, error);
  return null;
  }

}

/\*\*

- Generate emergent insights from conversation patterns
  \*/
  protected async generateEmergentInsights(
  conversationHistory: NLACSMessage[],
  context?: string
  ): Promise<EmergentInsight[]> {
  if (!this.nlacsEnabled) {
  console.warn(`⚠️ NLACS not enabled for ${this.config.id}`);
  return [];
  }

  try {
  const insights: EmergentInsight[] = [];

      // Analyze conversation patterns
      const messageTypes = conversationHistory.map(m => m.messageType);
      const participants = new Set(conversationHistory.map(m => m.agentId));

      // Simple pattern-based insight generation
      if (messageTypes.includes('question') && messageTypes.includes('contribution')) {
        insights.push({
          id: `insight_${Date.now()}`,
          type: 'pattern',
          content: `Effective Q&A pattern observed with ${participants.size} participants`,
          confidence: 0.75,
          sources: conversationHistory.slice(0, 3).map(m => m.id),
          discoveredAt: new Date(),
          contributingAgents: Array.from(participants)
        });
      }

      if (messageTypes.includes('synthesis')) {
        insights.push({
          id: `insight_${Date.now() + 1}`,
          type: 'synthesis',
          content: `Knowledge synthesis achieved through collaborative discussion`,
          confidence: 0.82,
          sources: conversationHistory.filter(m => m.messageType === 'synthesis').map(m => m.id),
          discoveredAt: new Date(),
          contributingAgents: Array.from(participants)
        });
      }

      // Store insights in memory
      for (const insight of insights) {
        if (this.memoryClient) {
          await this.memoryClient.addMemory({
            content: `Emergent Insight: ${insight.content}`,
            metadata: {
              type: 'emergent_insight',
              insightType: insight.type,
              confidence: insight.confidence,
              agentId: this.config.id,
              context: context || 'conversation_analysis',
              timestamp: insight.discoveredAt.toISOString()
            }
          });
        }
      }

      console.log(`🧠 ${this.config.id} generated ${insights.length} emergent insights`);
      return insights;

  } catch (error) {
  console.error(`❌ Error generating emergent insights:`, error);
  return [];
  }

}

/\*\*

- Synthesize knowledge from multiple conversations
  \*/
  protected async synthesizeKnowledge(
  conversationThreads: ConversationThread[],
  synthesisQuestion: string
  ): Promise<string | null> {
  if (!this.nlacsEnabled) {
  console.warn(`⚠️ NLACS not enabled for ${this.config.id}`);
  return null;
  }

  try {
  // Extract key insights from conversation threads
  const allInsights = conversationThreads.flatMap(thread =>
  thread.emergentInsights || []
  );

      if (allInsights.length === 0) {
        console.warn(`⚠️ No insights available for synthesis`);
        return null;
      }

      // Simple synthesis using AI
      const synthesisPrompt = `
        Based on the following insights from multiple conversations, please provide a comprehensive synthesis addressing: "${synthesisQuestion}"

        Insights:
        ${allInsights.map((insight, idx) => `${idx + 1}. ${insight.content} (confidence: ${insight.confidence})`).join('\n')}

        Please provide a thoughtful synthesis that connects these insights and addresses the question.
      `;

      const synthesisResult = await this.aiClient?.generateContent(synthesisPrompt);
      const synthesis = synthesisResult || `Synthesis based on ${allInsights.length} insights from ${conversationThreads.length} conversations`;

      // Store synthesis in memory
      if (this.memoryClient) {
        await this.memoryClient.addMemory({
          content: `Knowledge Synthesis: ${synthesis}`,
          metadata: {
            type: 'knowledge_synthesis',
            synthesisQuestion,
            sourceThreads: conversationThreads.map(t => t.id),
            insightCount: allInsights.length,
            agentId: this.config.id,
            timestamp: new Date().toISOString()
          }
        });
      }

      console.log(`🔄 ${this.config.id} synthesized knowledge from ${conversationThreads.length} conversations`);
      return synthesis;

  } catch (error) {
  console.error(`❌ Error synthesizing knowledge:`, error);
  return null;
  }

}

/\*\*

- Extract conversation patterns for learning
  \*/
  protected async extractConversationPatterns(
  conversationHistory: NLACSMessage[]
  ): Promise<{ patterns: string[]; insights: string[] }> {
  try {
  const patterns: string[] = [];
  const insights: string[] = [];

        // Analyze message flow patterns
        const messageTypes = conversationHistory.map(m => m.messageType);
        const messageFlow = messageTypes.join(' → ');

        patterns.push(`Message flow: ${messageFlow}`);

        // Identify effective patterns
        if (messageFlow.includes('question → contribution → synthesis')) {
          insights.push('Effective Q→C→S pattern leads to synthesis');
        }

        if (messageFlow.includes('insight')) {
          insights.push('Insight generation indicates deep thinking');
        }

        // Analyze participation patterns
        const participants = new Set(conversationHistory.map(m => m.agentId));
        patterns.push(`Participant count: ${participants.size}`);

        if (participants.size > 2) {
          insights.push('Multi-agent collaboration enhances discussion quality');
        }

        // Analyze conversation memory patterns
        const nlacsMemories = await this.memoryClient?.searchMemory({
          query: 'nlacs_contribution',
          userId: this.config.id,
          limit: 10
        });

        // Analyze patterns in discussion history
        if (nlacsMemories?.results && nlacsMemories.results.length > 0) {
          patterns.push(`Participated in ${nlacsMemories.results.length} previous discussions`);

          // Extract common themes
          const themes = new Set<string>();
          nlacsMemories.results.forEach((memory: any) => {
            if (memory.metadata?.messageType) {
              themes.add(memory.metadata.messageType);
            }
          });

          if (themes.size > 0) {
            patterns.push(`Common contribution types: ${Array.from(themes).join(', ')}`);
          }
        }

        console.log(`📊 ${this.config.id} extracted ${patterns.length} conversation patterns`);
        return { patterns, insights };
      } catch (error) {
        console.error(`❌ Error extracting conversation patterns:`, error);
        return { patterns: [], insights: [] };
      }

  }
  \*/
