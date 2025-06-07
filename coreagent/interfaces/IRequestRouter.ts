/**
 * Request Router Interface
 * Legacy interface for backward compatibility - redirects to orchestrator interfaces
 * @deprecated Use IRequestRouter from orchestrator/interfaces instead
 */

export type { 
    IRequestRouter,
    RouteResult as RoutingResult,
    RequestAnalysis as IntentAnalysis,
    ConfidenceScore,
    RoutingContext,
    RoutingRequest,
    RequestIntent,
    IntentCategory,
    Entity,
    RoutingRule,
    RoutingCondition,
    AlternativeAgent,
    PerformanceMetrics
} from '../orchestrator/interfaces/IRequestRouter';