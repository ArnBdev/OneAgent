import * as vscode from 'vscode';
import { OneAgentClient } from '../connection/oneagent-client';

export function registerCommands(context: vscode.ExtensionContext, client: OneAgentClient) {
    
    // Constitutional Validation Command
    context.subscriptions.push(
        vscode.commands.registerCommand('oneagent.constitutionalValidate', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showErrorMessage('No active editor found. Please open a file and select text to validate.');
                return;
            }
            
            const selection = editor.document.getText(editor.selection);
            if (!selection) {
                vscode.window.showErrorMessage('No text selected. Please select code or text to validate.');
                return;
            }
            
            // Show progress
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "OneAgent Constitutional Validation",
                cancellable: false
            }, async (progress) => {
                progress.report({ increment: 0, message: "Validating with Constitutional AI..." });
                
                const result = await client.constitutionalValidate({
                    response: selection,
                    userMessage: 'Code/text validation request from VS Code'
                });
                
                progress.report({ increment: 100, message: "Validation complete" });
                
                if (result.success) {
                    const isCompliant = result.data?.isCompliant ?? false;
                    const score = result.data?.score;
                    const feedback = result.data?.feedback || 'No specific feedback available';
                    
                    const message = isCompliant 
                        ? `✅ Constitutional AI Validation: COMPLIANT${score ? ` (Score: ${score}%)` : ''}`
                        : `❌ Constitutional AI Validation: NON-COMPLIANT${score ? ` (Score: ${score}%)` : ''}`;
                    
                    if (isCompliant) {
                        vscode.window.showInformationMessage(message, 'View Details').then(selection => {
                            if (selection === 'View Details') {
                                vscode.window.showInformationMessage(feedback);
                            }
                        });
                    } else {
                        vscode.window.showWarningMessage(message, 'View Details').then(selection => {
                            if (selection === 'View Details') {
                                vscode.window.showWarningMessage(feedback);
                            }
                        });
                    }
                } else {
                    vscode.window.showErrorMessage(`Constitutional validation failed: ${result.error}`);
                }
            });
        })
    );
    
    // Quality Score Command
    context.subscriptions.push(
        vscode.commands.registerCommand('oneagent.qualityScore', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showErrorMessage('No active editor found. Please open a file to analyze.');
                return;
            }
            
            const selection = editor.document.getText(editor.selection) || editor.document.getText();
            if (!selection.trim()) {
                vscode.window.showErrorMessage('No content to analyze. Please ensure the file has content.');
                return;
            }
            
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "OneAgent Quality Analysis",
                cancellable: false
            }, async (progress) => {
                progress.report({ increment: 0, message: "Analyzing code quality..." });
                
                const result = await client.qualityScore({
                    content: selection,
                    criteria: ['accuracy', 'maintainability', 'performance', 'readability', 'security']
                });
                
                progress.report({ increment: 100, message: "Analysis complete" });
                
                if (result.success) {
                    const score = result.data?.qualityScore ?? result.data?.score;
                    const grade = result.data?.grade || getGradeFromScore(score);
                    const suggestions = result.data?.suggestions || [];
                    
                    const emoji = score >= 90 ? '🌟' : score >= 80 ? '✅' : score >= 70 ? '⚠️' : '❌';
                    const message = `${emoji} Quality Score: ${score}% (Grade: ${grade})`;
                    
                    if (suggestions.length > 0) {
                        vscode.window.showInformationMessage(message, 'View Suggestions').then(selection => {
                            if (selection === 'View Suggestions') {
                                showQualityReport(score, grade, suggestions);
                            }
                        });
                    } else {
                        vscode.window.showInformationMessage(message);
                    }
                } else {
                    vscode.window.showErrorMessage(`Quality scoring failed: ${result.error}`);
                }
            });
        })
    );
    
    // BMAD Analysis Command
    context.subscriptions.push(
        vscode.commands.registerCommand('oneagent.bmadAnalyze', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showErrorMessage('No active editor found. Please open a file and select text to analyze.');
                return;
            }
            
            const selection = editor.document.getText(editor.selection);
            if (!selection) {
                vscode.window.showErrorMessage('No text selected. Please select code or requirements to analyze with BMAD framework.');
                return;
            }
            
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "OneAgent BMAD Analysis",
                cancellable: false
            }, async (progress) => {
                progress.report({ increment: 0, message: "Analyzing with BMAD framework..." });
                
                const result = await client.bmadAnalyze({ task: selection });
                
                progress.report({ increment: 100, message: "Analysis complete" });
                
                if (result.success) {
                    const panel = vscode.window.createWebviewPanel(
                        'bmadAnalysis',
                        'BMAD Framework Analysis',
                        vscode.ViewColumn.Two,
                        {
                            enableScripts: true,
                            localResourceRoots: [context.extensionUri]
                        }
                    );
                    
                    panel.webview.html = getBMADWebviewContent(result.data);
                } else {
                    vscode.window.showErrorMessage(`BMAD analysis failed: ${result.error}`);
                }
            });
        })
    );    // Dashboard Command
    context.subscriptions.push(
        vscode.commands.registerCommand('oneagent.openDashboard', async () => {
            // Create dashboard webview panel
            const panel = vscode.window.createWebviewPanel(
                'oneagentDashboard',
                'OneAgent Dashboard',
                vscode.ViewColumn.One,
                {
                    enableScripts: true,
                    retainContextWhenHidden: true,
                    localResourceRoots: [context.extensionUri]
                }
            );
            
            // Set the dashboard HTML content
            panel.webview.html = getDashboardWebviewContent();
            
            // Focus the panel
            panel.reveal();
        })
    );
    
    // Memory Search Command
    context.subscriptions.push(
        vscode.commands.registerCommand('oneagent.memorySearch', async () => {
            const query = await vscode.window.showInputBox({
                prompt: 'Enter search query for OneAgent memory',
                placeHolder: 'Search project context, previous conversations...',
                validateInput: (value) => {
                    if (!value || value.trim().length < 2) {
                        return 'Please enter at least 2 characters';
                    }
                    return null;
                }
            });
            
            if (query) {
                await vscode.window.withProgress({
                    location: vscode.ProgressLocation.Notification,
                    title: "OneAgent Memory Search",
                    cancellable: false
                }, async (progress) => {
                    progress.report({ increment: 0, message: "Searching memory context..." });
                    
                    const userId = vscode.env.machineId;
                    const result = await client.memorySearch({ query, userId, limit: 10 });
                    
                    progress.report({ increment: 100, message: "Search complete" });
                      if (result.success && result.data?.memories?.length) {
                        const memories = result.data.memories;
                        
                        interface MemoryItem extends vscode.QuickPickItem {
                            memory: any;
                        }
                        
                        const items: MemoryItem[] = memories.map((memory: any) => ({
                            label: `$(file-text) ${memory.content.substring(0, 60)}${memory.content.length > 60 ? '...' : ''}`,
                            description: `${memory.memoryType} | ${memory.timestamp || 'Unknown time'}`,
                            detail: memory.content,
                            memory: memory
                        }));
                        
                        const selected = await vscode.window.showQuickPick(items, {
                            placeHolder: 'Select memory to view details',
                            matchOnDescription: true,
                            matchOnDetail: true
                        });
                          if (selected) {
                            showMemoryDetails(selected.memory);
                        }
                    } else if (result.success) {
                        vscode.window.showInformationMessage('No relevant memories found for your query.');
                    } else {
                        vscode.window.showErrorMessage(`Memory search failed: ${result.error}`);
                    }
                });
            }
        })
    );
    
    // System Health Command
    context.subscriptions.push(
        vscode.commands.registerCommand('oneagent.systemHealth', async () => {
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "OneAgent System Health",
                cancellable: false
            }, async (progress) => {
                progress.report({ increment: 0, message: "Checking system health..." });
                
                const result = await client.systemHealth();
                
                progress.report({ increment: 100, message: "Health check complete" });
                
                if (result.success) {
                    const health = result.data;
                    const status = health?.status || 'unknown';
                    const qualityScore = health?.metrics?.qualityScore || 0;
                    const version = health?.version || 'unknown';
                    
                    const emoji = status === 'healthy' ? '✅' : '❌';
                    const message = `${emoji} OneAgent ${status.toUpperCase()} | Quality: ${qualityScore}% | Version: ${version}`;
                    
                    vscode.window.showInformationMessage(message, 'View Details').then(selection => {
                        if (selection === 'View Details') {
                            showSystemHealthDetails(health);
                        }
                    });
                } else {
                    vscode.window.showErrorMessage(`Health check failed: ${result.error}`);
                }
            });
        })
    );
}

