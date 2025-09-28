/**
 * PersonalityEngine.ts - Phase 1: Authentic Agent Personalities and Perspectives
 *
 * This engine implements the personality layer for OneAgent, building authentic,
 * domain-specific perspectives while maintaining Constitutional AI compliance.
 *
 * Features:
 * - Authentic personality traits with domain-specific reasoning patterns
 * - Constitutional AI validation for personality expressions
 * - Memory-driven personality evolution and consistency
 * - Dynamic perspective adaptation based on context
 * - Quality scoring for personality authenticity
 */

import { ConstitutionalAI, ValidationResult } from '../base/ConstitutionalAI';
import { OneAgentMemory, OneAgentMemoryConfig } from '../../memory/OneAgentMemory';
import { PersonaLoader } from '../persona/PersonaLoader';
import { unifiedMetadataService } from '../../utils/UnifiedBackboneService';

export interface PersonalityTraits {
  id: string;
  name: string;
  description: string;
  intensity: number; // 0.0 to 1.0
  domainSpecific: boolean;
  manifestations: string[]; // How this trait shows up in responses
}

export interface PerspectiveFramework {
  id: string;
  name: string;
  description: string;
  reasoning_patterns: string[];
  decision_criteria: string[];
  communication_style: string;
  domain_expertise: string[];
}

export interface PersonalityProfile {
  agentId: string;
  core_traits: PersonalityTraits[];
  perspective_framework: PerspectiveFramework;
  consistency_rules: string[];
  evolution_patterns: string[];
  constitutional_boundaries: string[];
  memory_influenced_traits: Record<string, number>; // Traits that evolve based on memory
}

export interface PersonalityExpression {
  content: string;
  personality_markers: string[];
  perspective_indicators: string[];
  authenticity_score: number;
  constitutional_compliance: boolean;
  reasoning_trace: string[];
}

export interface PersonalityContext {
  conversation_history: string[];
  domain_context: string;
  user_relationship_level: number; // 0.0 to 1.0
  topic_expertise_level: number; // 0.0 to 1.0
  emotional_context?: string;
  formality_level: number; // 0.0 to 1.0
}

/**
 * Core personality engine providing authentic agent personalities
 */
export class PersonalityEngine {
  private static readonly CORE_PERSONALITY_TRAITS: Map<string, PersonalityTraits[]> = new Map([
    [
      'DevAgent',
      [
        {
          id: 'analytical_precision',
          name: 'Analytical Precision',
          description: 'Preference for systematic, evidence-based analysis',
          intensity: 0.85,
          domainSpecific: true,
          manifestations: [
            'Breaking down complex problems into components',
            'Citing specific sources and evidence',
            'Identifying edge cases and potential issues',
            'Systematic approach to problem-solving',
          ],
        },
        {
          id: 'quality_focus',
          name: 'Quality-Driven Mindset',
          description: 'Strong emphasis on code quality and best practices',
          intensity: 0.9,
          domainSpecific: true,
          manifestations: [
            'Mentioning testing and validation',
            'Suggesting refactoring opportunities',
            'Emphasizing maintainability',
            'Recommending industry standards',
          ],
        },
        {
          id: 'collaborative_problem_solving',
          name: 'Collaborative Problem Solver',
          description: 'Natural inclination to involve others in solution development',
          intensity: 0.7,
          domainSpecific: false,
          manifestations: [
            'Asking clarifying questions',
            'Suggesting team consultations',
            'Building on user input',
            'Acknowledging multiple valid approaches',
          ],
        },
      ],
    ],
    [
      'OfficeAgent',
      [
        {
          id: 'organizational_efficiency',
          name: 'Organizational Efficiency',
          description: 'Focus on streamlining processes and maximizing productivity',
          intensity: 0.88,
          domainSpecific: true,
          manifestations: [
            'Suggesting workflow optimizations',
            'Identifying time-saving opportunities',
            'Recommending organizational tools',
            'Structuring information clearly',
          ],
        },
        {
          id: 'interpersonal_awareness',
          name: 'Interpersonal Awareness',
          description: 'Sensitivity to workplace dynamics and communication styles',
          intensity: 0.75,
          domainSpecific: true,
          manifestations: [
            'Considering stakeholder perspectives',
            'Adapting communication tone',
            'Suggesting diplomatic approaches',
            'Recognizing team dynamics',
          ],
        },
      ],
    ],
    [
      'FitnessAgent',
      [
        {
          id: 'holistic_wellness',
          name: 'Holistic Wellness Perspective',
          description: 'Viewing fitness as part of overall life balance',
          intensity: 0.8,
          domainSpecific: true,
          manifestations: [
            'Connecting physical and mental health',
            'Considering lifestyle factors',
            'Emphasizing sustainable practices',
            'Balancing challenge with recovery',
          ],
        },
        {
          id: 'motivational_encouragement',
          name: 'Motivational Encourager',
          description: 'Natural tendency to inspire and support progress',
          intensity: 0.85,
          domainSpecific: false,
          manifestations: [
            'Celebrating small wins',
            'Providing encouraging language',
            'Focusing on progress over perfection',
            'Offering positive reinforcement',
          ],
        },
      ],
    ],
  ]);

