import * as vscode from 'vscode';
import { OneAgentClient } from '../connection/oneagent-client';

export class OneAgentPanel implements vscode.WebviewViewProvider {
  public static readonly viewType = 'oneagent.dashboard';

  private _view?: vscode.WebviewView;

  constructor(
    private readonly _extensionUri: vscode.Uri,
    private client: OneAgentClient,
  ) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken,
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };

    this.updateWebview();

    // Handle messages from the webview
    webviewView.webview.onDidReceiveMessage((message) => {
      switch (message.type) {
        case 'refresh':
          this.updateWebview();
          break;
        case 'openCommand':
          vscode.commands.executeCommand(message.command);
          break;
        case 'showHealth':
          vscode.commands.executeCommand('oneagent.systemHealth');
          break;
      }
    });

    // Update every 60 seconds (non-critical timer, unref to not hold process open)
    const refreshTimer = setInterval(() => {
      if (this._view?.visible) {
        this.updateWebview();
      }
    }, 60000);
    // Prevent this timer from blocking shutdown
    if (typeof (refreshTimer as unknown as { unref?: () => void }).unref === 'function') {
      (refreshTimer as unknown as { unref: () => void }).unref();
    }
  }

  private async updateWebview() {
    if (!this._view) {
      return;
    }

    try {
      const isConnected = await this.client.healthCheck();
      let healthData: import('../connection/oneagent-client').SystemHealthResponse | undefined =
        undefined;

      if (isConnected) {
        const healthResult = await this.client.systemHealth();
        if (healthResult.success) {
          healthData = healthResult.data;
        }
      }

      this._view.webview.html = this.getWebviewContent(isConnected, healthData);
    } catch (error) {
      console.error('Error updating OneAgent dashboard:', error);
      this._view.webview.html = this.getErrorWebviewContent(error);
    }
  }

  private getWebviewContent(
    isConnected: boolean,
    healthData: import('../connection/oneagent-client').SystemHealthResponse | undefined,
  ): string {
    const config = this.client.getConfiguration();

    if (!isConnected) {
      return this.getOfflineWebviewContent(config);
    }
    const hd = (healthData as Record<string, unknown>) || {};
    const metrics = (hd.metrics as Record<string, unknown>) || {};
    const components =
      (hd.components as Record<string, { status?: string }>) ||
      ({} as Record<string, { status?: string }>);
    const capabilities = Array.isArray(hd.capabilities) ? (hd.capabilities as string[]) : [];

    const version = typeof hd.version === 'string' ? hd.version : '1.0.0';
    const qualityScore = typeof metrics.qualityScore === 'number' ? metrics.qualityScore : 0;
    const totalOperations =
      typeof metrics.totalOperations === 'number' ? metrics.totalOperations : 0;
    const averageLatency = typeof metrics.averageLatency === 'number' ? metrics.averageLatency : 0;
    const errorRate = typeof metrics.errorRate === 'number' ? metrics.errorRate : 0;

    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>OneAgent Dashboard</title>
            <style>
                body {
                    font-family: var(--vscode-font-family);
                    font-size: var(--vscode-font-size);
                    color: var(--vscode-foreground);
                    background: var(--vscode-editor-background);
                    margin: 0;
                    padding: 15px;
                    line-height: 1.5;
                }
                
                .header {
                    text-align: center;
                    margin-bottom: 20px;
                    padding-bottom: 15px;
                    border-bottom: 1px solid var(--vscode-panel-border);
                }
                
                .status-indicator {
                    display: inline-block;
                    width: 12px;
                    height: 12px;
                    border-radius: 50%;
                    margin-right: 8px;
                }
                
                .status-online { background-color: var(--vscode-terminal-ansiGreen); }
                .status-offline { background-color: var(--vscode-terminal-ansiRed); }
                .status-warning { background-color: var(--vscode-terminal-ansiYellow); }
                
                .metric-card {
                    background: var(--vscode-textCodeBlock-background);
                    border: 1px solid var(--vscode-panel-border);
                    border-radius: 6px;
                    padding: 12px;
                    margin-bottom: 10px;
                }
                
                .metric-value {
                    font-size: 1.5em;
                    font-weight: bold;
                    color: var(--vscode-textLink-foreground);
                }
                
                .metric-label {
                    font-size: 0.9em;
                    color: var(--vscode-descriptionForeground);
                    margin-top: 4px;
                }
                
                .component {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 8px 0;
                    border-bottom: 1px solid var(--vscode-widget-border);
                }
                
                .component:last-child {
                    border-bottom: none;
                }
                
                .component-name {
                    font-weight: 500;
                }
                
                .component-status {
                    padding: 2px 8px;
                    border-radius: 12px;
                    font-size: 0.8em;
                    background: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                }
                
                .capability {
                    display: inline-block;
                    background: var(--vscode-badge-background);
                    color: var(--vscode-badge-foreground);
                    padding: 4px 8px;
                    border-radius: 12px;
                    font-size: 0.8em;
                    margin: 2px;
                }
                
                .action-button {
                    background: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    padding: 8px 16px;
                    border-radius: 4px;
                    cursor: pointer;
                    margin: 4px;
                    font-size: 0.9em;
                }
                
                .action-button:hover {
                    background: var(--vscode-button-hoverBackground);
                }
                
                .section {
                    margin-bottom: 20px;
                }
                
                .section-title {
                    font-size: 1.1em;
                    font-weight: bold;
                    margin-bottom: 10px;
                    color: var(--vscode-textLink-foreground);
                }
                
                .config-item {
                    display: flex;
                    justify-content: space-between;
                    padding: 4px 0;
                }
                
                .version {
                    font-size: 0.8em;
                    color: var(--vscode-descriptionForeground);
                    text-align: center;
                    margin-top: 20px;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h2>
                    <span class="status-indicator status-online"></span>
                    OneAgent Professional
                </h2>
                <div class="version">Version ${version}</div>
            </div>
            
            <div class="section">
                <div class="section-title">📊 Performance Metrics</div>
                <div class="metric-card">
                    <div class="metric-value">${Math.round(qualityScore)}%</div>
                    <div class="metric-label">Quality Score</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">${totalOperations}</div>
                    <div class="metric-label">Total Operations</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">${averageLatency}ms</div>
                    <div class="metric-label">Average Latency</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">${(errorRate * 100).toFixed(2)}%</div>
                    <div class="metric-label">Error Rate</div>
                </div>
            </div>
            
            <div class="section">
                <div class="section-title">🔧 Components</div>
                ${Object.entries(components)
                  .map(
                    ([name, comp]: [string, { status?: string }]) => `
                    <div class="component">
                        <span class="component-name">${this.formatComponentName(name)}</span>
                        <span class="component-status">${comp.status || 'unknown'}</span>
                    </div>
                `,
                  )
                  .join('')}
            </div>
            
            <div class="section">
                <div class="section-title">🛠️ Capabilities</div>
                <div>
                    ${capabilities.map((cap: string) => `<span class="capability">${cap}</span>`).join('')}
                </div>
            </div>
            
            <div class="section">
                <div class="section-title">⚙️ Configuration</div>
                <div class="config-item">
                    <span>Server URL:</span>
                    <span>${config.serverUrl}</span>
                </div>
                <div class="config-item">
                    <span>Constitutional AI:</span>
                    <span>${config.enableConstitutionalAI ? '✅ Enabled' : '❌ Disabled'}</span>
                </div>
                <div class="config-item">
                    <span>Quality Threshold:</span>
                    <span>${config.qualityThreshold}%</span>
                </div>
            </div>
            
            <div class="section">
                <div class="section-title">🚀 Quick Actions</div>
                <button class="action-button" onclick="sendMessage('openCommand', 'oneagent.constitutionalValidate')">
                    ⚖️ Constitutional Validate
                </button>
                <button class="action-button" onclick="sendMessage('openCommand', 'oneagent.qualityScore')">
                    📊 Quality Score
                </button>
                <button class="action-button" onclick="sendMessage('openCommand', 'oneagent.bmadAnalyze')">
                    🎯 BMAD Analysis
                </button>
                <button class="action-button" onclick="sendMessage('openCommand', 'oneagent.memorySearch')">
                    🧠 Memory Search
                </button>
                <button class="action-button" onclick="sendMessage('showHealth')">
                    ⚡ System Health
                </button>
                <button class="action-button" onclick="sendMessage('refresh')">
                    🔄 Refresh
                </button>
            </div>
            
            <script>
                const vscode = acquireVsCodeApi();
                
                function sendMessage(type, command = null) {
                    vscode.postMessage({ type, command });
                }
            </script>
        </body>
        </html>`;
  }

  private getOfflineWebviewContent(
    config:
      | { serverUrl: string; enableConstitutionalAI?: boolean; qualityThreshold?: number }
      | unknown,
  ): string {
    const cfg = (config as {
      serverUrl: string;
      enableConstitutionalAI?: boolean;
      qualityThreshold?: number;
    }) || { serverUrl: '' };
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>OneAgent Dashboard - Offline</title>
            <style>
                body {
                    font-family: var(--vscode-font-family);
                    font-size: var(--vscode-font-size);
                    color: var(--vscode-foreground);
                    background: var(--vscode-editor-background);
                    margin: 0;
                    padding: 15px;
                    line-height: 1.5;
                    text-align: center;
                }
                
                .offline-message {
                    background: var(--vscode-inputValidation-warningBackground);
                    border: 1px solid var(--vscode-inputValidation-warningBorder);
                    border-radius: 6px;
                    padding: 20px;
                    margin: 20px 0;
                }
                
                .status-indicator {
                    display: inline-block;
                    width: 12px;
                    height: 12px;
                    border-radius: 50%;
                    margin-right: 8px;
                    background-color: var(--vscode-terminal-ansiRed);
                }
                
                .config-item {
                    display: flex;
                    justify-content: space-between;
                    padding: 4px 0;
                    margin: 10px 0;
                }
                
                .action-button {
                    background: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    padding: 8px 16px;
                    border-radius: 4px;
                    cursor: pointer;
                    margin: 4px;
                }
                
                .action-button:hover {
                    background: var(--vscode-button-hoverBackground);
                }
                
                .troubleshooting {
                    text-align: left;
                    background: var(--vscode-textCodeBlock-background);
                    padding: 15px;
                    border-radius: 6px;
                    margin: 20px 0;
                }
            </style>
        </head>
        <body>
            <h2>
                <span class="status-indicator"></span>
                OneAgent Professional - Offline
            </h2>
            
            <div class="offline-message">
                <h3>⚠️ OneAgent Server Not Available</h3>
                <p>Unable to connect to OneAgent server. Please ensure OneAgent is running.</p>
            </div>
            
            <div class="config-item">
                <span><strong>Server URL:</strong></span>
                <span>${cfg.serverUrl}</span>
            </div>
            
            <div class="troubleshooting">
                <h4>🔧 Troubleshooting Steps:</h4>
                <ol>
                    <li>Ensure OneAgent MCP server is running (check .env file for port configuration)</li>
                    <li>Check that the server URL in settings is correct</li>
                    <li>Verify no firewall is blocking the connection</li>
                    <li>Try restarting the OneAgent server</li>
                </ol>
            </div>
            
            <button class="action-button" onclick="sendMessage('refresh')">
                🔄 Retry Connection
            </button>
            
            <script>
                const vscode = acquireVsCodeApi();
                
                function sendMessage(type, command = null) {
                    vscode.postMessage({ type, command });
                }
                
                // Auto-retry every 10 seconds (non-critical)
                const retryTimer = setInterval(() => {
                    sendMessage('refresh');
                }, 10000);
                if (typeof (retryTimer as any).unref === 'function') {
                    (retryTimer as any).unref();
                }
            </script>
        </body>
        </html>`;
  }

  private getErrorWebviewContent(error: unknown): string {
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>OneAgent Dashboard - Error</title>
            <style>
                body {
                    font-family: var(--vscode-font-family);
                    color: var(--vscode-foreground);
                    background: var(--vscode-editor-background);
                    padding: 15px;
                    text-align: center;
                }
                
                .error-message {
                    background: var(--vscode-inputValidation-errorBackground);
                    border: 1px solid var(--vscode-inputValidation-errorBorder);
                    border-radius: 6px;
                    padding: 20px;
                    margin: 20px 0;
                }
                
                .action-button {
                    background: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    padding: 8px 16px;
                    border-radius: 4px;
                    cursor: pointer;
                }
            </style>
        </head>
        <body>
            <h2>OneAgent Dashboard - Error</h2>
            
            <div class="error-message">
                <h3>❌ Dashboard Error</h3>
                <p>An error occurred while loading the dashboard:</p>
                <p><code>${error instanceof Error ? error.message : 'Unknown error'}</code></p>
            </div>
            
            <button class="action-button" onclick="sendMessage('refresh')">
                🔄 Retry
            </button>
            
            <script>
                const vscode = acquireVsCodeApi();
                
                function sendMessage(type) {
                    vscode.postMessage({ type });
                }
            </script>
        </body>
        </html>`;
  }

  private formatComponentName(name: string): string {
    // Convert camelCase to readable format
    return name
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  }
}
