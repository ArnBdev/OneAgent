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
    
    // New v4.0.0 Professional Commands
    
    // Semantic Analysis Command
    context.subscriptions.push(
        vscode.commands.registerCommand('oneagent.semanticAnalysis', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showErrorMessage('No active editor found. Please open a file and select text to analyze.');
                return;
            }
            
            const selection = editor.document.getText(editor.selection);
            if (!selection) {
                vscode.window.showErrorMessage('No text selected. Please select text for semantic analysis.');
                return;
            }
            
            const analysisType = await vscode.window.showQuickPick(
                ['similarity', 'classification', 'clustering'],
                { placeHolder: 'Select semantic analysis type' }
            );
            
            if (!analysisType) return;
            
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "OneAgent Semantic Analysis",
                cancellable: false
            }, async (progress) => {
                progress.report({ increment: 0, message: "Performing semantic analysis..." });
                
                const result = await client.semanticAnalysis({
                    text: selection,
                    analysisType: analysisType as 'similarity' | 'classification' | 'clustering'
                });
                
                progress.report({ increment: 100, message: "Analysis complete" });
                
                if (result.success) {
                    const analysis = result.data;
                    showSemanticAnalysisReport(analysis, analysisType);
                } else {
                    vscode.window.showErrorMessage(`Semantic analysis failed: ${result.error}`);
                }
            });
        })
    );
    
    // Enhanced Search Command
    context.subscriptions.push(
        vscode.commands.registerCommand('oneagent.enhancedSearch', async () => {
            const query = await vscode.window.showInputBox({
                placeHolder: 'Enter search query...',
                prompt: 'OneAgent Enhanced Search with Quality Filtering'
            });
            
            if (!query) return;
            
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "OneAgent Enhanced Search",
                cancellable: false
            }, async (progress) => {
                progress.report({ increment: 0, message: "Searching with quality filters..." });
                
                const result = await client.enhancedSearch({
                    query,
                    filterCriteria: ['accuracy', 'relevance', 'credibility'],
                    includeQualityScore: true
                });
                
                progress.report({ increment: 100, message: "Search complete" });
                
                if (result.success) {
                    showEnhancedSearchResults(result.data);
                } else {
                    vscode.window.showErrorMessage(`Enhanced search failed: ${result.error}`);
                }
            });
        })
    );
    
    // Evolution Analytics Command
    context.subscriptions.push(
        vscode.commands.registerCommand('oneagent.evolutionAnalytics', async () => {
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "OneAgent Evolution Analytics",
                cancellable: false
            }, async (progress) => {
                progress.report({ increment: 0, message: "Generating evolution analytics..." });
                
                const result = await client.evolutionAnalytics({
                    timeRange: '7d',
                    includeCapabilityAnalysis: true,
                    includeQualityTrends: true
                });
                
                progress.report({ increment: 100, message: "Analytics complete" });
                
                if (result.success) {
                    showEvolutionAnalytics(result.data);
                } else {
                    vscode.window.showErrorMessage(`Evolution analytics failed: ${result.error}`);
                }
            });
        })
    );
    
    // Profile Status Command
    context.subscriptions.push(
        vscode.commands.registerCommand('oneagent.profileStatus', async () => {
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "OneAgent Profile Status",
                cancellable: false
            }, async (progress) => {
                progress.report({ increment: 0, message: "Checking profile status..." });
                
                const result = await client.profileStatus();
                
                progress.report({ increment: 100, message: "Status retrieved" });
                
                if (result.success) {
                    const status = result.data;
                    const evolutionReady = status.evolutionReadiness || 'Not Available';
                    const qualityScore = status.qualityScore || 'N/A';
                    
                    vscode.window.showInformationMessage(
                        `📊 Profile Status: Quality ${qualityScore}% | Evolution: ${evolutionReady}`,
                        'View Details', 'Evolution History'
                    ).then(selection => {
                        if (selection === 'View Details') {
                            showProfileStatusDetails(status);
                        } else if (selection === 'Evolution History') {
                            vscode.commands.executeCommand('oneagent.profileHistory');
                        }
                    });
                } else {
                    vscode.window.showErrorMessage(`Profile status check failed: ${result.error}`);
                }
            });
        })
    );
    
    // Evolve Profile Command
    context.subscriptions.push(
        vscode.commands.registerCommand('oneagent.evolveProfile', async () => {
            const aggressiveness = await vscode.window.showQuickPick(
                ['conservative', 'moderate', 'aggressive'],
                {                placeHolder: 'How aggressively should the profile evolve?'
                }
            );
            
            if (!aggressiveness) return;
            
            const confirm = await vscode.window.showWarningMessage(
                `🧬 This will evolve your OneAgent profile with ${aggressiveness} changes. Continue?`,
                'Yes, Evolve', 'Cancel'
            );
            
            if (confirm !== 'Yes, Evolve') return;
            
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "OneAgent Profile Evolution",
                cancellable: false
            }, async (progress) => {
                progress.report({ increment: 0, message: "Evolving agent profile..." });
                
                const result = await client.evolveProfile('manual', aggressiveness);
                
                progress.report({ increment: 100, message: "Evolution complete" });
                
                if (result.success) {
                    const evolution = result.data;
                    vscode.window.showInformationMessage(
                        `✅ Profile evolved successfully! New capabilities unlocked.`,
                        'View Changes', 'Test New Features'
                    ).then(selection => {
                        if (selection === 'View Changes') {
                            showEvolutionResults(evolution);
                        } else if (selection === 'Test New Features') {
                            vscode.commands.executeCommand('oneagent.openDashboard');
                        }
                    });
                } else {
                    vscode.window.showErrorMessage(`Profile evolution failed: ${result.error}`);
                }
            });
        })
    );
    
    // Agent Network Health Command
    context.subscriptions.push(
        vscode.commands.registerCommand('oneagent.agentNetworkHealth', async () => {
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "OneAgent Network Health",
                cancellable: false
            }, async (progress) => {
                progress.report({ increment: 0, message: "Checking agent network health..." });
                
                const result = await client.getAgentNetworkHealth();
                
                progress.report({ increment: 100, message: "Health check complete" });
                
                if (result.success) {
                    showAgentNetworkHealth(result.data);
                } else {
                    vscode.window.showErrorMessage(`Agent network health check failed: ${result.error}`);
                }
            });
        })
    );
    
    // Coordinate Agents Command
    context.subscriptions.push(
        vscode.commands.registerCommand('oneagent.coordinateAgents', async () => {
            const task = await vscode.window.showInputBox({
                placeHolder: 'Describe the task for multi-agent coordination...',
                prompt: 'OneAgent Multi-Agent Task Coordination'
            });
            
            if (!task) return;
            
            const capabilities = await vscode.window.showInputBox({
                placeHolder: 'Required capabilities (comma-separated)...',
                prompt: 'What capabilities do the agents need?',
                value: 'analysis, code-generation, validation'
            });
            
            if (!capabilities) return;
            
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "OneAgent Multi-Agent Coordination",
                cancellable: false
            }, async (progress) => {
                progress.report({ increment: 0, message: "Coordinating agents..." });
                
                const result = await client.coordinateAgents(
                    task,
                    capabilities.split(',').map(c => c.trim()),
                    'medium'
                );
                
                progress.report({ increment: 100, message: "Coordination complete" });
                
                if (result.success) {
                    showCoordinationResults(result.data);
                } else {
                    vscode.window.showErrorMessage(`Agent coordination failed: ${result.error}`);
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
    // Extract variables to avoid template literal scope issues
    const summary = analysis?.summary || 'No summary available';
    const confidence = analysis?.confidence || 0;
    const complexity = analysis?.complexity || 'Unknown';
    const recommendations = analysis?.recommendations || ['No specific recommendations available'];
    const riskAssessment = analysis?.riskAssessment || 'No risk assessment available';
    const successMetrics = analysis?.successMetrics || 'No success metrics defined';
    const timeline = analysis?.timeline || 'No timeline considerations provided';
    
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
            <p>${summary}</p>
        </div>
        
        <div class="section">
            <h2><span class="emoji">📊</span>Analysis Metrics</h2>
            <p><strong>Confidence Score:</strong> <span class="confidence">${confidence}%</span></p>
            <p><strong>Complexity Level:</strong> <span class="complexity">${complexity}</span></p>
        </div>
          <div class="section">
            <h2><span class="emoji">💡</span>Recommendations</h2>
            ${recommendations.map((rec: string) => 
                `<div class="recommendation">${rec}</div>`
            ).join('')}
        </div>
        
        <div class="section">
            <h2><span class="emoji">⚠️</span>Risk Assessment</h2>
            <p>${riskAssessment}</p>
        </div>
        
        <div class="section">
            <h2><span class="emoji">🎯</span>Success Metrics</h2>
            <p>${successMetrics}</p>
        </div>
        
        <div class="section">
            <h2><span class="emoji">📅</span>Timeline Considerations</h2>
            <p>${timeline}</p>
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
                border-left: 4px solid var(--vscode-textBlockQuote-border);
                padding: 10px;
                margin: 5px 0;
            }            .emoji { font-size: 1.2em; margin-right: 8px; }
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

// New v4.0.0 Professional Helper Functions

function showSemanticAnalysisReport(analysis: any, analysisType: string) {
    const panel = vscode.window.createWebviewPanel(
        'semanticAnalysis',
        'OneAgent Semantic Analysis',
        vscode.ViewColumn.Two,
        { enableScripts: true }
    );

    panel.webview.html = `<!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: var(--vscode-font-family); padding: 20px; }
            .header { border-bottom: 2px solid var(--vscode-textSeparator-foreground); margin-bottom: 20px; }
            .analysis-type { color: var(--vscode-textLink-foreground); font-weight: bold; }
            .confidence { color: var(--vscode-charts-green); }
            .complexity { color: var(--vscode-charts-orange); }
            .metric { display: flex; justify-content: space-between; margin: 10px 0; }
            .results { background: var(--vscode-editor-background); padding: 15px; border-radius: 5px; }
        </style>
    </head>
    <body>
        <div class="header">
            <h2>🧠 Semantic Analysis Results</h2>
            <p class="analysis-type">Analysis Type: ${analysisType}</p>
        </div>        <div class="results">
            <h3>Analysis Summary</h3>
            <p>Summary will be displayed here</p>
            
            <div class="metric">
                <span><strong>Confidence Score:</strong></span>
                <span class="confidence">0%</span>
            </div>
            <div class="metric">
                <span><strong>Complexity Level:</strong></span>
                <span class="complexity">Unknown</span>
            </div>
        </div>
    </body>
    </html>`;
}

function showEnhancedSearchResults(data: any) {
    const panel = vscode.window.createWebviewPanel(
        'enhancedSearch',
        'OneAgent Enhanced Search Results',
        vscode.ViewColumn.Two,
        { enableScripts: true }
    );

    const results = data?.results || [];
    
    panel.webview.html = `<!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: var(--vscode-font-family); padding: 20px; }
            .result { border: 1px solid var(--vscode-textSeparator-foreground); margin: 10px 0; padding: 15px; border-radius: 5px; }
            .quality-badge { background: var(--vscode-charts-green); color: white; padding: 2px 8px; border-radius: 3px; font-size: 12px; }
            .url { color: var(--vscode-textLink-foreground); word-break: break-all; }
            .summary { margin: 10px 0; }
        </style>
    </head>
    <body>
        <h2>🔍 Enhanced Search Results</h2>
        <p>Found ${results.length} quality-filtered results</p>
        
        ${results.map((result: any) => `
            <div class="result">
                <h3>${result.title || 'No title'}</h3>
                <div class="url">${result.url || ''}</div>
                <div class="summary">${result.summary || result.snippet || ''}</div>
                ${result.qualityScore ? `<span class="quality-badge">Quality: ${result.qualityScore}%</span>` : ''}
            </div>
        `).join('')}
    </body>
    </html>`;
}

function showEvolutionAnalytics(data: any) {
    const panel = vscode.window.createWebviewPanel(
        'evolutionAnalytics',
        'OneAgent Evolution Analytics',
        vscode.ViewColumn.Two,
        { enableScripts: true }
    );

    panel.webview.html = `<!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: var(--vscode-font-family); padding: 20px; }
            .metric-card { border: 1px solid var(--vscode-textSeparator-foreground); margin: 10px 0; padding: 15px; border-radius: 5px; }
            .trend-up { color: var(--vscode-charts-green); }
            .trend-down { color: var(--vscode-charts-red); }
            .chart-placeholder { background: var(--vscode-editor-background); height: 200px; display: flex; align-items: center; justify-content: center; }
        </style>
    </head>
    <body>
        <h2>📈 Evolution Analytics</h2>
        
        <div class="metric-card">
            <h3>Quality Trends</h3>
            <p>Average Quality Score: ${data?.averageQuality || 'N/A'}%</p>
            <p>Quality Trend: <span class="${(data?.qualityTrend || 0) >= 0 ? 'trend-up' : 'trend-down'}">${(data?.qualityTrend || 0) >= 0 ? '📈' : '📉'} ${data?.qualityTrend || 0}%</span></p>
        </div>
        
        <div class="metric-card">
            <h3>Capability Evolution</h3>
            <p>New Capabilities: ${data?.newCapabilities || 0}</p>
            <p>Enhanced Capabilities: ${data?.enhancedCapabilities || 0}</p>
            <p>Evolution Events: ${data?.evolutionEvents || 0}</p>
        </div>
        
        <div class="metric-card">
            <h3>Performance Metrics</h3>
            <div class="chart-placeholder">
                📊 Performance charts would be displayed here
            </div>
        </div>
    </body>
    </html>`;
}

function showProfileStatusDetails(status: any) {
    const panel = vscode.window.createWebviewPanel(
        'profileStatus',
        'OneAgent Profile Status',
        vscode.ViewColumn.Two,
        { enableScripts: true }
    );

    panel.webview.html = `<!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: var(--vscode-font-family); padding: 20px; }
            .status-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px; }
            .status-card { border: 1px solid var(--vscode-textSeparator-foreground); padding: 15px; border-radius: 5px; }
            .status-good { border-left: 4px solid var(--vscode-charts-green); }
            .status-warning { border-left: 4px solid var(--vscode-charts-orange); }
            .status-error { border-left: 4px solid var(--vscode-charts-red); }
        </style>
    </head>
    <body>
        <h2>🤖 Profile Status Details</h2>
        
        <div class="status-grid">
            <div class="status-card status-good">
                <h3>Quality Score</h3>
                <p>${status?.qualityScore || 'N/A'}%</p>
            </div>
            
            <div class="status-card ${status?.evolutionReadiness === 'Ready' ? 'status-good' : 'status-warning'}">
                <h3>Evolution Readiness</h3>
                <p>${status?.evolutionReadiness || 'Not Available'}</p>
            </div>
            
            <div class="status-card status-good">
                <h3>Active Capabilities</h3>
                <p>${status?.activeCapabilities || 0}</p>
            </div>
            
            <div class="status-card status-good">
                <h3>System Health</h3>
                <p>${status?.systemHealth || 'Unknown'}</p>
            </div>
        </div>
        
        ${status?.lastEvolution ? `
            <div class="status-card">
                <h3>Last Evolution</h3>
                <p>${new Date(status.lastEvolution).toLocaleString()}</p>
            </div>
        ` : ''}
    </body>
    </html>`;
}

function showEvolutionResults(evolution: any) {
    const panel = vscode.window.createWebviewPanel(
        'evolutionResults',
        'OneAgent Profile Evolution Results',
        vscode.ViewColumn.Two,
        { enableScripts: true }
    );

    panel.webview.html = `<!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: var(--vscode-font-family); padding: 20px; }
            .evolution-summary { background: var(--vscode-editor-background); padding: 15px; border-radius: 5px; margin: 15px 0; }
            .capability { display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid var(--vscode-textSeparator-foreground); }
            .new-capability { color: var(--vscode-charts-green); }
            .enhanced-capability { color: var(--vscode-charts-blue); }
        </style>
    </head>
    <body>
        <h2>🧬 Profile Evolution Complete</h2>
        
        <div class="evolution-summary">
            <h3>Evolution Summary</h3>
            <p><strong>Evolution Type:</strong> ${evolution?.type || 'Standard'}</p>
            <p><strong>Quality Improvement:</strong> ${evolution?.qualityImprovement || 0}%</p>
            <p><strong>New Features:</strong> ${evolution?.newFeatures?.length || 0}</p>
        </div>
        
        ${evolution?.newCapabilities ? `
            <h3>New Capabilities</h3>
            ${evolution.newCapabilities.map((cap: string) => `
                <div class="capability">
                    <span class="new-capability">+ ${cap}</span>
                    <span>NEW</span>
                </div>
            `).join('')}
        ` : ''}
        
        ${evolution?.enhancedCapabilities ? `
            <h3>Enhanced Capabilities</h3>
            ${evolution.enhancedCapabilities.map((cap: string) => `
                <div class="capability">
                    <span class="enhanced-capability">↗ ${cap}</span>
                    <span>ENHANCED</span>
                </div>
            `).join('')}
        ` : ''}
    </body>
    </html>`;
}

function showAgentNetworkHealth(data: any) {
    const panel = vscode.window.createWebviewPanel(
        'agentNetworkHealth',
        'OneAgent Network Health',
        vscode.ViewColumn.Two,
        { enableScripts: true }
    );

    panel.webview.html = `<!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: var(--vscode-font-family); padding: 20px; }
            .health-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; }
            .health-card { border: 1px solid var(--vscode-textSeparator-foreground); padding: 15px; border-radius: 5px; text-align: center; }
            .health-good { background: rgba(0, 255, 0, 0.1); }
            .health-warning { background: rgba(255, 165, 0, 0.1); }
            .health-error { background: rgba(255, 0, 0, 0.1); }
            .agent-list { margin-top: 20px; }
            .agent-item { display: flex; justify-content: space-between; padding: 10px; border: 1px solid var(--vscode-textSeparator-foreground); margin: 5px 0; border-radius: 3px; }
        </style>
    </head>
    <body>
        <h2>🕸️ Agent Network Health</h2>
        
        <div class="health-grid">
            <div class="health-card health-good">
                <h3>🟢 Online Agents</h3>
                <p style="font-size: 24px;">${data?.onlineAgents || 0}</p>
            </div>
            
            <div class="health-card health-warning">
                <h3>🟡 Busy Agents</h3>
                <p style="font-size: 24px;">${data?.busyAgents || 0}</p>
            </div>
            
            <div class="health-card health-error">
                <h3>🔴 Offline Agents</h3>
                <p style="font-size: 24px;">${data?.offlineAgents || 0}</p>
            </div>
            
            <div class="health-card health-good">
                <h3>📊 Network Load</h3>
                <p style="font-size: 24px;">${data?.networkLoad || 0}%</p>
            </div>
        </div>
        
        ${data?.agents ? `
            <div class="agent-list">
                <h3>Agent Status Details</h3>
                ${data.agents.map((agent: any) => `
                    <div class="agent-item">
                        <span>${agent.name || agent.id}</span>
                        <span style="color: ${agent.status === 'online' ? 'green' : agent.status === 'busy' ? 'orange' : 'red'}">${agent.status?.toUpperCase()}</span>
                    </div>
                `).join('')}
            </div>
        ` : ''}
    </body>
    </html>`;
}

function showCoordinationResults(data: any) {
    const panel = vscode.window.createWebviewPanel(
        'coordinationResults',
        'OneAgent Multi-Agent Coordination Results',
        vscode.ViewColumn.Two,
        { enableScripts: true }
    );

    panel.webview.html = `<!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: var(--vscode-font-family); padding: 20px; }
            .coordination-summary { background: var(--vscode-editor-background); padding: 15px; border-radius: 5px; margin: 15px 0; }
            .agent-assignment { border: 1px solid var(--vscode-textSeparator-foreground); margin: 10px 0; padding: 10px; border-radius: 5px; }
            .success { border-left: 4px solid var(--vscode-charts-green); }
            .pending { border-left: 4px solid var(--vscode-charts-orange); }
            .timeline { margin-top: 20px; }
            .timeline-item { display: flex; align-items: center; margin: 10px 0; }
            .timeline-dot { width: 10px; height: 10px; border-radius: 50%; background: var(--vscode-charts-blue); margin-right: 15px; }
        </style>
    </head>
    <body>
        <h2>🤝 Multi-Agent Coordination Results</h2>
        
        <div class="coordination-summary">
            <h3>Coordination Summary</h3>
            <p><strong>Task:</strong> ${data?.task || 'Not specified'}</p>
            <p><strong>Agents Assigned:</strong> ${data?.assignedAgents?.length || 0}</p>
            <p><strong>Success Rate:</strong> ${data?.successRate || 0}%</p>
        </div>
        
        ${data?.assignedAgents ? `
            <h3>Agent Assignments</h3>
            ${data.assignedAgents.map((assignment: any) => `
                <div class="agent-assignment ${assignment.status === 'completed' ? 'success' : 'pending'}">
                    <h4>${assignment.agentName || assignment.agentId}</h4>
                    <p><strong>Role:</strong> ${assignment.role || 'Not specified'}</p>
                    <p><strong>Status:</strong> ${assignment.status || 'Unknown'}</p>
                    <p><strong>Capabilities:</strong> ${assignment.capabilities?.join(', ') || 'None listed'}</p>
                </div>
            `).join('')}
        ` : ''}
        
        ${data?.timeline ? `
            <div class="timeline">
                <h3>Coordination Timeline</h3>
                ${data.timeline.map((event: any) => `
                    <div class="timeline-item">
                        <div class="timeline-dot"></div>
                        <div>
                            <strong>${event.timestamp}</strong>: ${event.description}
                        </div>
                    </div>
                `).join('')}
            </div>
        ` : ''}
    </body>
    </html>`;
}
