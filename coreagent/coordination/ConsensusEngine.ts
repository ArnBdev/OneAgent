/**
 * ConsensusEngine - Democratic Decision-Making System for Multi-Agent Coordination
 * 
 * Phase 3 Implementation: OneAgent v5.0.0 Enhanced Multi-Agent Coordination
 * 
 * Core Capabilities:
 * - Democratic consensus building through semantic analysis
 * - Agreement pattern detection and conflict resolution
 * - Compromise synthesis using Constitutional AI
 * - Weighted expertise voting mechanisms
 * - Real-time consensus monitoring and facilitation
 * 
 * Business Value:
 * - 90% consensus building success rate target
 * - Democratic decisio    c    co    const allWords = views.map(v => v.position.toLowerCase().split(/\s+/));
    const commonWords = allWords[0].filter((word: string) =>
      allWords.every(words => words.includes(word))
    );
    
    return commonWords.filter((word: string) => word.length > 3); // Filter out short wordslWords = views.map(v => v.position.toLowerCase().split(/\s+/));
    const commonWords = allWords[0].filter((word: string) =>
      allWords.every(words => words.includes(word))
    );
    
    return commonWords.filter((word: string) => word.length > 3); // Filter out short wordsllWords = views.map(v => v.position.toLowerCase().split(/\s+/));
    const commonWords = allWords[0].filter((word: string) =>
      allWords.every(words => words.includes(word))
    );
    
    return commonWords.filter((word: string) => word.length > 3); // Filter out short wordsng for complex business scenarios
 * - Conflict resolution with Constitutional AI validation
 * - Transparent and auditable decision processes
 * 
 * Quality Standards:
 * - Constitutional AI compliance for all decisions
 * - Semantic analysis accuracy > 85%
 * - Compromise solution acceptance rate > 80%
 * - Real-time performance < 200ms per analysis
 * 
 * Version: 5.0.0
 * Created: 2025-08-04
 * Phase: 3 - Enhanced Multi-Agent Coordination
 */

import {
  AgentId,
  NLACSDiscussion,
  NLACSMessage,
  ConsensusResult,
  AgreementAnalysis,
  ConflictPoint,
  ViewPoint,
  ConsensusOpportunity,
  CompromiseSolution,
} from '../types/oneagent-backbone-types';
import { OneAgentMemory } from '../memory/OneAgentMemory';
import { createUnifiedId, unifiedMetadataService } from '../utils/UnifiedBackboneService';

export class ConsensusEngine {
  private memory: OneAgentMemory;

  constructor() {
    this.memory = OneAgentMemory.getInstance();
    console.log('🤝 ConsensusEngine initialized with democratic decision-making algorithms');
  }

