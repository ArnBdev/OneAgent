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

  /**
   * Minimal embedding API to integrate with EmbeddingCacheService
   */
  async generateEmbedding(
    text: string,
    options?: { model?: string; taskType?: string },
  ): Promise<{ embedding: number[] }> {
    const model = options?.model || process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small';
    const resp = await this.openai.embeddings.create({ model, input: text });
    const emb =
      (resp.data && resp.data[0] && (resp.data[0] as { embedding: number[] }).embedding) || [];
    return { embedding: emb as number[] };
  }

  async generateEmbeddingBatch(
    texts: string[],
    options?: { model?: string; taskType?: string },
  ): Promise<Array<{ embedding: number[] }>> {
    const model = options?.model || process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small';
    const resp = await this.openai.embeddings.create({ model, input: texts });
    const out: Array<{ embedding: number[] }> = [];
    const dataArr = (resp as unknown as { data?: Array<{ embedding: number[] }> }).data || [];
    for (const item of dataArr)
      out.push({ embedding: (item as { embedding: number[] }).embedding });
    return out;
  }
}

export default SmartOpenAIClient;
