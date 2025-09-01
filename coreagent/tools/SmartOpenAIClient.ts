import OpenAI from 'openai';

export interface SmartOpenAIConfig {
  apiKey?: string;
  model?: string;
}

export class SmartOpenAIClient {
  private openai: OpenAI;
  private model: string;

  constructor(config: SmartOpenAIConfig = {}) {
    const apiKey = config.apiKey || process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('No OpenAI API key found. Set OPENAI_API_KEY in .env');
    this.model = config.model || 'gpt-4o';
    this.openai = new OpenAI({ apiKey });
  }

  async generateContent(prompt: string): Promise<string> {
    const response = await this.openai.chat.completions.create({
      model: this.model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 2048,
    });
    return response.choices[0]?.message?.content || '';
  }
}

export default SmartOpenAIClient;
