/**
 * List Workflows Tool
 * 
 * Dette verktøyet håndterer lesing og filtrering av workflows fra lokal JSON-database.
 * Workflows lagres i data/workflows/ mappen som separate JSON-filer.
 */

import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import { Workflow, WorkflowFilter } from '../types/workflow';

/**
 * Basis mappe for workflow data
 */
const WORKFLOWS_DIR = join(process.cwd(), 'data', 'workflows');

/**
 * Laster alle workflows fra data/workflows/ mappen
 * 
 * @returns Array av alle workflows funnet i systemet
 */
export async function loadAllWorkflows(): Promise<Workflow[]> {
  try {
    // Les alle JSON-filer i workflows mappen
    const files = await readdir(WORKFLOWS_DIR);
    const workflowFiles = files.filter(file => file.endsWith('.json'));
    
    const workflows: Workflow[] = [];
    
    for (const file of workflowFiles) {
      try {
        const filePath = join(WORKFLOWS_DIR, file);
        const content = await readFile(filePath, 'utf-8');
        const workflow: Workflow = JSON.parse(content);
        
        // Konverter datoer fra strings til Date objekter
        workflow.metadata.createdAt = new Date(workflow.metadata.createdAt);
        workflow.metadata.updatedAt = new Date(workflow.metadata.updatedAt);
        if (workflow.status.startedAt) {
          workflow.status.startedAt = new Date(workflow.status.startedAt);
        }
        if (workflow.status.completedAt) {
          workflow.status.completedAt = new Date(workflow.status.completedAt);
        }
        
        workflows.push(workflow);
      } catch (error) {
        console.warn(`⚠️  Kunne ikke laste workflow fra ${file}:`, error);
      }
    }
    
    console.log(`📋 Lastet ${workflows.length} workflows fra disk`);
    return workflows;
    
  } catch (error) {
    console.error('❌ Feil ved lasting av workflows:', error);
    return [];
  }
}

/**
 * Filtrerer workflows basert på gitte kriterier
 * 
 * @param workflows - Array av workflows som skal filtreres
 * @param filter - Filterkriterier
 * @returns Filtrerte workflows
 */
export function filterWorkflows(workflows: Workflow[], filter: WorkflowFilter): Workflow[] {
  return workflows.filter(workflow => {
    // Filtrer på userId
    if (filter.userId && workflow.metadata.createdBy !== filter.userId) {
      return false;
    }
    
    // Filtrer på agentType
    if (filter.agentType && workflow.metadata.agentType !== filter.agentType) {
      return false;
    }
    
    // Filtrer på status
    if (filter.status && workflow.status.status !== filter.status) {
      return false;
    }
    
    // Filtrer på prioritet
    if (filter.priority && workflow.metadata.priority !== filter.priority) {
      return false;
    }
    
    // Filtrer på tags (må inneholde minst en av de oppgitte tags)
    if (filter.tags && filter.tags.length > 0) {
      const hasMatchingTag = filter.tags.some(tag => 
        workflow.metadata.tags.includes(tag)
      );
      if (!hasMatchingTag) {
        return false;
      }
    }
    
    // Filtrer på opprettelsesdato
    if (filter.createdAfter && workflow.metadata.createdAt < filter.createdAfter) {
      return false;
    }
    
    if (filter.createdBefore && workflow.metadata.createdAt > filter.createdBefore) {
      return false;
    }
    
    return true;
  });
}

/**
 * Hovedfunksjon for å liste workflows med filtrering
 * 
 * @param filter - Valgfrie filterkriterier
 * @returns Promise som returnerer filtrerte workflows
 */
export async function listWorkflows(filter: WorkflowFilter = {}): Promise<Workflow[]> {
  console.log(`🔍 Lister workflows med filter:`, filter);
  
  const allWorkflows = await loadAllWorkflows();
  const filteredWorkflows = filterWorkflows(allWorkflows, filter);
  
  console.log(`✅ Fant ${filteredWorkflows.length} workflows som matcher filteret`);
  return filteredWorkflows;
}

/**
 * Hjelpefunksjon for å liste workflows for en spesifikk bruker
 * 
 * @param userId - ID for brukeren
 * @returns Promise som returnerer brukerens workflows
 */
export async function listUserWorkflows(userId: string): Promise<Workflow[]> {
  return listWorkflows({ userId });
}
