/**
 * UUID Validation and Migration Utilities for OneAgent
 * Provides consistent UUID v4 validation and migration across the system
 */

import { randomUUID } from 'crypto';
import { isValidUUID, generateUUID } from '../types/user';

/**
 * UUID Validation Middleware for Express routes
 * Validates that userId and sessionId parameters are proper UUIDs
 */
export function validateUUIDs(req: any, res: any, next: any) {
  const { userId, sessionId } = req.params;
  const bodyUserId = req.body?.userId;
  const bodySessionId = req.body?.sessionId;
  
  // Validate URL parameters
  if (userId && !isValidUUID(userId)) {
    return res.status(400).json({
      error: 'Invalid userId format - must be UUID v4',
      received: userId
    });
  }
  
  if (sessionId && !isValidUUID(sessionId)) {
    return res.status(400).json({
      error: 'Invalid sessionId format - must be UUID v4',
      received: sessionId
    });
  }
  
  // Validate request body parameters
  if (bodyUserId && !isValidUUID(bodyUserId)) {
    return res.status(400).json({
      error: 'Invalid userId in request body - must be UUID v4',
      received: bodyUserId
    });
  }
  
  if (bodySessionId && !isValidUUID(bodySessionId)) {
    return res.status(400).json({
      error: 'Invalid sessionId in request body - must be UUID v4',
      received: bodySessionId
    });
  }
  
  next();
}

/**
 * Generate a new UUID v4 using crypto.randomUUID() if available,
 * fallback to our custom implementation
 */
export function generateSecureUUID(): string {
  try {
    return randomUUID();
  } catch (error) {
    console.warn('crypto.randomUUID() not available, using fallback implementation');
    return generateUUID();
  }
}

/**
 * UUID Migration utilities for existing data
 */
export class UUIDMigrationUtils {
  
  /**
   * Check if a string looks like a legacy user ID that needs migration
   */
  static isLegacyUserId(id: string): boolean {
    // Common patterns for legacy user IDs
    const legacyPatterns = [
      /^test[_-]?user$/i,
      /^user[_-]?\d+$/i,
      /^[a-zA-Z]+$/i, // Simple alphabetic names
      /^[a-zA-Z0-9]{1,8}$/i // Short alphanumeric IDs
    ];
    
    return !isValidUUID(id) && legacyPatterns.some(pattern => pattern.test(id));
  }
  
  /**
   * Generate a mapping from legacy ID to new UUID
   */
  static createMigrationMapping(legacyIds: string[]): Map<string, string> {
    const mapping = new Map<string, string>();
    
    for (const legacyId of legacyIds) {
      if (this.isLegacyUserId(legacyId)) {
        mapping.set(legacyId, generateSecureUUID());
      }
    }
    
    return mapping;
  }
  
  /**
   * Migrate legacy user IDs to UUIDs in data objects
   */
  static migrateLegacyUserIds(data: any, mapping: Map<string, string>): any {
    if (typeof data !== 'object' || data === null) {
      return data;
    }
    
    if (Array.isArray(data)) {
      return data.map(item => this.migrateLegacyUserIds(item, mapping));
    }
    
    const result = { ...data };
    
    // Migrate common user ID fields
    const userIdFields = ['userId', 'user_id', 'ownerId', 'createdBy'];
    
    for (const field of userIdFields) {
      if (result[field] && mapping.has(result[field])) {
        result[field] = mapping.get(result[field]);
      }
    }
    
    // Recursively migrate nested objects
    for (const key in result) {
      if (typeof result[key] === 'object') {
        result[key] = this.migrateLegacyUserIds(result[key], mapping);
      }
    }
    
    return result;
  }
}

/**
 * Session ID validation and generation utilities
 */
export class SessionManager {
  
  /**
   * Generate a new session ID with proper UUID v4 format
   */
  static generateSessionId(): string {
    return generateSecureUUID();
  }
  
  /**
   * Validate session ID format
   */
  static isValidSessionId(sessionId: string): boolean {
    return isValidUUID(sessionId);
  }
  
  /**
   * Create session metadata with proper UUID validation
   */
  static createSessionMetadata(userId: string, sessionId?: string) {
    if (!isValidUUID(userId)) {
      throw new Error(`Invalid userId format: ${userId}. Must be UUID v4.`);
    }
    
    const finalSessionId = sessionId || this.generateSessionId();
    
    if (!this.isValidSessionId(finalSessionId)) {
      throw new Error(`Invalid sessionId format: ${finalSessionId}. Must be UUID v4.`);
    }
    
    return {
      userId,
      sessionId: finalSessionId,
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString()
    };
  }
}

/**
 * Type guards for UUID validation
 */
export function assertValidUUID(value: string, fieldName = 'ID'): asserts value is string {
  if (!isValidUUID(value)) {
    throw new Error(`Invalid ${fieldName} format: ${value}. Must be UUID v4.`);
  }
}

export function assertValidUserId(userId: string): asserts userId is string {
  assertValidUUID(userId, 'userId');
}

export function assertValidSessionId(sessionId: string): asserts sessionId is string {
  assertValidUUID(sessionId, 'sessionId');
}
