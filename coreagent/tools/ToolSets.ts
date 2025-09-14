/**
 * Canonical Tool Sets Mapping
 *
 * Single source of truth for grouping tools into logical sets for UX/toggling.
 * Do NOT duplicate this mapping elsewhere.
 */

export type ToolSet = {
  id: string;
  name: string;
  description: string;
  tools: string[];
  icon?: string;
};

export const TOOL_SETS: Record<string, ToolSet> = {
  'constitutional-ai': {
    id: 'constitutional-ai',
    name: 'Constitutional AI',
    description: 'AI validation and quality assurance tools',
    tools: ['oneagent_constitutional_validate', 'oneagent_bmad_analyze', 'oneagent_quality_score'],
    icon: 'shield-check',
  },
  'memory-context': {
    id: 'memory-context',
    name: 'Memory & Context',
    description: 'Memory management and context handling tools',
    tools: [
      'oneagent_memory_search',
      'oneagent_memory_add',
      'oneagent_memory_edit',
      'oneagent_memory_delete',
    ],
    icon: 'database',
  },
  'research-analysis': {
    id: 'research-analysis',
    name: 'Research & Analysis',
    description: 'Web search and analysis tools',
    tools: [
      'oneagent_enhanced_search',
      'oneagent_web_search',
      'oneagent_web_fetch',
      'oneagent_code_analyze',
    ],
    icon: 'search',
  },
  'system-management': {
    id: 'system-management',
    name: 'System Management',
    description: 'System health and conversation tools',
    tools: [
      'oneagent_system_health',
      'oneagent_conversation_retrieve',
      'oneagent_conversation_search',
    ],
    icon: 'settings',
  },
};

export const DEFAULT_ALWAYS_ALLOWED_TOOLS: string[] = [
  'oneagent_system_health',
  // Engine-native management tool must always be callable to recover/adjust sets
  'oneagent_toolsets_toggle',
];
