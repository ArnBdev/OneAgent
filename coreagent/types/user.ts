/**
 * User types and interfaces for CoreAgent
 * Defines user structure and session management with UUID standards
 */

export interface User {
  /** Unique identifier for the user (UUID v4 standard) */
  id: string;
  name: string;
  email?: string | undefined;
  createdAt: string;
  lastActiveAt: string;
  preferences?: Record<string, unknown>;
  /** Custom instructions for agent behavior personalization */
  customInstructions?: string | undefined;
  /** Account status */
  status?: 'active' | 'inactive' | 'suspended' | undefined;
  /** User permissions for authorization */
  permissions?: string[];
}

export interface UserSession {
  /** User ID (must be UUID v4 format) */
  userId: string;
  /** Session ID (must be UUID v4 format) */
  sessionId: string;
  startedAt: string;
  lastActivity: string;
  context?: Record<string, unknown>;
}

export interface UserPreferences {
  language?: string;
  timezone?: string;
  theme?: 'light' | 'dark';
  notifications?: boolean;
  [key: string]: unknown;
}

/**
 * UserProfile - Extended user information for context management
 */
export interface UserProfile {
  /** User basic information */
  user: User;
  /** User session information */
  session?: UserSession;
  /** User activity metrics */
  activityLevel?: 'low' | 'medium' | 'high';
  /** User interaction history summary */
  interactionHistory?: {
    totalInteractions: number;
    lastInteractionType: string;
    preferredAgents: string[];
  };
  /** User capabilities and restrictions */
  capabilities?: string[];
  /** Custom user instructions and preferences */
  customInstructions?: string;
}

/**
 * UserCreateRequest - Data required to create a new user
 */
export interface UserCreateRequest {
  name: string;
  email?: string;
  customInstructions?: string;
  preferences?: Record<string, unknown>;
}

/**
 * UserUpdateRequest - Data allowed for user updates
 */
export interface UserUpdateRequest {
  name?: string;
  email?: string;
  customInstructions?: string;
  preferences?: Record<string, unknown>;
  status?: User['status'];
}

/**
 * UserSearchCriteria - Search and filter criteria for users
 */
export interface UserSearchCriteria {
  name?: string;
  email?: string;
  status?: User['status'];
  hasCustomInstructions?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * UUID validation utility - ensures UUID v4 format
 */
export function isValidUUID(uuid: string): boolean {
  const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidV4Regex.test(uuid);
}

/**
 * Generate UUID v4 compatible string
 */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
