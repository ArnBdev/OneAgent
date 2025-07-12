/**
 * Configuration loader for OneAgent VS Code Extension
 * Reads configuration from environment variables when available
 */

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

interface OneAgentConfig {
  serverUrl: string;
  memoryUrl: string;
  enableConstitutionalAI: boolean;
  qualityThreshold: number;
}

/**
 * Load OneAgent configuration from environment or defaults
 */
export function loadOneAgentConfig(): OneAgentConfig {
  // Try to load from .env file if available
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
  const envConfig: Record<string, string> = {};
  
  if (workspaceFolder) {
    const envPath = path.join(workspaceFolder.uri.fsPath, '.env');
    if (fs.existsSync(envPath)) {
      try {
        const envContent = fs.readFileSync(envPath, 'utf8');
        envContent.split('\n').forEach(line => {
          const [key, value] = line.split('=');
          if (key && value) {
            envConfig[key.trim()] = value.trim();
          }
        });
      } catch (error) {
        console.warn('Failed to load .env file:', error);
      }
    }
  }
  
  // Get configuration from VS Code settings with environment fallbacks
  const config = vscode.workspace.getConfiguration('oneagent');
  
  return {
    serverUrl: config.get('serverUrl') || 
               envConfig.ONEAGENT_MCP_URL || 
               'http://127.0.0.1:8083',
    memoryUrl: envConfig.ONEAGENT_MEMORY_URL || 
               'http://127.0.0.1:8001',
    enableConstitutionalAI: config.get('enableConstitutionalAI', true),
    qualityThreshold: config.get('qualityThreshold', 80)
  };
}

/**
 * Get the current OneAgent server URL with environment variable support
 */
export function getServerUrl(): string {
  const config = loadOneAgentConfig();
  return config.serverUrl;
}

/**
 * Get the current OneAgent memory URL with environment variable support
 */
export function getMemoryUrl(): string {
  const config = loadOneAgentConfig();
  return config.memoryUrl;
}