  /**
   * Build consensus among participants using democratic decision-making
   * Core method for Phase 3 enhanced coordination
   */
  async buildConsensus(
    participants: AgentId[],
    proposal: string,
    discussionContext: NLACSDiscussion,
  ): Promise<ConsensusResult> {
    console.log(`🤝 Building consensus for proposal: ${proposal.substring(0, 50)}...`);

    // Analyze existing discussion for agreement patterns
    const agreementAnalysis = await this.detectAgreementPatterns(discussionContext.messages);
    console.log(
      `📊 Agreement analysis: ${(agreementAnalysis.overallAgreement * 100).toFixed(1)}% overall agreement`,
    );

    // Extract individual viewpoints from discussion
    const viewPoints = await this.extractViewPoints(discussionContext.messages, participants);

    // Detect conflicts between viewpoints
    // const conflicts = await this.detectConflicts(viewPoints); // Unused but available for future enhancement

    // Calculate consensus level
    const consensusLevel = this.calculateConsensusLevel(viewPoints, proposal);

    // If consensus is low, attempt to synthesize compromise
    let compromiseSolutions: CompromiseSolution[] = [];
    if (consensusLevel < 0.7) {
      const conflictingViews = viewPoints.filter((vp) => vp.confidence > 0.6);
      compromiseSolutions = await this.synthesizeCompromise(conflictingViews);
    }

    // Build final consensus result
    const consensusResult: ConsensusResult = {
      agreed: consensusLevel >= 0.7,
      consensusLevel,
      supportingAgents: viewPoints
        .filter((vp) => this.supportsProposal(vp, proposal))
        .map((vp) => vp.agentId),
      objectingAgents: viewPoints
        .filter((vp) => this.objectsToProposal(vp, proposal))
        .map((vp) => vp.agentId),
      neutralAgents: viewPoints
        .filter((vp) => this.isNeutral(vp, proposal))
        .map((vp) => vp.agentId),
      finalDecision: await this.synthesizeFinalDecision(proposal, viewPoints, compromiseSolutions),
      compromisesReached: compromiseSolutions.map((solution) => solution.description),
      timeToConsensus: 0, // Placeholder - will calculate properly
      qualityScore: 0.8, // Placeholder - simplified quality calculation
      constitutionallyValidated: false, // Will be set during validation
      metadata: {
        discussionSummary: `Democratic consensus building on: ${proposal}`,
        keyArguments: { for: [], against: [], neutral: [] },
        breakthroughMoments: [],
        synthesizedInsights: [],
      },
    };

    // Validate consensus using Constitutional AI
    const validation = await this.validateConsensus(consensusResult);
    consensusResult.constitutionallyValidated = validation.valid;
    if (!validation.valid) {
      console.warn('⚠️ Consensus validation issues:', validation.issues);
    }

    // Store consensus result in canonical memory system
    try {
      const metadata = unifiedMetadataService.create('consensus_result', 'ConsensusEngine', {
        system: {
          source: 'consensus_building',
          component: 'ConsensusEngine',
          userId: 'system_consensus',
        },
        content: {
          category: 'democratic_decision',
          tags: ['consensus', 'democracy', 'decision-making'],
          sensitivity: 'internal',
          relevanceScore: consensusLevel,
          contextDependency: 'session',
        },
      });
      interface ConsensusMetadataExtension {
        consensusData?: ConsensusResult;
      }
      (metadata as ConsensusMetadataExtension).consensusData = consensusResult; // attach domain-specific payload
      await this.memory.addMemoryCanonical(
        `Consensus Result: ${consensusResult.agreed ? 'AGREEMENT' : 'NO CONSENSUS'} - ${proposal}`,
        metadata,
        'system_consensus',
      );
    } catch (memErr) {
      console.warn('ConsensusEngine memory store failed:', memErr);
    }

    console.log(
      `🤝 Consensus building complete: ${consensusResult.agreed ? 'AGREEMENT' : 'NO CONSENSUS'} (${(consensusLevel * 100).toFixed(1)}%)`,
    );
    return consensusResult;
  }

  /**
   * Detect agreement patterns in discussion messages using semantic analysis
   */
  private async detectAgreementPatterns(messages: NLACSMessage[]): Promise<AgreementAnalysis> {
    console.log(`🔍 Analyzing agreement patterns in ${messages.length} messages`);

    if (messages.length === 0) {
      return {
        overallAgreement: 0.0,
        topicAgreementBreakdown: {},
        agentAgreementMatrix: {},
        conflictPoints: [],
        consensusOpportunities: [],
        compromiseSuggestions: [],
      };
    }

    // Calculate semantic similarity between messages
    const similarityMatrix = this.calculateMessageSimilarity(messages);
    const overallSimilarity = this.calculateOverallSimilarity(similarityMatrix);

    // Detect agreement clusters
    // const agreementClusters = this.identifyAgreementClusters(messages, similarityMatrix); // Available for future enhancement

    // Analyze sentiment alignment
    const sentimentAlignment = this.calculateSentimentAlignment(messages);

    // Find consensus opportunities
    // const consensusOpportunities = this.identifyConsensusOpportunities(agreementClusters); // Available for future enhancement

    const overallAgreement = (overallSimilarity + sentimentAlignment) / 2;

    console.log(
      `📊 Agreement analysis complete: ${(overallAgreement * 100).toFixed(1)}% agreement`,
    );

    return {
      overallAgreement,
      topicAgreementBreakdown: {},
      agentAgreementMatrix: {},
      conflictPoints: [],
      consensusOpportunities: [],
      compromiseSuggestions: [],
    };
  }

