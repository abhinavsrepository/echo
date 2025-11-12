import { Pinecone } from '@pinecone-database/pinecone';
import { config } from '../config';
import type { KnowledgeQuery, KnowledgeResult } from '@echo/shared/types';
import { EmbeddingGenerator } from './embedding';

export class PineconeClient {
  private client: Pinecone;
  private indexName: string;
  private embedder: EmbeddingGenerator;

  constructor() {
    this.client = new Pinecone({
      apiKey: config.pinecone.apiKey,
    });
    this.indexName = config.pinecone.index;
    this.embedder = new EmbeddingGenerator();
  }

  async upsertVectors(
    tenantId: string,
    vectors: Array<{
      id: string;
      values: number[];
      metadata: Record<string, unknown>;
    }>
  ): Promise<void> {
    try {
      const index = this.client.index(this.indexName);
      await index.namespace(tenantId).upsert(vectors);
    } catch (error) {
      console.error('[Pinecone] Upsert error:', error);
      throw new Error('Failed to upsert vectors');
    }
  }

  async query(query: KnowledgeQuery): Promise<KnowledgeResult[]> {
    try {
      const queryEmbedding = await this.embedder.generateEmbedding(query.query);

      const index = this.client.index(this.indexName);
      const queryResponse = await index.namespace(query.tenantId).query({
        vector: queryEmbedding,
        topK: query.topK,
        includeMetadata: true,
        filter: query.filters,
      });

      return queryResponse.matches
        .filter((match) => (match.score || 0) >= query.threshold)
        .map((match) => ({
          id: match.id,
          content: (match.metadata?.content as string) || '',
          metadata: match.metadata as Record<string, unknown>,
          score: match.score || 0,
          documentId: (match.metadata?.documentId as string) || '',
        }));
    } catch (error) {
      console.error('[Pinecone] Query error:', error);
      throw new Error('Failed to query vectors');
    }
  }

  async deleteNamespace(tenantId: string): Promise<void> {
    try {
      const index = this.client.index(this.indexName);
      await index.namespace(tenantId).deleteAll();
    } catch (error) {
      console.error('[Pinecone] Delete namespace error:', error);
      throw new Error('Failed to delete namespace');
    }
  }

  async deleteVectors(tenantId: string, ids: string[]): Promise<void> {
    try {
      const index = this.client.index(this.indexName);
      await index.namespace(tenantId).deleteMany(ids);
    } catch (error) {
      console.error('[Pinecone] Delete vectors error:', error);
      throw new Error('Failed to delete vectors');
    }
  }
}
