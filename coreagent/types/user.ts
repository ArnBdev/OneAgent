/**
 * User types and interfaces for CoreAgent
 * Defines user structure and session management
 */

export interface User {
  id: string;
  name: string;
  email?: string;
  createdAt: string;
  lastActiveAt: string;
  preferences?: Record<string, any>;
}

export interface UserSession {
  userId: string;
  sessionId: string;
  startedAt: string;
  lastActivity: string;
  context?: Record<string, any>;
}

export interface UserPreferences {
  language?: string;
  timezone?: string;
  theme?: 'light' | 'dark';
  notifications?: boolean;
  [key: string]: any;
}
