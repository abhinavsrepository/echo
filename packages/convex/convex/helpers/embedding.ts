import OpenAI from 'openai';
import { config } from '../config';
import { EMBEDDINGS } from '@echo/shared/constants';

export class EmbeddingGenerator {
  private openai: OpenAI;

  constructor(apiKey?: string) {
    this.openai = new OpenAI({
      apiKey: apiKey || config.openai.apiKey,
    });
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await this.openai.embeddings.create({
        model: EMBEDDINGS.OPENAI,
        input: text,
        encoding_format: 'float',
      });

      return response.data[0].embedding;
    } catch (error) {
      console.error('[EmbeddingGenerator] Error:', error);
      throw new Error('Failed to generate embedding');
    }
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    try {
      const response = await this.openai.embeddings.create({
        model: EMBEDDINGS.OPENAI,
        input: texts,
        encoding_format: 'float',
      });

      return response.data.map((d) => d.embedding);
    } catch (error) {
      console.error('[EmbeddingGenerator] Error:', error);
      throw new Error('Failed to generate embeddings');
    }
  }
}
