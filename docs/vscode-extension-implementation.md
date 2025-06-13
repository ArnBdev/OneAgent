# OneAgent VS Code Extension Implementation Guide

## Quick Start Implementation

### Step 1: Create Extension Structure

```bash
cd c:\Users\arne\.cline\mcps\OneAgent\coreagent
mkdir vscode-extension
cd vscode-extension
npm init -y
npm install @types/vscode vscode-languageclient
npm install --save-dev @vscode/test-electron typescript @types/node
```

### Step 2: Package.json Configuration

```json
{
  "name": "oneagent-professional",
  "displayName": "OneAgent Professional",
  "description": "Professional AI Development Platform with Constitutional AI",
  "version": "1.0.0",
  "publisher": "oneagent",
  "engines": {
    "vscode": "^1.74.0"
  },
  "categories": [
    "AI",
    "Chat",
    "Data Science",
    "Debuggers",
    "Other"
  ],
  "activationEvents": [
    "onStartupFinished"
  ],
  "main": "./out/extension.js",
  "contributes": {
    "commands": [
      {
        "command": "oneagent.openDashboard",
        "title": "Open Dashboard",
        "category": "OneAgent"
      },
      {
        "command": "oneagent.constitutionalValidate",
        "title": "Constitutional Validate Selection",
        "category": "OneAgent"
      },
      {
        "command": "oneagent.bmadAnalyze",
        "title": "BMAD Framework Analysis",
        "category": "OneAgent"
      },
      {
        "command": "oneagent.qualityScore",
        "title": "Quality Score Selection",
        "category": "OneAgent"
      },
      {
        "command": "oneagent.memorySearch",
        "title": "Search Memory Context",
        "category": "OneAgent"
      }
    ],
    "chatParticipants": [
      {
        "id": "oneagent",
        "name": "OneAgent",
        "description": "Professional AI Development Assistant with Constitutional AI",
        "isSticky": true
      }
    ],
    "menus": {
      "editor/context": [
        {
          "command": "oneagent.constitutionalValidate",
          "when": "editorTextFocus",
          "group": "oneagent@1"
        },
        {
          "command": "oneagent.qualityScore",
          "when": "editorTextFocus",
          "group": "oneagent@2"
        },
        {
          "command": "oneagent.bmadAnalyze",
          "when": "editorTextFocus",
          "group": "oneagent@3"
        }
      ],
      "commandPalette": [
        {
          "command": "oneagent.openDashboard"
        }
      ]
    },
    "configuration": {
      "title": "OneAgent Professional",
      "properties": {
        "oneagent.serverUrl": {
          "type": "string",
          "default": "http://localhost:8083",
          "description": "OneAgent MCP Server URL"
        },
        "oneagent.enableConstitutionalAI": {
          "type": "boolean",
          "default": true,
          "description": "Enable Constitutional AI validation"
        },
        "oneagent.qualityThreshold": {
          "type": "number",
          "default": 80,
          "minimum": 0,
          "maximum": 100,
          "description": "Minimum quality score threshold"
        }
      }
    }
  },
  "scripts": {
    "vscode:prepublish": "npm run compile",
    "compile": "tsc -p ./",
    "watch": "tsc -watch -p ./"
  },
  "devDependencies": {
    "@types/vscode": "^1.74.0",
    "@types/node": "16.x",
    "typescript": "^4.9.4"
  }
}
```

### Step 3: TypeScript Configuration

```json
{
  "compilerOptions": {
    "module": "commonjs",
    "target": "ES2020",
    "outDir": "out",
    "lib": ["ES2020"],
    "sourceMap": true,
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "exclude": ["node_modules", ".vscode-test"]
}
```

## Core Implementation Files

### 1. Main Extension Entry Point