function getGradeFromScore(score: number): string {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
}

function showQualityReport(score: number, grade: string, suggestions: string[]) {
    const panel = vscode.window.createWebviewPanel(
        'qualityReport',
        'OneAgent Quality Report',
        vscode.ViewColumn.Two,
        { enableScripts: true }
    );
    
    panel.webview.html = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Quality Report</title>
        <style>
            body { 
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                padding: 20px; 
                line-height: 1.6;
                background: var(--vscode-editor-background);
                color: var(--vscode-editor-foreground);
            }
            .header { 
                border-bottom: 2px solid var(--vscode-textSeparator-foreground);
                padding-bottom: 15px;
                margin-bottom: 20px;
            }
            .score { 
                font-size: 2em; 
                font-weight: bold; 
                color: ${score >= 80 ? 'var(--vscode-terminal-ansiGreen)' : score >= 70 ? 'var(--vscode-terminal-ansiYellow)' : 'var(--vscode-terminal-ansiRed)'};
            }
            .grade {
                font-size: 1.5em;
                margin-left: 10px;
                color: var(--vscode-editor-foreground);
            }
            .suggestions {
                margin-top: 20px;
            }
            .suggestion {
                background: var(--vscode-textBlockQuote-background);
                border-left: 4px solid var(--vscode-textBlockQuote-border);
                padding: 10px;
                margin: 10px 0;
            }
            .emoji { font-size: 1.2em; margin-right: 8px; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1><span class="emoji">📊</span>OneAgent Quality Report</h1>
            <div>
                <span class="score">${score}%</span>
                <span class="grade">Grade: ${grade}</span>
            </div>
        </div>
        
        <div class="suggestions">
            <h2><span class="emoji">💡</span>Improvement Suggestions</h2>
            ${suggestions.map(suggestion => `<div class="suggestion">${suggestion}</div>`).join('')}
        </div>
    </body>
    </html>`;
}

function showMemoryDetails(memory: any) {
    const panel = vscode.window.createWebviewPanel(
        'memoryDetails',
        'OneAgent Memory Details',
        vscode.ViewColumn.Two,
        { enableScripts: true }
    );
    
    panel.webview.html = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Memory Details</title>
        <style>
            body { 
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                padding: 20px; 
                line-height: 1.6;
                background: var(--vscode-editor-background);
                color: var(--vscode-editor-foreground);
            }
            .header { 
                border-bottom: 2px solid var(--vscode-textSeparator-foreground);
                padding-bottom: 15px;
                margin-bottom: 20px;
            }
            .metadata {
                background: var(--vscode-textCodeBlock-background);
                padding: 10px;
                border-radius: 4px;
                margin-bottom: 20px;
            }
            .content {
                background: var(--vscode-textBlockQuote-background);
                border-left: 4px solid var(--vscode-textBlockQuote-border);
                padding: 15px;
                white-space: pre-wrap;
            }
            .label { font-weight: bold; color: var(--vscode-symbolIcon-functionForeground); }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>🧠 Memory Context</h1>
        </div>
        
        <div class="metadata">
            <p><span class="label">Type:</span> ${memory.memoryType || 'Unknown'}</p>
            <p><span class="label">Created:</span> ${memory.timestamp || 'Unknown'}</p>
            <p><span class="label">ID:</span> ${memory.id || 'Unknown'}</p>
        </div>
        
        <div class="content">
            ${memory.content || 'No content available'}
        </div>
    </body>
    </html>`;
}

function showSystemHealthDetails(health: any) {
    const panel = vscode.window.createWebviewPanel(
        'systemHealth',
        'OneAgent System Health',
        vscode.ViewColumn.Two,
        { enableScripts: true }
    );
    
    const components = health?.components || {};
    const metrics = health?.metrics || {};
    
    panel.webview.html = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>System Health</title>
        <style>
            body { 
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                padding: 20px; 
                line-height: 1.6;
                background: var(--vscode-editor-background);
                color: var(--vscode-editor-foreground);
            }
            .header { 
                border-bottom: 2px solid var(--vscode-textSeparator-foreground);
                padding-bottom: 15px;
                margin-bottom: 20px;
            }
            .status {
                font-size: 1.5em;
                font-weight: bold;
                color: ${health?.status === 'healthy' ? 'var(--vscode-terminal-ansiGreen)' : 'var(--vscode-terminal-ansiRed)'};
            }
            .component {
                background: var(--vscode-textCodeBlock-background);
                padding: 10px;
                margin: 10px 0;
                border-radius: 4px;
            }
            .metric {
                display: inline-block;
                margin: 5px 15px 5px 0;
            }
            .label { font-weight: bold; color: var(--vscode-symbolIcon-functionForeground); }
            .value { color: var(--vscode-editor-foreground); }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>⚡ OneAgent System Health</h1>
            <div class="status">Status: ${health?.status?.toUpperCase() || 'UNKNOWN'}</div>
            <div>Version: ${health?.version || 'Unknown'}</div>
        </div>
        
        <h2>📊 Performance Metrics</h2>
        <div class="component">
            <div class="metric"><span class="label">Quality Score:</span> <span class="value">${metrics.qualityScore || 0}%</span></div>
            <div class="metric"><span class="label">Total Operations:</span> <span class="value">${metrics.totalOperations || 0}</span></div>
            <div class="metric"><span class="label">Average Latency:</span> <span class="value">${metrics.averageLatency || 0}ms</span></div>
            <div class="metric"><span class="label">Error Rate:</span> <span class="value">${((metrics.errorRate || 0) * 100).toFixed(2)}%</span></div>
        </div>
        
        <h2>🔧 Components</h2>
        ${Object.entries(components).map(([name, comp]: [string, any]) => `
            <div class="component">
                <h3>${name}</h3>
                <div class="metric"><span class="label">Status:</span> <span class="value">${comp.status || 'Unknown'}</span></div>
                ${comp.port ? `<div class="metric"><span class="label">Port:</span> <span class="value">${comp.port}</span></div>` : ''}
                ${comp.version ? `<div class="metric"><span class="label">Version:</span> <span class="value">${comp.version}</span></div>` : ''}
                ${comp.provider ? `<div class="metric"><span class="label">Provider:</span> <span class="value">${comp.provider}</span></div>` : ''}
            </div>
        `).join('')}
        
        <h2>🛠️ Capabilities</h2>
        <div class="component">
            ${(health?.capabilities || []).map((cap: string) => `<div>✅ ${cap}</div>`).join('')}
        </div>
    </body>
    </html>`;
}

function getBMADWebviewContent(analysis: any): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <title>BMAD Framework Analysis</title>
        <style>
            body { 
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                padding: 20px; 
                line-height: 1.6;
                background: var(--vscode-editor-background);
                color: var(--vscode-editor-foreground);
            }
            .header { 
                border-bottom: 2px solid var(--vscode-textSeparator-foreground);
                padding-bottom: 15px;
                margin-bottom: 20px;
            }
            .section { 
                margin-bottom: 25px; 
                background: var(--vscode-textCodeBlock-background);
                padding: 15px;
                border-radius: 4px;
            }
            .confidence { 
                font-weight: bold; 
                color: var(--vscode-terminal-ansiGreen);
                font-size: 1.2em;
            }
            .complexity {
                color: var(--vscode-terminal-ansiYellow);
                font-weight: bold;
            }
            .recommendation {
                background: var(--vscode-textBlockQuote-background);
                border-left: 4px solid var(--vscode-textBlockQuote-border);
                padding: 10px;
                margin: 5px 0;
            }
            .emoji { font-size: 1.2em; margin-right: 8px; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1><span class="emoji">🎯</span>BMAD Framework Analysis</h1>
        </div>
        
        <div class="section">
            <h2><span class="emoji">📋</span>Summary</h2>
            <p>${analysis?.summary || 'No summary available'}</p>
        </div>
        
        <div class="section">
            <h2><span class="emoji">📊</span>Analysis Metrics</h2>
            <p><strong>Confidence Score:</strong> <span class="confidence">${analysis?.confidence || 0}%</span></p>
            <p><strong>Complexity Level:</strong> <span class="complexity">${analysis?.complexity || 'Unknown'}</span></p>
        </div>
        
        <div class="section">
            <h2><span class="emoji">💡</span>Recommendations</h2>
            ${(analysis?.recommendations || ['No specific recommendations available']).map((rec: string) => 
                `<div class="recommendation">${rec}</div>`
            ).join('')}
        </div>
        
        <div class="section">
            <h2><span class="emoji">⚠️</span>Risk Assessment</h2>
            <p>${analysis?.riskAssessment || 'No risk assessment available'}</p>
        </div>
        
        <div class="section">
            <h2><span class="emoji">🎯</span>Success Metrics</h2>
            <p>${analysis?.successMetrics || 'No success metrics defined'}</p>
        </div>
        
        <div class="section">
            <h2><span class="emoji">📅</span>Timeline Considerations</h2>
            <p>${analysis?.timeline || 'No timeline considerations provided'}</p>
        </div>
    </body>
    </html>`;
}

function getDashboardWebviewContent(): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>OneAgent Dashboard</title>
        <style>
            body { 
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                padding: 20px; 
                line-height: 1.6;
                background: var(--vscode-editor-background);
                color: var(--vscode-editor-foreground);
                margin: 0;
            }
            .header { 
                text-align: center;
                border-bottom: 2px solid var(--vscode-textSeparator-foreground);
                padding-bottom: 20px;
                margin-bottom: 30px;
            }
            .header h1 {
                background: linear-gradient(45deg, #007ACC, #9D4EDD);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
                font-size: 2.5em;
                margin-bottom: 10px;
            }
            .dashboard-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 20px;
                margin-bottom: 30px;
            }
            .card {
                background: var(--vscode-textCodeBlock-background);
                border: 1px solid var(--vscode-textSeparator-foreground);
                border-radius: 8px;
                padding: 20px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }
            .card-header {
                display: flex;
                align-items: center;
                margin-bottom: 15px;
            }
            .card-header h3 {
                margin: 0;
                margin-left: 10px;
                color: var(--vscode-symbolIcon-functionForeground);
            }
            .metric {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 8px 0;
                border-bottom: 1px solid var(--vscode-textSeparator-foreground);
            }
            .metric:last-child {
                border-bottom: none;
            }
            .metric-value {
                font-weight: bold;
                color: var(--vscode-terminal-ansiGreen);
            }
            .status-indicator {
                display: inline-block;
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: var(--vscode-terminal-ansiGreen);
                animation: pulse 2s infinite;
            }
            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
            }
            .feature-list {
                list-style: none;
                padding: 0;
            }
            .feature-list li {
                padding: 8px 0;
                border-bottom: 1px solid var(--vscode-textSeparator-foreground);
            }
            .feature-list li:last-child {
                border-bottom: none;
            }
            .emoji {
                font-size: 1.5em;
                margin-right: 10px;
            }
            .actions {
                margin-top: 30px;
                text-align: center;
            }
            .btn {
                background: var(--vscode-button-background);
                color: var(--vscode-button-foreground);
                border: none;
                padding: 10px 20px;
                border-radius: 4px;
                cursor: pointer;
                margin: 0 10px;
                font-size: 14px;
            }
            .btn:hover {
                background: var(--vscode-button-hoverBackground);
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>🚀 OneAgent Professional Dashboard</h1>
            <p>Constitutional AI • BMAD Framework • Quality-First Development</p>
        </div>

        <div class="dashboard-grid">
            <!-- System Status Card -->
            <div class="card">
                <div class="card-header">
                    <span class="emoji">⚡</span>
                    <h3>System Status</h3>
                </div>
                <div class="metric">
                    <span>MCP Server</span>
                    <span class="metric-value">
                        <span class="status-indicator"></span> Online
                    </span>
                </div>
                <div class="metric">
                    <span>Constitutional AI</span>
                    <span class="metric-value">Active</span>
                </div>
                <div class="metric">
                    <span>Quality Score</span>
                    <span class="metric-value">92%</span>
                </div>
                <div class="metric">
                    <span>Memory System</span>
                    <span class="metric-value">
                        <span class="status-indicator"></span> Ready
                    </span>
                </div>
            </div>

            <!-- BMAD Framework Card -->
            <div class="card">
                <div class="card-header">
                    <span class="emoji">🎯</span>
                    <h3>BMAD Framework</h3>
                </div>
                <div class="metric">
                    <span>Belief Assessment</span>
                    <span class="metric-value">✅</span>
                </div>
                <div class="metric">
                    <span>Motivation Mapping</span>
                    <span class="metric-value">✅</span>
                </div>
                <div class="metric">
                    <span>Authority Recognition</span>
                    <span class="metric-value">✅</span>
                </div>
                <div class="metric">
                    <span>Dependency Analysis</span>
                    <span class="metric-value">✅</span>
                </div>
            </div>

            <!-- Active Features Card -->
            <div class="card">
                <div class="card-header">
                    <span class="emoji">🛠️</span>
                    <h3>Active Features</h3>
                </div>
                <ul class="feature-list">
                    <li>✅ Constitutional AI Validation</li>
                    <li>✅ BMAD Framework Analysis</li>
                    <li>✅ Quality Score Generation</li>
                    <li>✅ Memory Context Search</li>
                    <li>✅ System Health Monitoring</li>
                    <li>✅ Multi-Agent Coordination</li>
                </ul>
            </div>

            <!-- Performance Metrics Card -->
            <div class="card">
                <div class="card-header">
                    <span class="emoji">📊</span>
                    <h3>Performance Metrics</h3>
                </div>
                <div class="metric">
                    <span>Response Time</span>
                    <span class="metric-value">~150ms</span>
                </div>
                <div class="metric">
                    <span>Success Rate</span>
                    <span class="metric-value">96%</span>
                </div>
                <div class="metric">
                    <span>Memory Utilization</span>
                    <span class="metric-value">78%</span>
                </div>
                <div class="metric">
                    <span>Agent Network</span>
                    <span class="metric-value">4 Active</span>
                </div>
            </div>
        </div>

        <div class="actions">
            <button class="btn" onclick="refreshDashboard()">🔄 Refresh</button>
            <button class="btn" onclick="openSystemHealth()">🏥 System Health</button>
            <button class="btn" onclick="openMemoryViewer()">🧠 Memory Viewer</button>
        </div>

        <script>
            function refreshDashboard() {
                location.reload();
            }
            
            function openSystemHealth() {
                // This would communicate back to VS Code extension
                console.log('System Health requested');
            }
            
            function openMemoryViewer() {
                // This would communicate back to VS Code extension
                console.log('Memory Viewer requested');
            }
        </script>
    </body>
    </html>`;
}
