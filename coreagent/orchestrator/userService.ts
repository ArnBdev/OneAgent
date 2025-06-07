/**
 * UserService - Service for managing User objects and operations
 * 
 * Provides CRUD operations for users with UUID standards,
 * customInstructions management, and data persistence layer.
 */

import { 
  User, 
  UserCreateRequest, 
  UserUpdateRequest, 
  UserSearchCriteria,
  generateUUID,
  isValidUUID
} from '../types/user';

export interface IUserService {
  /**
   * Create a new user with UUID generation
   */
  createUser(userData: UserCreateRequest): Promise<User>;

  /**
   * Get user by ID (UUID)
   */
  getUserById(userId: string): Promise<User | null>;

  /**
   * Get user by email
   */
  getUserByEmail(email: string): Promise<User | null>;

  /**
   * Update user information
   */
  updateUser(userId: string, updates: UserUpdateRequest): Promise<User | null>;

  /**
   * Delete user (soft delete by setting status to inactive)
   */
  deleteUser(userId: string): Promise<boolean>;

  /**
   * Search users by criteria
   */
  searchUsers(criteria: UserSearchCriteria): Promise<User[]>;

  /**
   * Get user's custom instructions
   */
  getUserCustomInstructions(userId: string): Promise<string>;

  /**
   * Update user's custom instructions
   */
  updateUserCustomInstructions(userId: string, customInstructions: string): Promise<boolean>;

  /**
   * Update user's last activity timestamp
   */
  updateLastActivity(userId: string): Promise<boolean>;

  /**
   * Get all active users
   */
  getActiveUsers(): Promise<User[]>;

  /**
   * Validate user exists and is active
   */
  validateUser(userId: string): Promise<boolean>;
}

/**
 * In-Memory UserService implementation
 * 
 * This is a basic implementation using in-memory storage.
 * For production, this should be replaced with a database implementation.
 */
export class MemoryUserService implements IUserService {
  private users: Map<string, User> = new Map();
  private emailIndex: Map<string, string> = new Map(); // email -> userId mapping

  constructor() {
    // Initialize with demo users including Arne's profile
    this.initializeDemoUsers();
  }

  /**
   * Initialize demo users for development and testing
   */
  private initializeDemoUsers(): void {
    // Arne's user profiles
    const arneUsers = [
      {
        id: 'arne',
        name: 'Arne',
        email: 'arne@oneagent.dev',
        customInstructions: this.getArneCustomInstructions()
      },
      {
        id: 'arne-oneagent',
        name: 'Arne OneAgent',
        email: 'arne.oneagent@dev.local',
        customInstructions: this.getArneCustomInstructions()
      },
      {
        id: 'arne-dev',
        name: 'Arne Developer',
        email: 'arne.dev@local',
        customInstructions: this.getArneCustomInstructions()
      }
    ];

    arneUsers.forEach(userData => {
      const user: User = {
        ...userData,
        createdAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
        preferences: {
          language: 'en',
          timezone: 'Europe/Oslo',
          theme: 'dark'
        },
        status: 'active'
      };
      
      this.users.set(user.id, user);
      if (user.email) {
        this.emailIndex.set(user.email, user.id);
      }
    });

    // Demo user without custom instructions
    const demoUser: User = {
      id: 'demo-user',
      name: 'Demo User',
      email: 'demo@oneagent.dev',
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      preferences: {
        language: 'en',
        timezone: 'UTC',
        theme: 'light'
      },
      status: 'active'
    };
    
    this.users.set(demoUser.id, demoUser);
    if (demoUser.email) {
      this.emailIndex.set(demoUser.email, demoUser.id);
    }
  }