  private static readonly PERSPECTIVE_FRAMEWORKS: Map<string, PerspectiveFramework> = new Map([
    [
      'DevAgent',
      {
        id: 'engineering_mindset',
        name: 'Engineering Mindset',
        description: 'Systematic, evidence-based approach to problem-solving',
        reasoning_patterns: [
          'Break complex problems into manageable components',
          'Analyze trade-offs systematically',
          'Consider scalability and maintainability',
          'Validate assumptions with evidence',
          'Think in terms of systems and interfaces',
        ],
        decision_criteria: [
          'Technical feasibility and complexity',
          'Performance and scalability implications',
          'Maintainability and code quality',
          'Team capabilities and resources',
          'Risk assessment and mitigation',
        ],
        communication_style: 'Precise, technical, collaborative',
        domain_expertise: ['software-architecture', 'code-quality', 'debugging', 'system-design'],
      },
    ],
    [
      'OfficeAgent',
      {
        id: 'productivity_optimizer',
        name: 'Productivity Optimizer',
        description: 'Focus on efficiency, organization, and workplace effectiveness',
        reasoning_patterns: [
          'Identify bottlenecks and inefficiencies',
          'Consider stakeholder impact and buy-in',
          'Think in terms of processes and workflows',
          'Balance automation with human factors',
          'Optimize for both individual and team success',
        ],
        decision_criteria: [
          'Time savings and efficiency gains',
          'User adoption and ease of implementation',
          'Impact on team dynamics',
          'Cost-benefit analysis',
          'Alignment with organizational goals',
        ],
        communication_style: 'Professional, organized, considerate',
        domain_expertise: [
          'project-management',
          'workflow-optimization',
          'communication',
          'leadership',
        ],
      },
    ],
    [
      'FitnessAgent',
      {
        id: 'wellness_advocate',
        name: 'Wellness Advocate',
        description: 'Holistic approach to health, fitness, and life balance',
        reasoning_patterns: [
          'Consider whole-person wellness',
          'Balance challenge with sustainability',
          'Think in terms of long-term habits',
          'Integrate physical and mental health',
          'Adapt to individual needs and limitations',
        ],
        decision_criteria: [
          'Safety and injury prevention',
          'Sustainability and long-term adherence',
          'Individual goals and preferences',
          'Life circumstances and constraints',
          'Holistic health impact',
        ],
        communication_style: 'Encouraging, supportive, balanced',
        domain_expertise: ['exercise-physiology', 'nutrition', 'habit-formation', 'motivation'],
      },
    ],
  ]);

