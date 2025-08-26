import { UIGeneratorAgent } from '../coreagent/agents/specialized/UIGeneratorAgent';
import { AgentConfig } from '../coreagent/agents/base/BaseAgent';
import { getModelFor } from '../coreagent/config/UnifiedModelPicker';
import * as fs from 'fs';
import * as path from 'path';

const config: AgentConfig = {
  id: 'ui-generator',
  name: 'UIGeneratorAgent',
  description: 'Generative UI agent for dashboard creation',
  capabilities: ['generate_ui'],
  memoryEnabled: true,
  aiEnabled: true,
  aiModelName: getModelFor('advanced_multimodal').name,
};

const agent = new UIGeneratorAgent(config);

const prompt = `Lag en React-komponent som heter 'OneAgentDashboard'. Den skal vise et 'OneAgent Status Dashboard' inne i et <Card>-element. Kortet skal ha en tittel 'OneAgent Status', en grønn <Badge> med teksten 'Operational', og en <Table> som viser de 3 siste oppgavene logget av MetricsService, med kolonnene 'Task ID', 'Type' og 'Latency (ms)'.`;

async function main() {
  await agent.initialize();
  const response = await agent.executeAction('generate_ui', { prompt });
  const code = response.content;

  const outDir = path.join(__dirname, '../ui/src/components');
  const outFile = path.join(outDir, 'OneAgentDashboard.tsx');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outFile, code, 'utf8');
  console.log(`Dashboard component generated at: ${outFile}`);
}

main().catch((err) => {
  console.error('Error generating dashboard:', err);
  process.exit(1);
});
