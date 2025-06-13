# OneAgent VS Code Extension Architecture

## Core Principle: Standalone System Preservation
**CRITICAL**: The VS Code extension is a thin client interface only. OneAgent MUST remain fully functional without VS Code.

## Architectural Independence Guidelines

### 1. Strict Separation of Concerns

#### OneAgent Core (Port 8083)
```
OneAgent Core System
├── Constitutional AI Engine
├── BMAD Framework Analysis
├── Memory System (Port 8000)
├── Quality Scoring Engine
├── Semantic Analysis Engine
└── Multi-Agent Coordination
```

#### VS Code Extension (Thin Client)
```
VS Code Extension
├── UI Components (Chat, Dashboard, Commands)
├── VS Code API Integration
├── HTTP Client (connects to port 8083)
└── Event Handlers
```

### 2. Communication Protocol

**OneAgent → VS Code**: OneAgent operates independently, extension connects when available
**VS Code → OneAgent**: All requests go through MCP HTTP interface (port 8083)
**No Direct Dependencies**: OneAgent core has ZERO VS Code dependencies

### 3. Forbidden Patterns

❌ **NEVER DO THESE:**
- Import VS Code APIs in OneAgent core
- Make OneAgent features depend on VS Code being installed
- Store critical data exclusively in VS Code workspace
- Create tight coupling between OneAgent and VS Code lifecycle

✅ **ALWAYS DO THESE:**
- Keep VS Code extension as pure UI layer
- Use HTTP/MCP protocol for all communication
- Maintain OneAgent's ability to run headlessly
- Test OneAgent functionality without VS Code

## Implementation Strategy

### Phase 1: Foundation (Week 1-2)

#### 1.1 Extension Scaffold
```typescript
// package.json - VS Code Extension Manifest
{
  "name": "oneagent-professional",
  "displayName": "OneAgent Professional",
  "description": "Professional AI Development Platform",
  "version": "1.0.0",
  "engines": { "vscode": "^1.60.0" },
  "categories": ["AI", "Developer Tools"],
  "contributes": {
    "commands": [
      {
        "command": "oneagent.openDashboard",
        "title": "OneAgent: Open Dashboard"
      },
      {
        "command": "oneagent.constitutionalValidate",
        "title": "OneAgent: Constitutional Validate"
      }
    ],
    "chatParticipants": [
      {
        "id": "oneagent",
        "name": "OneAgent",
        "description": "Professional AI Development Assistant"
      }
    ]
  }
}
```

#### 1.2 Connection Manager (Pure HTTP Client)
```typescript
// src/connection/oneagent-client.ts
export class OneAgentClient {
  private baseUrl = 'http://localhost:8083';
  
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }
  
  async constitutionalValidate(data: ValidationRequest): Promise<ValidationResponse> {
    const response = await fetch(`${this.baseUrl}/constitutional-validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  }
}
```

### Phase 2: Core Features (Week 3-4)

#### 2.1 Chat Integration
```typescript
// src/providers/oneagent-chat-provider.ts
export class OneAgentChatProvider implements vscode.ChatParticipantProvider {
  private client = new OneAgentClient();
  
  async provideResponse(
    request: vscode.ChatRequest,
    context: vscode.ChatContext,
    response: vscode.ChatResponseStream,
    token: vscode.CancellationToken
  ): Promise<void> {
    // Forward to OneAgent, display response
    const aiResponse = await this.client.aiAssistant({
      message: request.prompt,
      applyConstitutional: true
    });
    
    response.text(aiResponse.content);
  }
}
```

#### 2.2 Dashboard WebView
```typescript
// src/webview/oneagent-panel.ts
export class OneAgentPanel {
  private client = new OneAgentClient();
  