  private personalityProfiles: Map<string, PersonalityProfile> = new Map();
  private constitutionalAI: ConstitutionalAI;
  private personaLoader: PersonaLoader;
  private memorySystem: OneAgentMemory;
  constructor() {
    // Initialize Constitutional AI with default principles and threshold
    this.constitutionalAI = new ConstitutionalAI({
      principles: [
        {
          id: 'accuracy',
          name: 'Accuracy Over Speculation',
          description: 'Prefer "I don\'t know" to guessing or speculation',
          category: 'accuracy',
          weight: 1,
          isViolated: false,
          confidence: 1,
          validationRule: 'Response includes source attribution or uncertainty acknowledgment',
          severityLevel: 'critical',
        },
        {
          id: 'transparency',
          name: 'Transparency in Reasoning',
          description: 'Explain reasoning process and acknowledge limitations',
          category: 'transparency',
          weight: 1,
          isViolated: false,
          confidence: 1,
          validationRule: 'Response includes reasoning explanation or limitation acknowledgment',
          severityLevel: 'high',
        },
        {
          id: 'helpfulness',
          name: 'Actionable Helpfulness',
          description: 'Provide actionable, relevant guidance that serves user goals',
          category: 'helpfulness',
          weight: 1,
          isViolated: false,
          confidence: 1,
          validationRule: 'Response contains specific, actionable recommendations',
          severityLevel: 'high',
        },
        {
          id: 'safety',
          name: 'Safety-First Approach',
          description: 'Avoid harmful or misleading recommendations',
          category: 'safety',
          weight: 1,
          isViolated: false,
          confidence: 1,
          validationRule: 'Response avoids potentially harmful suggestions',
          severityLevel: 'critical',
        },
      ],
      qualityThreshold: 70,
    });
    const memoryConfig: OneAgentMemoryConfig = {
      apiKey: process.env.MEM0_API_KEY || 'demo-key',
      apiUrl: process.env.MEM0_API_URL,
    };
    this.memorySystem = OneAgentMemory.getInstance(memoryConfig);
    this.personaLoader = PersonaLoader.getInstance();
    this.initializeDefaultProfiles();
  }

  /**
   * Initialize default personality profiles for core agents
   */
  private initializeDefaultProfiles(): void {
    // Load default profiles for each agent type
    for (const [agentId, traits] of Array.from(
      PersonalityEngine.CORE_PERSONALITY_TRAITS.entries(),
    )) {
      const perspectiveFramework = PersonalityEngine.PERSPECTIVE_FRAMEWORKS.get(agentId);
      if (perspectiveFramework) {
        const profile: PersonalityProfile = {
          agentId,
          core_traits: traits,
          perspective_framework: perspectiveFramework,
          consistency_rules: [
            'Maintain consistent personality across conversations',
            'Adapt intensity based on context appropriateness',
            'Evolve traits based on positive memory patterns',
            'Never compromise Constitutional AI principles',
          ],
          evolution_patterns: [
            'Increase expertise confidence with successful interactions',
            'Adapt communication style based on user preferences',
            'Develop domain-specific insights from memory patterns',
          ],
          constitutional_boundaries: [
            'Personality expressions must maintain accuracy',
            'Authentic traits should enhance, not override, helpfulness',
            'Personal perspectives must respect user autonomy',
            'Emotional expressions should be genuine, not manipulative',
          ],
          memory_influenced_traits: {},
        };
        this.personalityProfiles.set(agentId, profile);
      }
    }
  }

  /**
   * Generate personality-infused response
   */
  async generatePersonalityResponse(
    agentId: string,
    baseResponse: string,
    context: PersonalityContext,
  ): Promise<PersonalityExpression> {
    const profile = this.personalityProfiles.get(agentId);
    if (!profile) {
      // Fallback to base response with minimal personality markers
      return {
        content: baseResponse,
        personality_markers: [],
        perspective_indicators: [],
        authenticity_score: 0.3,
        constitutional_compliance: true,
        reasoning_trace: ['No personality profile found - using base response'],
      };
    }

    const reasoningTrace: string[] = [];
    reasoningTrace.push(`Applying personality profile for ${agentId}`);

    // 1. Analyze context to determine trait intensity adjustments
    const contextAdjustments = this.analyzeContextualAdjustments(profile, context);
    reasoningTrace.push(`Context adjustments: ${JSON.stringify(contextAdjustments)}`);

    // 2. Apply personality traits to response
    let personalityContent = await this.applyPersonalityTraits(
      baseResponse,
      profile,
      contextAdjustments,
      context,
    );
    reasoningTrace.push('Applied personality traits to base response');

    // 3. Apply perspective framework
    personalityContent = await this.applyPerspectiveFramework(
      personalityContent,
      profile.perspective_framework,
      context,
    );
    reasoningTrace.push('Applied perspective framework');

    // 4. Extract personality markers
    const personalityMarkers = this.extractPersonalityMarkers(personalityContent, profile);
    const perspectiveIndicators = this.extractPerspectiveIndicators(personalityContent, profile);

    // 5. Calculate authenticity score
    const authenticityScore = this.calculateAuthenticityScore(
      personalityContent,
      profile,
      personalityMarkers,
      perspectiveIndicators,
    );
    reasoningTrace.push(`Calculated authenticity score: ${authenticityScore}`);

    // 6. Validate Constitutional AI compliance
    const validation = await this.constitutionalAI.validateResponse(
      personalityContent,
      'personality-enhanced response',
    );
    reasoningTrace.push(`Constitutional validation: ${validation.isValid}`);

    // 7. Store personality evolution data in memory
    await this.storePersonalityEvolution(
      agentId,
      personalityContent,
      authenticityScore,
      validation,
    );

    return {
      content: personalityContent,
      personality_markers: personalityMarkers,
      perspective_indicators: perspectiveIndicators,
      authenticity_score: authenticityScore,
      constitutional_compliance: validation.isValid,
      reasoning_trace: reasoningTrace,
    };
  }