```typescript
// src/extension.ts
import * as vscode from 'vscode';
import { OneAgentClient } from './connection/oneagent-client';
import { OneAgentChatProvider } from './providers/oneagent-chat-provider';
import { OneAgentStatusBar } from './ui/status-bar';
import { registerCommands } from './commands/oneagent-commands';
import { OneAgentPanel } from './webview/oneagent-panel';

export async function activate(context: vscode.ExtensionContext) {
    console.log('OneAgent Professional extension is activating...');
    
    // Initialize OneAgent client
    const client = new OneAgentClient();
    
    // Check OneAgent availability
    const isAvailable = await client.healthCheck();
    if (!isAvailable) {
        vscode.window.showWarningMessage(
            'OneAgent server not available. Please ensure OneAgent is running on port 8083.'
        );
    }
    
    // Register chat participant
    const chatProvider = new OneAgentChatProvider(client);
    const chatParticipant = vscode.chat.createChatParticipant('oneagent', chatProvider.handleRequest.bind(chatProvider));
    chatParticipant.iconPath = vscode.Uri.joinPath(context.extensionUri, 'assets', 'oneagent-icon.png');
    chatParticipant.followupProvider = chatProvider.provideFollowups.bind(chatProvider);
    
    // Register commands
    registerCommands(context, client);
    
    // Initialize status bar
    const statusBar = new OneAgentStatusBar(client);
    context.subscriptions.push(statusBar);
    
    // Register webview provider
    const dashboardProvider = new OneAgentPanel(context.extensionUri, client);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider('oneagent.dashboard', dashboardProvider)
    );
    
    console.log('OneAgent Professional extension activated successfully');
}

export function deactivate() {
    console.log('OneAgent Professional extension deactivated');
}
```

### 2. OneAgent HTTP Client

```typescript
// src/connection/oneagent-client.ts
export interface OneAgentResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    qualityScore?: number;
}

export interface ConstitutionalValidationRequest {
    response: string;
    userMessage: string;
    context?: any;
}

export interface QualityScoreRequest {
    content: string;
    criteria?: string[];
}

export interface BMADAnalysisRequest {
    task: string;
}

export class OneAgentClient {
    private baseUrl: string;
    
    constructor() {
        const config = vscode.workspace.getConfiguration('oneagent');
        this.baseUrl = config.get('serverUrl', 'http://localhost:8083');
    }
    
    async healthCheck(): Promise<boolean> {
        try {
            const response = await fetch(`${this.baseUrl}/health`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });
            return response.ok;
        } catch (error) {
            console.error('OneAgent health check failed:', error);
            return false;
        }
    }
    
    async constitutionalValidate(request: ConstitutionalValidationRequest): Promise<OneAgentResponse> {
        return this.makeRequest('/constitutional-validate', request);
    }
    
    async qualityScore(request: QualityScoreRequest): Promise<OneAgentResponse> {
        return this.makeRequest('/quality-score', request);
    }
    
    async bmadAnalyze(request: BMADAnalysisRequest): Promise<OneAgentResponse> {
        return this.makeRequest('/bmad-analyze', request);
    }
    
    async aiAssistant(message: string, applyConstitutional: boolean = true): Promise<OneAgentResponse> {
        return this.makeRequest('/ai-assistant', {
            message,
            applyConstitutional
        });
    }
    
    async systemHealth(): Promise<OneAgentResponse> {
        return this.makeRequest('/system-health', {}, 'GET');
    }
    
    async memorySearch(query: string, userId: string): Promise<OneAgentResponse> {
        return this.makeRequest('/memory-context', { query, userId });
    }
    
    private async makeRequest(endpoint: string, data: any = {}, method: string = 'POST'): Promise<OneAgentResponse> {
        try {
            const options: RequestInit = {
                method,
                headers: { 'Content-Type': 'application/json' }
            };
            
            if (method !== 'GET') {
                options.body = JSON.stringify(data);
            }
            
            const response = await fetch(`${this.baseUrl}${endpoint}`, options);
            
            if (!response.ok) {
                return {
                    success: false,
                    error: `HTTP ${response.status}: ${response.statusText}`
                };
            }
            
            const result = await response.json();
            return {
                success: true,
                data: result
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
}
```

### 3. Chat Provider Implementation