  /**
   * Get Arne's custom instructions
   */
  private getArneCustomInstructions(): string {
    return `Follow structured development workflow: 1) Update roadmap first, 2) Propose next step and wait for explicit approval, 3) After implementation: test code, fix errors, update documentation, summarize work, propose next steps. Use TypeScript best practices with proper typing and modular architecture. Maintain clear separation of concerns. Prefer explicit communication with structured reports using sections: Implementation Summary, Roadmap Update, Next Step, Pause & Wait. Always test implementations before completion. Store learnings in mem0 for future reference. Focus on production-ready code with error handling.`;
  }
  async createUser(userData: UserCreateRequest): Promise<User> {
    const userId = generateUUID();
    const now = new Date().toISOString();

    const user: User = {
      id: userId,
      name: userData.name,
      email: userData.email || undefined,
      customInstructions: userData.customInstructions || undefined,
      preferences: userData.preferences || {},
      createdAt: now,
      lastActiveAt: now,
      status: 'active' as const
    };

    this.users.set(userId, user);
    
    if (user.email) {
      this.emailIndex.set(user.email, userId);
    }

    return user;
  }

  async getUserById(userId: string): Promise<User | null> {
    return this.users.get(userId) || null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const userId = this.emailIndex.get(email);
    return userId ? this.users.get(userId) || null : null;
  }

  async updateUser(userId: string, updates: UserUpdateRequest): Promise<User | null> {
    const user = this.users.get(userId);
    if (!user) {
      return null;
    }

    // Update email index if email is changing
    if (updates.email && updates.email !== user.email) {
      if (user.email) {
        this.emailIndex.delete(user.email);
      }
      this.emailIndex.set(updates.email, userId);
    }    const updatedUser: User = {
      ...user,
      ...updates,
      lastActiveAt: new Date().toISOString(),
      status: updates.status || user.status || 'active'
    };

    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  async deleteUser(userId: string): Promise<boolean> {
    const user = this.users.get(userId);
    if (!user) {
      return false;
    }

    // Soft delete by setting status to inactive
    const updatedUser: User = {
      ...user,
      status: 'inactive',
      lastActiveAt: new Date().toISOString()
    };

    this.users.set(userId, updatedUser);
    return true;
  }

  async searchUsers(criteria: UserSearchCriteria): Promise<User[]> {
    let users = Array.from(this.users.values());

    // Apply filters
    if (criteria.name) {
      users = users.filter(user => 
        user.name.toLowerCase().includes(criteria.name!.toLowerCase())
      );
    }

    if (criteria.email) {
      users = users.filter(user => 
        user.email?.toLowerCase().includes(criteria.email!.toLowerCase())
      );
    }

    if (criteria.status) {
      users = users.filter(user => user.status === criteria.status);
    }

    if (criteria.hasCustomInstructions !== undefined) {
      users = users.filter(user => 
        criteria.hasCustomInstructions 
          ? !!user.customInstructions 
          : !user.customInstructions
      );
    }

    // Apply pagination
    const offset = criteria.offset || 0;
    const limit = criteria.limit || 100;
    
    return users.slice(offset, offset + limit);
  }

  async getUserCustomInstructions(userId: string): Promise<string> {
    const user = this.users.get(userId);
    return user?.customInstructions || '';
  }

  async updateUserCustomInstructions(userId: string, customInstructions: string): Promise<boolean> {
    const user = this.users.get(userId);
    if (!user) {
      return false;
    }

    const updatedUser: User = {
      ...user,
      customInstructions,
      lastActiveAt: new Date().toISOString()
    };

    this.users.set(userId, updatedUser);
    return true;
  }

  async updateLastActivity(userId: string): Promise<boolean> {
    const user = this.users.get(userId);
    if (!user) {
      return false;
    }

    const updatedUser: User = {
      ...user,
      lastActiveAt: new Date().toISOString()
    };

    this.users.set(userId, updatedUser);
    return true;
  }

  async getActiveUsers(): Promise<User[]> {
    return Array.from(this.users.values()).filter(user => user.status === 'active');
  }

  async validateUser(userId: string): Promise<boolean> {
    const user = this.users.get(userId);
    return user?.status === 'active';
  }

  /**
   * Get user count for statistics
   */
  async getUserCount(): Promise<number> {
    return this.users.size;
  }

  /**
   * Get users with custom instructions
   */
  async getUsersWithCustomInstructions(): Promise<User[]> {
    return Array.from(this.users.values()).filter(user => !!user.customInstructions);
  }
}

// Export singleton instance
export const userService = new MemoryUserService();