  /**
   * Detect conflicts and their underlying causes
   */
  private async detectConflicts(viewPoints: ViewPoint[]): Promise<ConflictPoint[]> {
    console.log(`⚡ Detecting conflicts among ${viewPoints.length} viewpoints`);

    const conflicts: ConflictPoint[] = [];

    // Compare each pair of viewpoints for conflicts
    for (let i = 0; i < viewPoints.length; i++) {
      for (let j = i + 1; j < viewPoints.length; j++) {
        const viewA = viewPoints[i];
        const viewB = viewPoints[j];

        // Calculate semantic opposition
        const opposition = this.calculateSemanticOpposition(viewA.position, viewB.position);

        if (opposition > 0.6) {
          // High opposition threshold
          const conflict: ConflictPoint = {
            id: createUnifiedId('system', `${viewA.agentId}-${viewB.agentId}`),
            topic: 'Conflict Resolution',
            conflictingViews: [viewA, viewB],
            severity: opposition > 0.8 ? 'critical' : opposition > 0.6 ? 'major' : 'moderate',
            resolutionStrategies: ['Find common ground', 'Seek compromise'],
            affectedAgents: [viewA.agentId, viewB.agentId],
          };

          conflicts.push(conflict);
          console.log(
            `⚡ Conflict detected: ${viewA.agentId} vs ${viewB.agentId} (severity: ${(opposition * 100).toFixed(1)}%)`,
          );
        }
      }
    }

    console.log(`⚡ Conflict detection complete: ${conflicts.length} conflicts found`);
    return conflicts;
  }

  /**
   * Synthesize compromise solutions for conflicting viewpoints
   */
  async synthesizeCompromise(conflictingViews: ViewPoint[]): Promise<CompromiseSolution[]> {
    console.log(
      `🤝 Synthesizing compromises for ${conflictingViews.length} conflicting viewpoints`,
    );

    const compromises: CompromiseSolution[] = [];

    // Group viewpoints by topic/issue
    const topicGroups = this.groupViewPointsByTopic(conflictingViews);

    for (const [topic, views] of Object.entries(topicGroups)) {
      if (views.length >= 2) {
        const compromise = await this.createCompromiseForTopic(topic, views);
        if (compromise && (await this.validateCompromiseConstitutionally(compromise))) {
          compromises.push(compromise);
        }
      }
    }

    // Rank compromises by acceptance score
    compromises.sort((a, b) => b.acceptanceScore - a.acceptanceScore);

    console.log(`✅ Generated ${compromises.length} validated compromise solutions`);
    return compromises;
  }

  /**
   * Validate consensus results using Constitutional AI principles
   */
  private async validateConsensus(
    consensusResult: ConsensusResult,
  ): Promise<{ valid: boolean; issues: string[]; recommendations: string[] }> {
    console.log(`✅ Validating consensus result using Constitutional AI`);

    const issues: string[] = [];
    const recommendations: string[] = [];

    // Validate democratic participation
    const totalParticipants =
      consensusResult.supportingAgents.length +
      consensusResult.objectingAgents.length +
      consensusResult.neutralAgents.length;

    if (totalParticipants === 0) {
      issues.push('No participant data available for validation');
      return { valid: false, issues, recommendations };
    }

    // Check for minority suppression
    const minorityRatio =
      Math.min(consensusResult.supportingAgents.length, consensusResult.objectingAgents.length) /
      totalParticipants;

    if (minorityRatio < 0.1 && consensusResult.objectingAgents.length > 0) {
      issues.push('Potential minority viewpoint suppression detected');
      recommendations.push('Consider implementing stronger minority protection mechanisms');
    }

    // Validate consensus quality
    if (consensusResult.consensusLevel < 0.5) {
      issues.push('Consensus level below recommended threshold');
      recommendations.push('Consider additional facilitation or compromise-building');
    }

    // Check transparency
    if (!consensusResult.metadata?.discussionSummary) {
      issues.push('Insufficient transparency in decision reasoning');
      recommendations.push('Add detailed reasoning metadata for audit trail');
    }

    const isValid = issues.length === 0;
    console.log(
      `✅ Consensus validation complete: ${isValid ? 'VALID' : 'NEEDS IMPROVEMENT'} (${issues.length} issues)`,
    );

    return {
      valid: isValid,
      issues,
      recommendations,
    };
  }

  // Supporting Methods Implementation

  private async extractViewPoints(
    messages: NLACSMessage[],
    participants: AgentId[],
  ): Promise<ViewPoint[]> {
    const viewPoints: ViewPoint[] = [];

    participants.forEach((agentId) => {
      const agentMessages = messages.filter((msg) => msg.agentId === agentId);
      if (agentMessages.length > 0) {
        const combinedContent = agentMessages.map((msg) => msg.content).join(' ');
        viewPoints.push({
          agentId,
          position: combinedContent,
          reasoning: [`Based on ${agentMessages.length} messages`],
          evidence: this.extractEvidence(agentMessages),
          confidence: this.calculateViewPointConfidence(agentMessages),
          flexibility: 0.6, // Default flexibility
        });
      }
    });

    return viewPoints;
  }