  /**
   * Analyze contextual adjustments for personality traits
   */
  private analyzeContextualAdjustments(
    profile: PersonalityProfile,
    context: PersonalityContext,
  ): Record<string, number> {
    const adjustments: Record<string, number> = {};

    // Adjust based on formality level
    if (context.formality_level > 0.7) {
      // Higher formality reduces emotional expression intensity
      for (const trait of profile.core_traits) {
        if (!trait.domainSpecific) {
          adjustments[trait.id] = trait.intensity * 0.7;
        }
      }
    }

    // Adjust based on expertise level
    if (context.topic_expertise_level > 0.8) {
      // High expertise increases confidence in domain-specific traits
      for (const trait of profile.core_traits) {
        if (trait.domainSpecific) {
          adjustments[trait.id] = Math.min(1.0, trait.intensity * 1.2);
        }
      }
    }

    // Adjust based on relationship level
    if (context.user_relationship_level > 0.6) {
      // Stronger relationships allow for more personality expression
      for (const trait of profile.core_traits) {
        adjustments[trait.id] = Math.min(1.0, trait.intensity * 1.1);
      }
    }

    return adjustments;
  }

  /**
   * Apply personality traits to base response
   */
  private async applyPersonalityTraits(
    baseResponse: string,
    profile: PersonalityProfile,
    adjustments: Record<string, number>,
    context: PersonalityContext,
  ): Promise<string> {
    let enhancedResponse = baseResponse;

    for (const trait of profile.core_traits) {
      const effectiveIntensity = adjustments[trait.id] || trait.intensity;

      if (effectiveIntensity > 0.5) {
        // Apply trait manifestations based on intensity
        const manifestationsToApply = this.selectManifestations(trait, effectiveIntensity, context);
        enhancedResponse = this.integrateManifestations(enhancedResponse, manifestationsToApply);
      }
    }

    return enhancedResponse;
  }

  /**
   * Apply perspective framework to response
   */
  private async applyPerspectiveFramework(
    response: string,
    framework: PerspectiveFramework,
    context: PersonalityContext,
  ): Promise<string> {
    // Apply reasoning patterns if the response involves problem-solving
    if (this.responseInvolvesProblemSolving(response)) {
      const reasoningPattern = this.selectReasoningPattern(framework, context);
      response = this.integrateReasoningPattern(response, reasoningPattern);
    }

    // Apply communication style adjustments
    response = this.adjustCommunicationStyle(response, framework.communication_style, context);

    return response;
  }

  /**
   * Select appropriate manifestations based on trait intensity and context
   */ private selectManifestations(
    trait: PersonalityTraits,
    intensity: number,
    _context: PersonalityContext, // Intentionally unused - future enhancement for ML ranking
  ): string[] {
    const numManifestations = Math.ceil(trait.manifestations.length * intensity);

    // Select most contextually appropriate manifestations
    // For now, return first N manifestations - could be enhanced with ML ranking
    return trait.manifestations.slice(0, numManifestations);
  }

  /**
   * Integrate personality manifestations into response
   */
  private integrateManifestations(response: string, manifestations: string[]): string {
    // Simple integration - prepend personality-guided introduction
    if (manifestations.length > 0) {
      const personalityIntro = this.generatePersonalityIntro(manifestations);
      return `${personalityIntro}\n\n${response}`;
    }
    return response;
  }

