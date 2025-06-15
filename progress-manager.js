#!/usr/bin/env node
"use strict";
/**
 * OneAgent Implementation Progress Management Tool
 * Tracks project progress, updates KPIs, and manages phase transitions
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.OneAgentProgressManager = void 0;
const fs = require("fs");
const path = require("path");
class OneAgentProgressManager {
    constructor() {
        this.projectFile = path.join(__dirname, 'project-status.json');
        this.trackerFile = path.join(__dirname, 'ONEAGENT_IMPLEMENTATION_PROGRESS_TRACKER.md');
        this.initializeProject();
    }
    initializeProject() {
        if (!fs.existsSync(this.projectFile)) {
            const initialProject = {
                projectCode: 'ALITA-META-INT-2025',
                projectName: 'OneAgent ALITA + Metadata Integration',
                overallProgress: 0,
                currentPhase: 1,
                lastUpdated: new Date().toISOString(),
                nextMilestone: 'Phase 1: Enhanced Auto-Logging Infrastructure',
                criticalPath: ['Phase 1', 'Phase 2', 'Phase 3', 'Phase 4', 'Phase 5'],
                phases: [
                    {
                        phase: 1,
                        name: 'Enhanced Auto-Logging Infrastructure',
                        status: 'not_started',
                        progress: 0,
                        tasks: [
                            {
                                id: 'P1T1',
                                description: 'Create MetadataIntelligentLogger.ts',
                                status: 'not_started',
                                progress: 0,
                                estimatedEffort: '3 days',
                                dependencies: [],
                                blockers: []
                            },
                            {
                                id: 'P1T2',
                                description: 'Implement message analysis engine',
                                status: 'not_started',
                                progress: 0,
                                estimatedEffort: '2 days',
                                dependencies: ['P1T1'],
                                blockers: []
                            },
                            {
                                id: 'P1T3',
                                description: 'Integrate MCP server auto-logging',
                                status: 'not_started',
                                progress: 0,
                                estimatedEffort: '2 days',
                                dependencies: ['P1T1', 'P1T2'],
                                blockers: []
                            },
                            {
                                id: 'P1T4',
                                description: 'Performance testing and optimization',
                                status: 'not_started',
                                progress: 0,
                                estimatedEffort: '1 day',
                                dependencies: ['P1T3'],
                                blockers: []
                            }
                        ],
                        kpis: {
                            'captureRate': { target: '95%', current: '0%' },
                            'processingSpeed': { target: '<25ms', current: 'N/A' },
                            'errorRate': { target: '<0.1%', current: 'N/A' },
                            'qualityScore': { target: '>90%', current: 'N/A' },
                            'constitutionalCompliance': { target: '>90%', current: 'N/A' }
                        }
                    },
                    {
                        phase: 2,
                        name: 'User Profile System Integration',
                        status: 'not_started',
                        progress: 0,
                        tasks: [
                            {
                                id: 'P2T1',
                                description: 'Create UserProfileManager.ts',
                                status: 'not_started',
                                progress: 0,
                                estimatedEffort: '3 days',
                                dependencies: ['P1T4'],
                                blockers: ['Phase 1 not completed']
                            },
                            {
                                id: 'P2T2',
                                description: 'Implement PersonalizationEngine.ts',
                                status: 'not_started',
                                progress: 0,
                                estimatedEffort: '2 days',
                                dependencies: ['P2T1'],
                                blockers: ['Phase 1 not completed']
                            }
                        ],
                        kpis: {
                            'preferenceAccuracy': { target: '90%', current: '0%' },
                            'satisfactionImprovement': { target: 'Measurable', current: 'Baseline' },
                            'contextContinuity': { target: '100%', current: '0%' },
                            'personalizationSpeed': { target: '<30ms', current: 'N/A' },
                            'privacyCompliance': { target: '100%', current: '100%' }
                        }
                    }
                    // Additional phases would be defined here
                ]
            };
            this.saveProject(initialProject);
        }
    }
    loadProject() {
        const data = fs.readFileSync(this.projectFile, 'utf8');
        return JSON.parse(data);
    }
    saveProject(project) {
        project.lastUpdated = new Date().toISOString();
        fs.writeFileSync(this.projectFile, JSON.stringify(project, null, 2));
    }
    updateTaskProgress(taskId, progress, status) {
        const project = this.loadProject();
        for (const phase of project.phases) {
            const task = phase.tasks.find(t => t.id === taskId);
            if (task) {
                task.progress = Math.max(0, Math.min(100, progress));
                if (status)
                    task.status = status;
                if (progress === 100) {
                    task.status = 'completed';
                    task.completedDate = new Date().toISOString();
                }
                // Update phase progress
                const totalTasks = phase.tasks.length;
                const completedProgress = phase.tasks.reduce((sum, t) => sum + t.progress, 0);
                phase.progress = Math.round(completedProgress / totalTasks);
                // Update phase status
                if (phase.progress === 100) {
                    phase.status = 'completed';
                    phase.endDate = new Date().toISOString();
                }
                else if (phase.progress > 0) {
                    phase.status = 'in_progress';
                    if (!phase.startDate)
                        phase.startDate = new Date().toISOString();
                }
                break;
            }
        }
        // Update overall project progress
        const totalPhases = project.phases.length;
        const overallProgress = project.phases.reduce((sum, p) => sum + p.progress, 0);
        project.overallProgress = Math.round(overallProgress / totalPhases);
        this.saveProject(project);
        this.updateTrackerDocument(project);
    }
    updateKPI(phase, kpiName, currentValue) {
        const project = this.loadProject();
        const phaseData = project.phases.find(p => p.phase === phase);
        if (phaseData && phaseData.kpis[kpiName]) {
            phaseData.kpis[kpiName].current = currentValue;
            this.saveProject(project);
            this.updateTrackerDocument(project);
        }
    }
    addBlocker(taskId, blocker) {
        const project = this.loadProject();
        for (const phase of project.phases) {
            const task = phase.tasks.find(t => t.id === taskId);
            if (task) {
                if (!task.blockers.includes(blocker)) {
                    task.blockers.push(blocker);
                    task.status = 'blocked';
                }
                break;
            }
        }
        this.saveProject(project);
    }
    removeBlocker(taskId, blocker) {
        const project = this.loadProject();
        for (const phase of project.phases) {
            const task = phase.tasks.find(t => t.id === taskId);
            if (task) {
                task.blockers = task.blockers.filter(b => b !== blocker);
                if (task.blockers.length === 0 && task.status === 'blocked') {
                    task.status = task.progress > 0 ? 'in_progress' : 'not_started';
                }
                break;
            }
        }
        this.saveProject(project);
    }
    generateProgressReport() {
        const project = this.loadProject();
        const currentDate = new Date().toLocaleDateString();
        let report = `# OneAgent Implementation Progress Report\n`;
        report += `**Date:** ${currentDate}\n`;
        report += `**Overall Progress:** ${project.overallProgress}%\n`;
        report += `**Current Phase:** ${project.currentPhase}\n\n`;
        report += `## Phase Summary\n`;
        for (const phase of project.phases) {
            const statusIcon = this.getStatusIcon(phase.status);
            report += `**Phase ${phase.phase}:** ${phase.name} ${statusIcon} ${phase.progress}%\n`;
        }
        report += `\n## Current Phase Details\n`;
        const currentPhase = project.phases.find(p => p.phase === project.currentPhase);
        if (currentPhase) {
            report += `**${currentPhase.name}**\n\n`;
            report += `**Tasks:**\n`;
            for (const task of currentPhase.tasks) {
                const taskIcon = this.getStatusIcon(task.status);
                report += `- ${task.description} ${taskIcon} ${task.progress}%`;
                if (task.blockers.length > 0) {
                    report += ` (Blocked: ${task.blockers.join(', ')})`;
                }
                report += `\n`;
            }
            report += `\n**KPIs:**\n`;
            for (const [kpi, values] of Object.entries(currentPhase.kpis)) {
                report += `- ${kpi}: ${values.current} (Target: ${values.target})\n`;
            }
        }
        return report;
    }
    getStatusIcon(status) {
        switch (status) {
            case 'completed': return '✅';
            case 'in_progress': return '🔄';
            case 'blocked': return '🚫';
            case 'not_started': return '⏸️';
            default: return '❓';
        }
    }
    updateTrackerDocument(project) {
        // This would update the markdown tracker document with current progress
        // Implementation would parse and update the existing tracker file
        console.log(`Updated project status: ${project.overallProgress}% complete`);
    }
    // CLI interface methods
    startTask(taskId) {
        this.updateTaskProgress(taskId, 5, 'in_progress');
        console.log(`Started task ${taskId}`);
    }
    completeTask(taskId) {
        this.updateTaskProgress(taskId, 100, 'completed');
        console.log(`Completed task ${taskId}`);
    }
    showStatus() {
        const project = this.loadProject();
        console.log(this.generateProgressReport());
    }
    showPhase(phaseNumber) {
        const project = this.loadProject();
        const phase = project.phases.find(p => p.phase === phaseNumber);
        if (phase) {
            console.log(`\n=== Phase ${phase.phase}: ${phase.name} ===`);
            console.log(`Status: ${phase.status} (${phase.progress}%)`);
            console.log(`\nTasks:`);
            for (const task of phase.tasks) {
                console.log(`  ${task.id}: ${task.description} [${task.status}] ${task.progress}%`);
                if (task.blockers.length > 0) {
                    console.log(`    Blockers: ${task.blockers.join(', ')}`);
                }
            }
            console.log(`\nKPIs:`);
            for (const [kpi, values] of Object.entries(phase.kpis)) {
                console.log(`  ${kpi}: ${values.current} (Target: ${values.target})`);
            }
        }
        else {
            console.log(`Phase ${phaseNumber} not found`);
        }
    }
}
exports.OneAgentProgressManager = OneAgentProgressManager;
// CLI interface
if (require.main === module) {
    const manager = new OneAgentProgressManager();
    const args = process.argv.slice(2);
    switch (args[0]) {
        case 'status':
            manager.showStatus();
            break;
        case 'phase':
            if (args[1]) {
                manager.showPhase(parseInt(args[1]));
            }
            else {
                console.log('Usage: node progress-manager.js phase <number>');
            }
            break;
        case 'start':
            if (args[1]) {
                manager.startTask(args[1]);
            }
            else {
                console.log('Usage: node progress-manager.js start <taskId>');
            }
            break;
        case 'complete':
            if (args[1]) {
                manager.completeTask(args[1]);
            }
            else {
                console.log('Usage: node progress-manager.js complete <taskId>');
            }
            break;
        case 'update':
            if (args[1] && args[2]) {
                manager.updateTaskProgress(args[1], parseInt(args[2]));
                console.log(`Updated task ${args[1]} to ${args[2]}%`);
            }
            else {
                console.log('Usage: node progress-manager.js update <taskId> <progress>');
            }
            break;
        case 'kpi':
            if (args[1] && args[2] && args[3]) {
                manager.updateKPI(parseInt(args[1]), args[2], args[3]);
                console.log(`Updated Phase ${args[1]} KPI ${args[2]} to ${args[3]}`);
            }
            else {
                console.log('Usage: node progress-manager.js kpi <phase> <kpiName> <value>');
            }
            break;
        case 'block':
            if (args[1] && args[2]) {
                manager.addBlocker(args[1], args[2]);
                console.log(`Added blocker "${args[2]}" to task ${args[1]}`);
            }
            else {
                console.log('Usage: node progress-manager.js block <taskId> <blocker>');
            }
            break;
        case 'unblock':
            if (args[1] && args[2]) {
                manager.removeBlocker(args[1], args[2]);
                console.log(`Removed blocker "${args[2]}" from task ${args[1]}`);
            }
            else {
                console.log('Usage: node progress-manager.js unblock <taskId> <blocker>');
            }
            break;
        case 'report':
            console.log(manager.generateProgressReport());
            break;
        default:
            console.log(`
OneAgent Implementation Progress Manager

Commands:
  status                     - Show overall project status
  phase <number>            - Show specific phase details  
  start <taskId>            - Start a task
  complete <taskId>         - Mark task as completed
  update <taskId> <progress> - Update task progress (0-100)
  kpi <phase> <name> <value> - Update KPI value
  block <taskId> <blocker>   - Add blocker to task
  unblock <taskId> <blocker> - Remove blocker from task
  report                     - Generate progress report

Examples:
  node progress-manager.js start P1T1
  node progress-manager.js update P1T1 50
  node progress-manager.js kpi 1 captureRate "75%"
  node progress-manager.js phase 1
      `);
    }
}
