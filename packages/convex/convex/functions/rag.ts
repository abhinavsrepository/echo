import { action, mutation, query } from '../_generated/server';
import { v } from 'convex/values';
import { PineconeClient } from '../helpers/pinecone';
import { EmbeddingGenerator } from '../helpers/embedding';
import { chunkText, extractTextFromMarkdown } from '../helpers/chunk';
import type { KnowledgeQuery } from '@echo/shared/types';

export const queryVector = action({
  args: {
    tenantId: v.id('tenants'),
    query: v.string(),
    topK: v.optional(v.number()),
    threshold: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const pinecone = new PineconeClient();

    const queryParams: KnowledgeQuery = {
      query: args.query,
      tenantId: args.tenantId,
      topK: args.topK || 5,
      threshold: args.threshold || 0.7,
    };

    const results = await pinecone.query(queryParams);
    return results;
  },
});

export const ingestDocument = action({
  args: {
    documentId: v.id('documents'),
  },
  handler: async (ctx, args) => {
    const document = await ctx.runQuery('documents:get', {
      documentId: args.documentId,
    });

    if (!document) throw new Error('Document not found');

    await ctx.runMutation('documents:updateStatus', {
      documentId: args.documentId,
      status: 'processing',
    });

    try {
      const text = await fetchDocumentContent(document.url, document.type);

      const chunks = chunkText(text);

      const embedder = new EmbeddingGenerator();
      const embeddings = await embedder.generateEmbeddings(
        chunks.map((c) => c.content)
      );

      const vectors = chunks.map((chunk, index) => ({
        id: `${document._id}_chunk_${index}`,
        values: embeddings[index],
        metadata: {
          documentId: document._id,
          tenantId: document.tenantId,
          content: chunk.content,
          chunkIndex: chunk.metadata.chunkIndex,
          totalChunks: chunk.metadata.totalChunks,
          documentName: document.name,
        },
      }));

      const pinecone = new PineconeClient();
      await pinecone.upsertVectors(document.tenantId, vectors);

      await ctx.runMutation('documents:updateStatus', {
        documentId: args.documentId,
        status: 'indexed',
        chunkCount: chunks.length,
        vectorCount: vectors.length,
      });

      return { success: true, chunks: chunks.length };
    } catch (error) {
      await ctx.runMutation('documents:updateStatus', {
        documentId: args.documentId,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      throw error;
    }
  },
});

export const reindex = action({
  args: {
    tenantId: v.id('tenants'),
  },
  handler: async (ctx, args) => {
    const documents = await ctx.runQuery('documents:listByTenant', {
      tenantId: args.tenantId,
    });

    const pinecone = new PineconeClient();
    await pinecone.deleteNamespace(args.tenantId);

    for (const doc of documents) {
      await ctx.scheduler.runAfter(0, 'functions/rag:ingestDocument', {
        documentId: doc._id,
      });
    }

    return { success: true, documentsQueued: documents.length };
  },
});

async function fetchDocumentContent(url: string, type: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch document: ${response.statusText}`);
  }

  const content = await response.text();

  if (type === 'markdown') {
    return extractTextFromMarkdown(content);
  }

  if (type === 'pdf') {
    return content;
  }

  return content;
}