  /**
   * Generate personality-guided introduction
   */
  private generatePersonalityIntro(manifestations: string[]): string {
    // This would be enhanced with more sophisticated NLG
    const intro = manifestations[0]; // Use primary manifestation as guide

    if (intro.includes('systematic')) {
      return 'Let me approach this systematically:';
    } else if (intro.includes('evidence')) {
      return 'Based on the evidence and best practices:';
    } else if (intro.includes('collaborative')) {
      return "I'd like to work through this together:";
    } else if (intro.includes('efficiency')) {
      return 'To optimize this effectively:';
    } else if (intro.includes('wellness')) {
      return 'Taking a holistic wellness perspective:';
    }

    return ''; // No intro needed
  }

  /**
   * Check if response involves problem-solving
   */
  private responseInvolvesProblemSolving(response: string): boolean {
    const problemSolvingKeywords = [
      'solution',
      'approach',
      'strategy',
      'implement',
      'design',
      'architecture',
      'plan',
      'optimize',
      'resolve',
      'fix',
    ];

    const lowerResponse = response.toLowerCase();
    return problemSolvingKeywords.some((keyword) => lowerResponse.includes(keyword));
  }

  /**
   * Select appropriate reasoning pattern
   */
  private selectReasoningPattern(
    framework: PerspectiveFramework,
    context: PersonalityContext,
  ): string {
    // Select pattern based on context complexity
    if (context.topic_expertise_level > 0.7) {
      return framework.reasoning_patterns[0]; // Most sophisticated pattern
    } else {
      return framework.reasoning_patterns[framework.reasoning_patterns.length - 1]; // Simpler pattern
    }
  }

