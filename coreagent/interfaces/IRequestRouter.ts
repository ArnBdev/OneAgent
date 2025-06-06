/**
 * Request Router Interface
 * Legacy interface for backward compatibility - redirects to orchestrator interfaces
 * @deprecated Use IRequestRouter from orchestrator/interfaces instead
 */

export type { 
    IRequestRouter,
    RoutingRequest,
    RoutingResult,
    IntentAnalysis,
    ConfidenceScore,
    RoutingContext
} from '../orchestrator/interfaces/IRequestRouter';