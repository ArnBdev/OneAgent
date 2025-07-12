export interface ModelSelectionCriteria {
    agentType: string;
    requiredTier?: string;
    prioritizeCost?: boolean;
    prioritizePerformance?: boolean;
    taskType?: string;
    scenario?: string;
    expectedVolume?: string;
    fallbackStrategy?: string;
}
export interface ModelSelection {
    modelName: string;
    primaryModel: string;
    tier: string;
    reasoning: string;
    estimatedCostPer1K: number;
    fallbackModels: string[];
    capabilities: Record<string, string>;
    rateLimits?: {
        rpm: number;
    };
}
export declare class ModelTierSelector {
    private static _instance;
    static selectTier(agentType: string): string;
    static getInstance(): ModelTierSelector;
    selectOptimalModel(criteria: ModelSelectionCriteria): ModelSelection;
}