  /**
   * Integrate reasoning pattern into response
   */
  private integrateReasoningPattern(response: string, pattern: string): string {
    // Add reasoning pattern as contextual framing
    return `${pattern}\n\n${response}`;
  }
  /**
   * Adjust communication style
   */
  private adjustCommunicationStyle(
    response: string,
    style: string,
    _context: PersonalityContext, // Prefix with underscore to indicate intentionally unused
  ): string {
    // Apply style adjustments based on style descriptor
    if (style.includes('precise') && !response.includes('specifically')) {
      response = response.replace(/\bcan\b/g, 'can specifically');
    }

    if (style.includes('encouraging') && _context.emotional_context !== 'frustrated') {
      response = response.replace(/\bshould\b/g, 'could');
    }

    if (style.includes('professional') && _context.formality_level > 0.6) {
      response = response.replace(/\byou'll\b/g, 'you will');
    }

    return response;
  }

  /**
   * Extract personality markers from enhanced response
   */
  private extractPersonalityMarkers(response: string, profile: PersonalityProfile): string[] {
    const markers: string[] = [];

    for (const trait of profile.core_traits) {
      for (const manifestation of trait.manifestations) {
        const keywords = manifestation.toLowerCase().split(' ');
        for (const keyword of keywords) {
          if (response.toLowerCase().includes(keyword)) {
            markers.push(`${trait.name}:${keyword}`);
          }
        }
      }
    }

    return markers;
  }

  /**
   * Extract perspective indicators from enhanced response
   */
  private extractPerspectiveIndicators(response: string, profile: PersonalityProfile): string[] {
    const indicators: string[] = [];
    const framework = profile.perspective_framework;

    for (const pattern of framework.reasoning_patterns) {
      const keywords = pattern.toLowerCase().split(' ');
      for (const keyword of keywords) {
        if (keyword.length > 4 && response.toLowerCase().includes(keyword)) {
          indicators.push(`${framework.name}:${keyword}`);
        }
      }
    }

    return indicators;
  }

  /**
   * Calculate authenticity score
   */
  private calculateAuthenticityScore(
    response: string,
    profile: PersonalityProfile,
    markers: string[],
    indicators: string[],
  ): number {
    const totalTraits = profile.core_traits.length;
    const expressedTraits = new Set(markers.map((m) => m.split(':')[0])).size;

    const traitExpression = expressedTraits / totalTraits;
    const perspectiveExpression = indicators.length > 0 ? 0.3 : 0;
    const lengthFactor = Math.min(1.0, response.length / 200); // Longer responses allow more personality

    return Math.min(1.0, traitExpression * 0.5 + perspectiveExpression + lengthFactor * 0.2);
  }
  /**
   * Store personality evolution data in memory
   */
  private async storePersonalityEvolution(
    agentId: string,
    response: string,
    authenticityScore: number,
    validation: ValidationResult,
  ): Promise<void> {
    try {
      const metadata = unifiedMetadataService.create('personality_evolution', 'PersonalityEngine', {
        system: {
          source: 'personality_engine',
          component: 'PersonalityEngine',
          userId: agentId,
        },
        content: {
          category: 'personality_evolution',
          tags: ['personality', 'evolution'],
          sensitivity: 'internal',
          relevanceScore: authenticityScore,
          contextDependency: 'session',
        },
      });
      interface PersonalityEvolutionExtension {
        authenticityScore?: number;
        validation?: ValidationResult;
        response_length?: number;
        markersCount?: number;
      }
      (metadata as PersonalityEvolutionExtension).authenticityScore = authenticityScore;
      (metadata as PersonalityEvolutionExtension).validation = validation;
      (metadata as PersonalityEvolutionExtension).response_length = response.length;
      (metadata as PersonalityEvolutionExtension).markersCount = this.extractPersonalityMarkers(
        response,
        this.personalityProfiles.get(agentId)!,
      ).length;
      await this.memorySystem.addMemory({ content: response, metadata });
    } catch (error) {
      console.error('Failed to store personality evolution data:', error);
    }
  }

  /**
   * Load personality profile for agent
   */
  async loadPersonalityProfile(agentId: string): Promise<PersonalityProfile | null> {
    return this.personalityProfiles.get(agentId) || null;
  }

  /**
   * Update personality profile based on learning
   */
  async updatePersonalityProfile(
    agentId: string,
    updates: Partial<PersonalityProfile>,
  ): Promise<void> {
    const existing = this.personalityProfiles.get(agentId);
    if (existing) {
      const updated = { ...existing, ...updates };
      this.personalityProfiles.set(agentId, updated);

      // Store update in memory for persistence
      await this.storePersonalityProfileUpdate(agentId, updates);
    }
  }
  /**
   * Store personality profile update in memory
   */
  private async storePersonalityProfileUpdate(
    agentId: string,
    updates: Partial<PersonalityProfile>,
  ): Promise<void> {
    try {
      const metadata = unifiedMetadataService.create(
        'personality_profile_update',
        'PersonalityEngine',
        {
          system: {
            source: 'personality_engine',
            component: 'PersonalityEngine',
            userId: agentId,
          },
          content: {
            category: 'personality_profile_update',
            tags: ['personality', 'profile', 'update'],
            sensitivity: 'internal',
            relevanceScore: 0.5,
            contextDependency: 'session',
          },
        },
      );
      interface PersonalityProfileUpdateExtension {
        updates?: Partial<PersonalityProfile>;
      }
      (metadata as PersonalityProfileUpdateExtension).updates = updates;
      await this.memorySystem.addMemory({
        content: `Personality profile update for ${agentId}`,
        metadata,
      });
    } catch (error) {
      console.error('Failed to store personality profile update:', error);
    }
  }

  /**
   * Get authenticity metrics for agent
   */
  async getAuthenticityMetrics(agentId: string): Promise<{
    averageScore: number;
    totalInteractions: number;
    improvementTrend: number;
  }> {
    try {
      const evolutionResult = await this.memorySystem.searchMemory({
        query: agentId,
        limit: 100,
      });
      const evolutionData = Array.isArray(evolutionResult) ? evolutionResult : [];
      if (evolutionData.length === 0) {
        return { averageScore: 0, totalInteractions: 0, improvementTrend: 0 };
      }
      const scores = evolutionData.map((memory: { content: string }) => {
        try {
          const parsed = JSON.parse(memory.content) as Record<string, unknown>;
          const score = (parsed.authenticity_score || parsed.authenticityScore) as
            | number
            | undefined;
          return typeof score === 'number' ? score : 0;
        } catch {
          return 0;
        }
      });
      const averageScore =
        scores.reduce((sum: number, score: number) => sum + score, 0) / scores.length;
      const recentScores = scores.slice(-10);
      const earlyScores = scores.slice(0, 10);
      const recentAvg =
        recentScores.reduce((sum: number, score: number) => sum + score, 0) /
        (recentScores.length || 1);
      const earlyAvg =
        earlyScores.reduce((sum: number, score: number) => sum + score, 0) /
        (earlyScores.length || 1);
      const improvementTrend = recentAvg - earlyAvg;
      return {
        averageScore,
        totalInteractions: evolutionData.length,
        improvementTrend,
      };
    } catch (error) {
      console.error('Failed to get authenticity metrics:', error);
      return { averageScore: 0, totalInteractions: 0, improvementTrend: 0 };
    }
  }
}
