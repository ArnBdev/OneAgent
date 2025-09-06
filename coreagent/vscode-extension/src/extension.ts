import * as vscode from 'vscode';
import { OneAgentClient } from './connection/oneagent-client';
import { OneAgentChatProvider } from './providers/oneagent-chat-provider';
import { OneAgentStatusBar } from './ui/status-bar';
import { registerCommands } from './commands/oneagent-commands';
import { OneAgentPanel } from './webview/oneagent-panel';

export async function activate(context: vscode.ExtensionContext) {
  console.log('OneAgent Professional extension is activating...');

  try {
    // Initialize OneAgent client
    const client = new OneAgentClient();

    // Check OneAgent availability
    const isAvailable = await client.healthCheck();
    if (!isAvailable) {
      const choice = await vscode.window.showWarningMessage(
        'OneAgent server not available. Start local MCP HTTP server now?',
        'Start Now',
        'Open Settings',
        'Dismiss',
      );
      if (choice === 'Start Now') {
        try {
          // Start via workspace npm script if available
          const task = await vscode.tasks.fetchTasks();
          const startTask = task.find((t) => t.name.includes('server:unified'));
          if (startTask) {
            vscode.tasks.executeTask(startTask);
            vscode.window.showInformationMessage('Starting OneAgent MCP HTTP server...');
          } else {
            // Fallback: run npm script
            const term = vscode.window.createTerminal({ name: 'OneAgent MCP Server' });
            term.sendText('npm run server:unified');
            term.show();
          }
        } catch (e) {
          vscode.window.showErrorMessage(
            `Failed to auto-start OneAgent server: ${e instanceof Error ? e.message : String(e)}`,
          );
        }
      } else if (choice === 'Open Settings') {
        vscode.commands.executeCommand('workbench.action.openSettings', 'oneagent');
      }
    } else {
      // Show successful connection
      vscode.window
        .showInformationMessage(
          '✅ OneAgent Professional extension connected successfully!',
          'Open Dashboard',
        )
        .then((selection) => {
          if (selection === 'Open Dashboard') {
            vscode.commands.executeCommand('oneagent.openDashboard');
          }
        });
    }

    // Register chat participant
    const chatProvider = new OneAgentChatProvider(client);
    const chatParticipant = vscode.chat.createChatParticipant(
      'oneagent',
      chatProvider.handleRequest.bind(chatProvider),
    );
    // Set chat participant properties
    chatParticipant.iconPath = new vscode.ThemeIcon('robot');
    chatParticipant.followupProvider = {
      provideFollowups: chatProvider.provideFollowups.bind(chatProvider),
    };

    // Add to disposables
    context.subscriptions.push(chatParticipant);

    // Register commands
    registerCommands(context, client);

    // Initialize status bar
    const statusBar = new OneAgentStatusBar(client);
    context.subscriptions.push(statusBar);

    // Register webview provider
    const dashboardProvider = new OneAgentPanel(context.extensionUri, client);
    context.subscriptions.push(
      vscode.window.registerWebviewViewProvider('oneagent.dashboard', dashboardProvider),
    );

    // Register configuration change handler
    context.subscriptions.push(
      vscode.workspace.onDidChangeConfiguration((event) => {
        if (event.affectsConfiguration('oneagent')) {
          client.updateConfiguration();
          statusBar.forceUpdate();

          vscode.window.showInformationMessage('OneAgent configuration updated successfully.');
        }
      }),
    );

    // Register welcome command for first-time users
    context.subscriptions.push(
      vscode.commands.registerCommand('oneagent.welcome', () => {
        showWelcomeMessage(client);
      }),
    );

    // Check if this is the first activation
    const isFirstActivation = context.globalState.get('oneagent.firstActivation', true);
    if (isFirstActivation) {
      context.globalState.update('oneagent.firstActivation', false);
      showWelcomeMessage(client);
    }

    console.log('OneAgent Professional extension activated successfully');
  } catch (error) {
    console.error('OneAgent extension activation failed:', error);
    vscode.window.showErrorMessage(
      `OneAgent extension activation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}

export function deactivate() {
  console.log('OneAgent Professional extension deactivated');
}

async function showWelcomeMessage(_client: OneAgentClient) {
  const action = await vscode.window.showInformationMessage(
    '🚀 Welcome to OneAgent Professional v4.0.0! A sophisticated AI development platform featuring Constitutional AI, BMAD Framework analysis, Evolution Analytics, Multi-Agent Coordination, and quality-first development principles.',
    'Open Dashboard',
    'View Commands',
    'Check Network Health',
    'Evolution Analytics',
  );

  switch (action) {
    case 'Open Dashboard':
      vscode.commands.executeCommand('oneagent.openDashboard');
      break;
    case 'View Commands':
      vscode.commands.executeCommand('workbench.action.showCommands', 'OneAgent');
      break;
    case 'Check Network Health':
      vscode.commands.executeCommand('oneagent.agentNetworkHealth');
      break;
    case 'Evolution Analytics':
      vscode.commands.executeCommand('oneagent.evolutionAnalytics');
      break;
  }
}
