import { DevAgent, BMADPlanStatus } from '../../coreagent/agents/specialized/DevAgent';
import fs from 'fs/promises';

jest.mock('fs/promises', () => ({
  writeFile: jest.fn(),
  mkdir: jest.fn(),
  readFile: jest.fn(),
}));

const mockWriteFile = fs.writeFile as jest.Mock;
const mockMkdir = fs.mkdir as jest.Mock;
const mockReadFile = fs.readFile as jest.Mock;

beforeEach(() => {
  mockWriteFile.mockReset();
  mockMkdir.mockReset();
  mockReadFile.mockReset();
});

// Global mock for SmartGeminiClient
const mockGenerateContent = jest.fn();
jest.mock('../../coreagent/tools/SmartGeminiClient', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    generateContent: mockGenerateContent,
  })),
}));

describe('DevAgent BMAD Planning', () => {
  const analystText = 'Analyst output';
  const pmText = 'PM output';
  const architectText = 'Architect output';
  const personaYaml = 'persona: test';

  beforeEach(() => {
    jest.clearAllMocks();
    mockMkdir.mockResolvedValue(undefined);
    mockReadFile.mockResolvedValue(personaYaml);
    mockWriteFile.mockResolvedValue(undefined);
  });

  it('should run the full BMAD planning flow and write correct files', async () => {
    mockGenerateContent
      .mockResolvedValueOnce({ response: analystText, timestamp: new Date().toISOString() })
      .mockResolvedValueOnce({ response: pmText, timestamp: new Date().toISOString() })
      .mockResolvedValueOnce({ response: architectText, timestamp: new Date().toISOString() });

    const agent = new DevAgent({
      id: 'test-devagent',
      name: 'Test DevAgent',
      description: 'Test agent for BMAD planning',
      capabilities: ['planning'],
      memoryEnabled: false,
      aiEnabled: true,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (agent as any).executeBMADPlanning('Test task', 'test123');

    expect(mockMkdir).toHaveBeenCalledWith(expect.stringContaining('devagent_test123'), {
      recursive: true,
    });
    expect(mockReadFile).toHaveBeenCalledTimes(3);
    expect(mockWriteFile).toHaveBeenCalledWith(
      expect.stringContaining('brainstorming_doc.md'),
      analystText,
    );
    expect(mockWriteFile).toHaveBeenCalledWith(expect.stringContaining('feature.spec.md'), pmText);
    expect(mockWriteFile).toHaveBeenCalledWith(
      expect.stringContaining('technical_design.md'),
      architectText,
    );
  });

  it('should return correct status object after successful flow', async () => {
    mockGenerateContent
      .mockResolvedValueOnce({ response: analystText, timestamp: new Date().toISOString() })
      .mockResolvedValueOnce({ response: pmText, timestamp: new Date().toISOString() })
      .mockResolvedValueOnce({ response: architectText, timestamp: new Date().toISOString() });

    const agent = new DevAgent({
      id: 'test-devagent',
      name: 'Test DevAgent',
      description: 'Test agent for BMAD planning',
      capabilities: ['planning'],
      memoryEnabled: false,
      aiEnabled: true,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const status: BMADPlanStatus = await (agent as any).executeBMADPlanning('Test task', 'test456');

    expect(status.message).toMatch(/godkjenning/i);
    expect(status.docs.brainstorming).toMatch(/brainstorming_doc\.md$/);
    expect(status.docs.featureSpec).toMatch(/feature\.spec\.md$/);
    expect(status.docs.technicalDesign).toMatch(/technical_design\.md$/);
    expect(status.awaitingApproval).toBe(true);
  });

  it('should handle LLM failure gracefully', async () => {
    mockGenerateContent.mockRejectedValueOnce(new Error('LLM error'));

    const agent = new DevAgent({
      id: 'test-devagent',
      name: 'Test DevAgent',
      description: 'Test agent for BMAD planning',
      capabilities: ['planning'],
      memoryEnabled: false,
      aiEnabled: true,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await expect((agent as any).executeBMADPlanning('Test task', 'test789')).rejects.toThrow(
      'LLM error',
    );
  });
});
