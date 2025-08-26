import { DevAgent, ExecutionResult } from '../../coreagent/agents/specialized/DevAgent';
import fs from 'fs/promises';
import * as path from 'path';

jest.mock('fs/promises', () => ({
  readFile: jest.fn(),
  writeFile: jest.fn(),
  mkdir: jest.fn(),
}));

const mockReadFile = fs.readFile as jest.Mock;
const mockWriteFile = fs.writeFile as jest.Mock;
const mockMkdir = fs.mkdir as jest.Mock;

// Global SmartGeminiClient mock
const mockGenerateContent = jest.fn();
jest.mock('../../coreagent/tools/SmartGeminiClient', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    generateContent: mockGenerateContent,
  })),
}));

describe('DevAgent.executeApprovedPlan', () => {
  const coderPersona = 'CODER_PERSONA';
  const qaPersona = 'QA_PERSONA';
  const tempDir = path.join('temp', 'devagent_test123');
  const codingTasks = [
    {
      file: 'user.controller.ts',
      instruction: 'Implementer createUser-funksjonen',
      code: '// user.controller.ts code',
    },
    {
      file: 'user.service.ts',
      instruction: 'Implementer userService-klassen',
      code: '// user.service.ts code',
    },
  ];
  const qaReport = 'QA-rapport: Alt ser bra ut.';

  beforeEach(() => {
    jest.clearAllMocks();
    mockMkdir.mockResolvedValue(undefined);
    mockWriteFile.mockResolvedValue(undefined);
    mockReadFile.mockImplementation((filePath: string) => {
      if (filePath.endsWith('coder.yaml')) return Promise.resolve(coderPersona);
      if (filePath.endsWith('qa.yaml')) return Promise.resolve(qaPersona);
      if (filePath.endsWith('technical_design.md')) {
        return Promise.resolve(
          codingTasks.map((t) => `Opprett filen \`${t.file}\`: ${t.instruction}`).join('\n'),
        );
      }
      // Return code for generated files
      for (const t of codingTasks) {
        if (filePath.endsWith(t.file)) return Promise.resolve(t.code);
      }
      return Promise.resolve('');
    });
  });

  it('should run the full flow and return correct ExecutionResult (happy path)', async () => {
    // Mock LLM responses for coder and QA
    mockGenerateContent
      .mockResolvedValueOnce({ response: codingTasks[0].code, timestamp: 'ts1' })
      .mockResolvedValueOnce({ response: codingTasks[1].code, timestamp: 'ts2' })
      .mockResolvedValueOnce({ response: qaReport, timestamp: 'ts3' });

    const agent = new DevAgent({
      id: 'test-devagent',
      name: 'Test DevAgent',
      description: 'Test agent for code execution',
      capabilities: ['codeGeneration'],
      memoryEnabled: false,
      aiEnabled: true,
    });
    const result: ExecutionResult = await agent.executeApprovedPlan('test123');

    expect(mockMkdir).not.toHaveBeenCalled(); // No mkdir in this flow
    expect(mockWriteFile).toHaveBeenCalledTimes(3); // 2 code files + 1 QA report
    expect(mockWriteFile).toHaveBeenCalledWith(
      path.join(tempDir, codingTasks[0].file),
      codingTasks[0].code,
    );
    expect(mockWriteFile).toHaveBeenCalledWith(
      path.join(tempDir, codingTasks[1].file),
      codingTasks[1].code,
    );
    expect(result.success).toBe(true);
    expect(result.filesCreated).toEqual([
      path.join(tempDir, codingTasks[0].file),
      path.join(tempDir, codingTasks[1].file),
    ]);
    expect(result.reviewNotes).toBe(qaReport);
  });

  it('should handle LLM failure gracefully (second coder call fails)', async () => {
    mockGenerateContent
      .mockResolvedValueOnce({ response: codingTasks[0].code, timestamp: 'ts1' })
      .mockRejectedValueOnce(new Error('LLM error'));

    const agent = new DevAgent({
      id: 'test-devagent',
      name: 'Test DevAgent',
      description: 'Test agent for code execution',
      capabilities: ['codeGeneration'],
      memoryEnabled: false,
      aiEnabled: true,
    });
    const result: ExecutionResult = await agent.executeApprovedPlan('test123');
    expect(result.success).toBe(false);
    expect(result.reviewNotes).toMatch(/Feil under kodegenerering/);
  });

  it('should handle fs.writeFile failure gracefully (first file fails)', async () => {
    mockGenerateContent
      .mockResolvedValueOnce({ response: codingTasks[0].code, timestamp: 'ts1' })
      .mockResolvedValueOnce({ response: codingTasks[1].code, timestamp: 'ts2' })
      .mockResolvedValueOnce({ response: qaReport, timestamp: 'ts3' });
    // Fail on first writeFile
    mockWriteFile.mockImplementationOnce(() => Promise.reject(new Error('FS error')));

    const agent = new DevAgent({
      id: 'test-devagent',
      name: 'Test DevAgent',
      description: 'Test agent for code execution',
      capabilities: ['codeGeneration'],
      memoryEnabled: false,
      aiEnabled: true,
    });
    const result: ExecutionResult = await agent.executeApprovedPlan('test123');
    expect(result.success).toBe(false);
    expect(result.reviewNotes).toMatch(/FS error/);
  });
});