```typescript
// src/providers/oneagent-chat-provider.ts
import * as vscode from 'vscode';
import { OneAgentClient } from '../connection/oneagent-client';

export class OneAgentChatProvider {
    constructor(private client: OneAgentClient) {}
    
    async handleRequest(
        request: vscode.ChatRequest,
        context: vscode.ChatContext,
        response: vscode.ChatResponseStream,
        token: vscode.CancellationToken
    ): Promise<void> {
        
        // Check if OneAgent is available
        const isAvailable = await this.client.healthCheck();
        if (!isAvailable) {
            response.text('⚠️ OneAgent server is not available. Please ensure OneAgent is running on port 8083.');
            return;
        }
        
        try {
            // Show thinking indicator
            response.text('🧠 OneAgent is analyzing your request...\n\n');
            
            // Get AI response with Constitutional AI
            const aiResponse = await this.client.aiAssistant(request.prompt, true);
            
            if (!aiResponse.success) {
                response.text(`❌ Error: ${aiResponse.error}`);
                return;
            }
            
            // Display response with quality indicator
            if (aiResponse.qualityScore) {
                const qualityEmoji = this.getQualityEmoji(aiResponse.qualityScore);
                response.text(`${qualityEmoji} Quality Score: ${aiResponse.qualityScore}%\n\n`);
            }
            
            response.text(aiResponse.data.content);
            
            // Add Constitutional AI compliance note
            if (aiResponse.data.constitutionalCompliance) {
                response.text('\n\n✅ Response validated with Constitutional AI');
            }
            
        } catch (error) {
            response.text(`❌ Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    
    async provideFollowups(
        result: vscode.ChatResult,
        context: vscode.ChatContext,
        token: vscode.CancellationToken
    ): Promise<vscode.ChatFollowup[]> {
        return [
            {
                prompt: 'Analyze this with BMAD framework',
                label: '🔍 BMAD Analysis'
            },
            {
                prompt: 'Check code quality score',
                label: '📊 Quality Score'
            },
            {
                prompt: 'Apply Constitutional AI validation',
                label: '⚖️ Constitutional Validate'
            }
        ];
    }
    
    private getQualityEmoji(score: number): string {
        if (score >= 90) return '🌟';
        if (score >= 80) return '✅';
        if (score >= 70) return '⚠️';
        return '❌';
    }
}
```

### 4. Command Registration

```typescript
// src/commands/oneagent-commands.ts
import * as vscode from 'vscode';
import { OneAgentClient } from '../connection/oneagent-client';