  async getWebviewContent(): Promise<string> {
    const health = await this.client.systemHealth();
    
    return `
    <!DOCTYPE html>
    <html>
      <body>
        <h1>OneAgent Professional Dashboard</h1>
        <div class="metrics">
          <p>Quality Score: ${health.metrics.qualityScore}%</p>
          <p>Status: ${health.status}</p>
        </div>
      </body>
    </html>`;
  }
}
```

### Phase 3: Advanced Integration (Week 5-6)

#### 3.1 Command Palette Integration
```typescript
// src/commands/oneagent-commands.ts
export function registerCommands(context: vscode.ExtensionContext) {
  const client = new OneAgentClient();
  
  context.subscriptions.push(
    vscode.commands.registerCommand('oneagent.bmadAnalyze', async () => {
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        const selection = editor.document.getText(editor.selection);
        const analysis = await client.bmadAnalyze({ task: selection });
        
        // Show results in VS Code UI
        vscode.window.showInformationMessage(
          `BMAD Analysis: ${analysis.summary}`
        );
      }
    })
  );
}
```

#### 3.2 Quality Scoring Integration
```typescript
// src/features/quality-scorer.ts
export class QualityScorer {
  private client = new OneAgentClient();
  
  async scoreSelection(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
      const content = editor.document.getText(editor.selection);
      const score = await this.client.qualityScore({
        content,
        criteria: ['accuracy', 'maintainability', 'performance']
      });
      
      // Display quality score with decorations
      this.showQualityDecorations(editor, score);
    }
  }
}
```

### Phase 4: Polish & Enhancement (Week 7-8)

#### 4.1 Status Bar Integration
```typescript
// src/ui/status-bar.ts
export class OneAgentStatusBar {
  private statusBarItem: vscode.StatusBarItem;
  private client = new OneAgentClient();
  
  async updateStatus(): Promise<void> {
    const isConnected = await this.client.healthCheck();
    
    this.statusBarItem.text = isConnected 
      ? "$(check) OneAgent Ready" 
      : "$(error) OneAgent Offline";
    
    this.statusBarItem.color = isConnected 
      ? undefined 
      : new vscode.ThemeColor('errorForeground');
  }
}
```

## Quality Assurance Standards

### Constitutional AI Compliance
- All user-facing content validated through Constitutional AI
- Transparency in limitations and capabilities
- Safety-first approach to AI recommendations

### Quality Scoring Requirements
- Minimum 80% quality score for all features
- Continuous monitoring and improvement
- User feedback integration

### Testing Strategy
```typescript
// test/integration.test.ts
describe('OneAgent Integration', () => {
  it('should work without VS Code dependency', async () => {
    // Test OneAgent core functionality independently
    const client = new OneAgentClient();
    const health = await client.systemHealth();
    expect(health.status).toBe('healthy');
  });
  
  it('should gracefully handle OneAgent offline', async () => {
    // Test extension behavior when OneAgent is unavailable
    const provider = new OneAgentChatProvider();
    // Should show appropriate error messages
  });
});
```

## Deployment Guidelines

### OneAgent First
1. Ensure OneAgent core is fully operational
2. Validate all professional tools are available
3. Confirm Constitutional AI and BMAD framework active

### Extension Second
1. Install VS Code extension only after OneAgent is ready
2. Extension should auto-detect OneAgent availability
3. Graceful degradation when OneAgent is offline

## Monitoring & Maintenance

### Health Checks
- Regular OneAgent system health validation
- Extension connection status monitoring
- Quality score tracking and alerts

### Updates
- OneAgent core updates independent of extension
- Extension updates preserve backward compatibility
- Constitutional AI validation for all changes

## Risk Mitigation

### Tight Coupling Prevention
- Regular architecture reviews
- Automated dependency analysis
- Strict interface contracts

### Feature Drift Protection
- Core feature documentation
- Extension feature boundaries
- Regular standalone operation tests

### API Lock-in Avoidance
- Standard HTTP/JSON protocols only
- No VS Code-specific data formats in OneAgent
- Portable configuration and data storage

---

**Remember**: OneAgent is a professional standalone system. The VS Code extension is merely a convenient interface, not a dependency.