  private calculateConsensusLevel(viewPoints: ViewPoint[], proposal: string): number {
    if (viewPoints.length === 0) return 0;

    const supporters = viewPoints.filter((vp) => this.supportsProposal(vp, proposal));
    return supporters.length / viewPoints.length;
  }

  private supportsProposal(viewPoint: ViewPoint, proposal: string): boolean {
    return this.calculateSemanticSimilarity(viewPoint.position, proposal) > 0.6;
  }

  private objectsToProposal(viewPoint: ViewPoint, proposal: string): boolean {
    return this.calculateSemanticOpposition(viewPoint.position, proposal) > 0.6;
  }

  private isNeutral(viewPoint: ViewPoint, proposal: string): boolean {
    const similarity = this.calculateSemanticSimilarity(viewPoint.position, proposal);
    const opposition = this.calculateSemanticOpposition(viewPoint.position, proposal);
    return similarity < 0.6 && opposition < 0.6;
  }

  private calculateSemanticSimilarity(text1: string, text2: string): number {
    // Simplified semantic similarity - could use embeddings in production
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));

    const intersection = new Set(Array.from(words1).filter((word) => words2.has(word)));
    const union = new Set([...Array.from(words1), ...Array.from(words2)]);

    return union.size > 0 ? intersection.size / union.size : 0;
  }

  private calculateSemanticOpposition(text1: string, text2: string): number {
    // Detect opposing keywords and sentiments
    const oppositionWords = ['not', 'no', 'disagree', 'oppose', 'against', 'wrong', 'reject'];
    const text1Lower = text1.toLowerCase();
    const text2Lower = text2.toLowerCase();

    const hasOpposition = oppositionWords.some(
      (word) => text1Lower.includes(word) || text2Lower.includes(word),
    );

    if (!hasOpposition) return 0;

    // Calculate inverse similarity as opposition measure
    const similarity = this.calculateSemanticSimilarity(text1, text2);
    return Math.max(0, 1 - similarity);
  }

  private calculateMessageSimilarity(messages: NLACSMessage[]): number[][] {
    const matrix: number[][] = [];

    for (let i = 0; i < messages.length; i++) {
      matrix[i] = [];
      for (let j = 0; j < messages.length; j++) {
        if (i === j) {
          matrix[i][j] = 1.0;
        } else {
          matrix[i][j] = this.calculateSemanticSimilarity(messages[i].content, messages[j].content);
        }
      }
    }

    return matrix;
  }

  private calculateOverallSimilarity(similarityMatrix: number[][]): number {
    if (similarityMatrix.length === 0) return 0;

    let sum = 0;
    let count = 0;

    for (let i = 0; i < similarityMatrix.length; i++) {
      for (let j = i + 1; j < similarityMatrix[i].length; j++) {
        sum += similarityMatrix[i][j];
        count++;
      }
    }

    return count > 0 ? sum / count : 0;
  }

  private identifyAgreementClusters(
    messages: NLACSMessage[],
    similarityMatrix: number[][],
  ): NLACSMessage[][] {
    // Simplified clustering - could use more sophisticated algorithms
    const clusters = [];
    const threshold = 0.7;

    for (let i = 0; i < messages.length; i++) {
      const cluster = [messages[i]];
      for (let j = i + 1; j < messages.length; j++) {
        if (similarityMatrix[i][j] > threshold) {
          cluster.push(messages[j]);
        }
      }
      if (cluster.length > 1) {
        clusters.push(cluster);
      }
    }

    return clusters;
  }

  private calculateSentimentAlignment(messages: NLACSMessage[]): number {
    // Simplified sentiment analysis
    const positiveWords = ['good', 'great', 'excellent', 'agree', 'support', 'yes'];
    const negativeWords = ['bad', 'terrible', 'disagree', 'oppose', 'no', 'wrong'];

    let positiveCount = 0;
    let negativeCount = 0;

    messages.forEach((msg) => {
      const content = msg.content.toLowerCase();
      positiveWords.forEach((word) => {
        if (content.includes(word)) positiveCount++;
      });
      negativeWords.forEach((word) => {
        if (content.includes(word)) negativeCount++;
      });
    });

    const total = positiveCount + negativeCount;
    return total > 0 ? Math.abs(positiveCount - negativeCount) / total : 0.5;
  }

  private identifyConsensusOpportunities(
    agreementClusters: NLACSMessage[][],
  ): ConsensusOpportunity[] {
    return agreementClusters.map((cluster, index) => ({
      id: createUnifiedId('system', `cluster-${index}`),
      topic: `Agreement cluster ${index + 1}`,
      agreementLevel: 0.8, // Simplified calculation
      requiredActions: [
        `Build on shared understanding from ${cluster.length} aligned participants`,
      ],
      timeframe: 'short-term',
      likelihood: 0.8,
    }));
  }

  private calculateViewPointConfidence(messages: NLACSMessage[]): number {
    // Calculate confidence based on message length and evidence keywords
    const evidenceWords = ['because', 'data', 'research', 'evidence', 'study', 'analysis'];
    let evidenceCount = 0;
    let totalWords = 0;

    messages.forEach((msg) => {
      const words = msg.content.split(/\s+/);
      totalWords += words.length;
      evidenceWords.forEach((word) => {
        if (msg.content.toLowerCase().includes(word)) evidenceCount++;
      });
    });

    const lengthFactor = Math.min(1.0, totalWords / 100); // Longer messages show more confidence
    const evidenceFactor = Math.min(1.0, evidenceCount / 5); // Evidence shows confidence

    return (lengthFactor + evidenceFactor) / 2;
  }

  private extractEvidence(messages: NLACSMessage[]): string[] {
    const evidence: string[] = [];
    const evidenceKeywords = ['because', 'data shows', 'research indicates', 'studies prove'];

    messages.forEach((msg) => {
      evidenceKeywords.forEach((keyword) => {
        if (msg.content.toLowerCase().includes(keyword)) {
          const sentences = msg.content.split('.');
          const evidenceSentence = sentences.find((s) => s.toLowerCase().includes(keyword));
          if (evidenceSentence) {
            evidence.push(evidenceSentence.trim());
          }
        }
      });
    });

    return evidence;
  }

  private async synthesizeFinalDecision(
    proposal: string,
    viewPoints: ViewPoint[],
    compromises: CompromiseSolution[],
  ): Promise<string> {
    if (compromises.length > 0) {
      const bestCompromise = compromises[0]; // Already sorted by acceptance score
      return `Modified proposal incorporating compromise: ${bestCompromise.description}`;
    } else {
      const supportingViews = viewPoints.filter((vp) => this.supportsProposal(vp, proposal));
      if (supportingViews.length > viewPoints.length / 2) {
        return `Original proposal accepted with ${supportingViews.length}/${viewPoints.length} support`;
      } else {
        return `Proposal requires further discussion - insufficient consensus`;
      }
    }
  }

  private groupViewPointsByTopic(viewPoints: ViewPoint[]): Record<string, ViewPoint[]> {
    // Simplified topic grouping - could use NLP topic modeling
    const groups: Record<string, ViewPoint[]> = {};

    viewPoints.forEach((vp) => {
      const topics = this.extractTopics(vp.position);
      topics.forEach((topic) => {
        if (!groups[topic]) groups[topic] = [];
        groups[topic].push(vp);
      });
    });

    return groups;
  }

  private extractTopics(content: string): string[] {
    // Simplified topic extraction
    const words = content.toLowerCase().split(/\s+/);
    const topics: string[] = [];

    // Look for business/technical keywords that indicate topics
    const topicKeywords = [
      'marketing',
      'sales',
      'product',
      'development',
      'strategy',
      'budget',
      'timeline',
    ];

    topicKeywords.forEach((keyword) => {
      if (words.includes(keyword)) {
        topics.push(keyword);
      }
    });

    return topics.length > 0 ? topics : ['general'];
  }

  private async createCompromiseForTopic(
    topic: string,
    views: ViewPoint[],
  ): Promise<CompromiseSolution | null> {
    if (views.length < 2) return null;

    // Extract common elements and differences
    const commonElements = this.findCommonElements(views);
    // const differences = this.findDifferences(views); // Available for future enhancement

    // Create compromise solution
    const compromise: CompromiseSolution = {
      id: createUnifiedId('system', topic),
      description: `Compromise solution for ${topic} incorporating ${views.length} viewpoints`,
      affectedParties: views.map((v) => v.agentId),
      tradeoffs: {},
      benefits: [],
      risks: [],
      implementationSteps: [],
      acceptanceScore: this.calculateCompromiseAcceptance(views, commonElements),
    };

    return compromise;
  }

  private findCommonElements(views: ViewPoint[]): string[] {
    const allWords = views.map((v) => v.position.toLowerCase().split(/\s+/));
    const commonWords = allWords[0].filter((word: string) =>
      allWords.every((wordList) => wordList.includes(word)),
    );

    return commonWords.filter((word: string) => word.length > 3); // Filter out short words
  }

  private findDifferences(views: ViewPoint[]): string[] {
    const differences: string[] = [];

    for (let i = 0; i < views.length; i++) {
      for (let j = i + 1; j < views.length; j++) {
        const wordsA = new Set(views[i].position.toLowerCase().split(/\s+/));
        const wordsB = new Set(views[j].position.toLowerCase().split(/\s+/));

        Array.from(wordsA).forEach((word) => {
          if (!wordsB.has(word) && (word as string).length > 3) {
            differences.push(`${views[i].agentId}: ${word}`);
          }
        });
      }
    }

    return differences;
  }

  private calculateCompromiseAcceptance(views: ViewPoint[], commonElements: string[]): number {
    // Calculate how well the compromise represents all viewpoints
    const totalElements = views.reduce((sum, view) => sum + view.position.split(/\s+/).length, 0);
    const commonElementCount = commonElements.length;

    return Math.min(1.0, (commonElementCount * views.length) / totalElements);
  }

  private createImplementationPlan(commonElements: string[]): string[] {
    return [
      `Phase 1: Implement agreed-upon elements: ${commonElements.slice(0, 3).join(', ')}`,
      `Phase 2: Review implementation effectiveness`,
      `Phase 3: Address remaining differences through iterative consensus`,
    ];
  }

  private async validateCompromiseConstitutionally(
    compromise: CompromiseSolution,
  ): Promise<boolean> {
    // Simplified Constitutional AI validation
    const ethicalKeywords = ['fair', 'transparent', 'inclusive', 'beneficial'];
    const harmfulKeywords = ['discriminate', 'exclude', 'harm', 'unfair'];

    const description = compromise.description.toLowerCase();

    const hasEthicalElements = ethicalKeywords.some((keyword) => description.includes(keyword));
    const hasHarmfulElements = harmfulKeywords.some((keyword) => description.includes(keyword));

    return hasEthicalElements && !hasHarmfulElements;
  }

  private categorizeConflict(viewA: ViewPoint, viewB: ViewPoint): string {
    // Simplified conflict categorization
    const businessKeywords = ['budget', 'cost', 'revenue', 'profit'];
    const technicalKeywords = ['technology', 'system', 'implementation', 'architecture'];
    const strategicKeywords = ['strategy', 'plan', 'goal', 'objective'];

    const contentA = viewA.position.toLowerCase();
    const contentB = viewB.position.toLowerCase();

    if (businessKeywords.some((k) => contentA.includes(k) || contentB.includes(k))) {
      return 'business';
    } else if (technicalKeywords.some((k) => contentA.includes(k) || contentB.includes(k))) {
      return 'technical';
    } else if (strategicKeywords.some((k) => contentA.includes(k) || contentB.includes(k))) {
      return 'strategic';
    } else {
      return 'general';
    }
  }

  private identifyUnderlyingIssues(viewA: ViewPoint, viewB: ViewPoint): string[] {
    // Simplified issue identification
    const issues: string[] = [];

    if (viewA.position.includes('cost') && viewB.position.includes('quality')) {
      issues.push('Cost vs Quality trade-off');
    }
    if (viewA.position.includes('fast') && viewB.position.includes('careful')) {
      issues.push('Speed vs Thoroughness tension');
    }
    if (viewA.position.includes('risk') && viewB.position.includes('opportunity')) {
      issues.push('Risk vs Opportunity balance');
    }

    return issues.length > 0 ? issues : ['Philosophical differences in approach'];
  }

  private assessResolutionDifficulty(viewA: ViewPoint, viewB: ViewPoint): number {
    // Calculate resolution difficulty based on confidence and opposition
    const avgConfidence = (viewA.confidence + viewB.confidence) / 2;
    const opposition = this.calculateSemanticOpposition(viewA.position, viewB.position);

    return Math.min(1.0, avgConfidence * opposition);
  }

  private suggestMediationApproach(viewA: ViewPoint, viewB: ViewPoint): string {
    const difficulty = this.assessResolutionDifficulty(viewA, viewB);

    if (difficulty > 0.8) {
      return 'Structured mediation with neutral facilitator required';
    } else if (difficulty > 0.5) {
      return 'Guided discussion with compromise exploration';
    } else {
      return 'Direct dialogue should resolve differences';
    }
  }
}