export function registerCommands(context: vscode.ExtensionContext, client: OneAgentClient) {
    
    // Constitutional Validation Command
    context.subscriptions.push(
        vscode.commands.registerCommand('oneagent.constitutionalValidate', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showErrorMessage('No active editor found');
                return;
            }
            
            const selection = editor.document.getText(editor.selection);
            if (!selection) {
                vscode.window.showErrorMessage('No text selected');
                return;
            }
            
            const result = await client.constitutionalValidate({
                response: selection,
                userMessage: 'Code validation request'
            });
            
            if (result.success) {
                vscode.window.showInformationMessage(
                    `Constitutional AI Validation: ${result.data.isCompliant ? '✅ Compliant' : '❌ Non-compliant'}`
                );
            } else {
                vscode.window.showErrorMessage(`Validation failed: ${result.error}`);
            }
        })
    );
    
    // Quality Score Command
    context.subscriptions.push(
        vscode.commands.registerCommand('oneagent.qualityScore', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showErrorMessage('No active editor found');
                return;
            }
            
            const selection = editor.document.getText(editor.selection) || editor.document.getText();
            
            const result = await client.qualityScore({
                content: selection,
                criteria: ['accuracy', 'maintainability', 'performance']
            });
            
            if (result.success) {
                const score = result.data.qualityScore;
                const grade = result.data.grade;
                vscode.window.showInformationMessage(
                    `Quality Score: ${score}% (Grade: ${grade})`
                );
            } else {
                vscode.window.showErrorMessage(`Quality scoring failed: ${result.error}`);
            }
        })
    );
    
    // BMAD Analysis Command
    context.subscriptions.push(
        vscode.commands.registerCommand('oneagent.bmadAnalyze', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showErrorMessage('No active editor found');
                return;
            }
            
            const selection = editor.document.getText(editor.selection);
            if (!selection) {
                vscode.window.showErrorMessage('No text selected');
                return;
            }
            
            const result = await client.bmadAnalyze({ task: selection });
            
            if (result.success) {
                const panel = vscode.window.createWebviewPanel(
                    'bmadAnalysis',
                    'BMAD Framework Analysis',
                    vscode.ViewColumn.Two,
                    {}
                );
                
                panel.webview.html = this.getBMADWebviewContent(result.data);
            } else {
                vscode.window.showErrorMessage(`BMAD analysis failed: ${result.error}`);
            }
        })
    );
    
    // Dashboard Command
    context.subscriptions.push(
        vscode.commands.registerCommand('oneagent.openDashboard', async () => {
            vscode.commands.executeCommand('workbench.view.extension.oneagent-dashboard');
        })
    );
    
    // Memory Search Command
    context.subscriptions.push(
        vscode.commands.registerCommand('oneagent.memorySearch', async () => {
            const query = await vscode.window.showInputBox({
                prompt: 'Enter search query for OneAgent memory',
                placeHolder: 'Search project context...'
            });
            
            if (query) {
                const userId = vscode.env.machineId; // Use machine ID as user identifier
                const result = await client.memorySearch(query, userId);
                
                if (result.success && result.data.memories?.length) {
                    const items = result.data.memories.map((memory: any) => ({
                        label: memory.content.substring(0, 50) + '...',
                        description: memory.memoryType,
                        detail: memory.content
                    }));
                    
                    const selected = await vscode.window.showQuickPick(items, {
                        placeHolder: 'Select memory to view'
                    });
                    
                    if (selected) {
                        vscode.window.showInformationMessage(selected.detail);
                    }
                } else {
                    vscode.window.showInformationMessage('No relevant memories found');
                }
            }
        })
    );
}

function getBMADWebviewContent(analysis: any): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <title>BMAD Framework Analysis</title>
        <style>
            body { font-family: 'Segoe UI', sans-serif; padding: 20px; }
            .section { margin-bottom: 20px; }
            .score { font-weight: bold; color: #007acc; }
        </style>
    </head>
    <body>
        <h1>BMAD Framework Analysis</h1>
        <div class="section">
            <h2>Summary</h2>
            <p>${analysis.summary}</p>
        </div>
        <div class="section">
            <h2>Confidence Score</h2>
            <p class="score">${analysis.confidence}%</p>
        </div>
        <div class="section">
            <h2>Recommendations</h2>
            <ul>
                ${analysis.recommendations?.map((rec: string) => `<li>${rec}</li>`).join('') || '<li>No specific recommendations</li>'}
            </ul>
        </div>
    </body>
    </html>`;
}
```

## Deployment Instructions

### 1. Build the Extension
```bash
cd c:\Users\arne\.cline\mcps\OneAgent\coreagent\vscode-extension
npm run compile
```

### 2. Test Locally
```bash
# Open in VS Code for testing
code .
# Press F5 to launch Extension Development Host
```

### 3. Package for Distribution
```bash
npm install -g vsce
vsce package
```

## Quality Assurance Checklist

### Pre-deployment Testing
- [ ] OneAgent core functions independently
- [ ] Extension gracefully handles OneAgent offline
- [ ] All commands work with proper error handling
- [ ] Chat provider validates Constitutional AI
- [ ] Quality scoring displays accurate results
- [ ] BMAD analysis shows comprehensive framework

### Constitutional AI Validation
- [ ] All user-facing responses validated
- [ ] Transparency in system limitations
- [ ] Safety checks for code recommendations
- [ ] Helpful and accurate guidance provided

### Performance Standards
- [ ] Extension activation time < 2 seconds
- [ ] API calls timeout appropriately
- [ ] UI remains responsive during operations
- [ ] Memory usage within VS Code guidelines

---

**Remember**: This extension is a thin client. OneAgent's core value remains in its standalone professional capabilities.
