import * as vscode from 'vscode';
import { OneAgentClient } from '../connection/oneagent-client';

export class OneAgentStatusBar implements vscode.Disposable {
    private statusBarItem: vscode.StatusBarItem;
    private updateInterval: NodeJS.Timeout | undefined;
    private disposables: vscode.Disposable[] = [];
    
    constructor(private client: OneAgentClient) {
        // Create status bar item
        this.statusBarItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Right, 
            100 // Priority
        );
        
        this.statusBarItem.command = 'oneagent.systemHealth';
        this.statusBarItem.tooltip = 'Click to view OneAgent system health';
        
        // Show status bar item
        this.statusBarItem.show();
        this.disposables.push(this.statusBarItem);
        
        // Initial update
        this.updateStatus();
        
        // Set up periodic updates every 30 seconds
        this.updateInterval = setInterval(() => {
            this.updateStatus();
        }, 30000);
        
        // Listen for configuration changes
        this.disposables.push(
            vscode.workspace.onDidChangeConfiguration(event => {
                if (event.affectsConfiguration('oneagent')) {
                    this.client.updateConfiguration();
                    this.updateStatus();
                }
            })
        );
    }
    
    private async updateStatus(): Promise<void> {
        try {
            const isConnected = await this.client.healthCheck();
            
            if (isConnected) {
                // Try to get system health for more detailed status
                try {
                    const healthResult = await this.client.systemHealth();
                    if (healthResult.success) {
                        const health = healthResult.data;
                        const qualityScore = health?.metrics?.qualityScore || 0;
                        const status = health?.status || 'unknown';
                        
                        this.statusBarItem.text = `$(check) OneAgent ${Math.round(qualityScore)}%`;
                        this.statusBarItem.backgroundColor = undefined;
                        this.statusBarItem.color = undefined;
                        this.statusBarItem.tooltip = `OneAgent Professional - Status: ${status} | Quality: ${qualityScore}% | Click for details`;
                    } else {
                        // Connected but health check failed
                        this.statusBarItem.text = "$(warning) OneAgent Connected";
                        this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
                        this.statusBarItem.color = new vscode.ThemeColor('statusBarItem.warningForeground');
                        this.statusBarItem.tooltip = 'OneAgent connected but health check failed - Click for details';
                    }
                } catch (error) {
                    // Basic connection works but detailed health failed
                    this.statusBarItem.text = "$(check) OneAgent Ready";
                    this.statusBarItem.backgroundColor = undefined;
                    this.statusBarItem.color = undefined;
                    this.statusBarItem.tooltip = 'OneAgent Professional - Connected | Click for details';
                }
            } else {
                // Not connected
                this.statusBarItem.text = "$(error) OneAgent Offline";
                this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
                this.statusBarItem.color = new vscode.ThemeColor('statusBarItem.errorForeground');
                this.statusBarItem.tooltip = 'OneAgent Professional - Not available | Ensure OneAgent is running (check .env for configuration)';
            }
        } catch (error) {
            // Error during status update
            this.statusBarItem.text = "$(error) OneAgent Error";
            this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
            this.statusBarItem.color = new vscode.ThemeColor('statusBarItem.errorForeground');
            this.statusBarItem.tooltip = `OneAgent Professional - Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
            
            console.error('OneAgent status bar update error:', error);
        }
    }
    
    /**
     * Force update the status (useful after configuration changes)
     */
    public async forceUpdate(): Promise<void> {
        await this.updateStatus();
    }
    
    /**
     * Show a temporary message in the status bar
     */
    public showTemporaryMessage(message: string, durationMs: number = 3000): void {
        const originalText = this.statusBarItem.text;
        const originalTooltip = this.statusBarItem.tooltip;
        
        this.statusBarItem.text = message;
        this.statusBarItem.tooltip = 'OneAgent Professional - Temporary message';
        
        setTimeout(() => {
            this.statusBarItem.text = originalText;
            this.statusBarItem.tooltip = originalTooltip;
        }, durationMs);
    }
    
    /**
     * Dispose of the status bar and clean up resources
     */
    dispose(): void {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = undefined;
        }
        
        this.disposables.forEach(disposable => disposable.dispose());
        this.disposables = [];
    }
}
