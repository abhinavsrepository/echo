import { Pinecone } from '@pinecone-database/pinecone';
import OpenAI from 'openai';
import pdf from 'pdf-parse';
import { marked } from 'marked';
import { chunkText, extractTextFromMarkdown } from '@echo/shared/utils';
import AWS from 'aws-sdk';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
const s3 = new AWS.S3();

interface IngestJobData {
  documentId: string;
  tenantId: string;
  s3Key: string;
  type: 'markdown' | 'pdf' | 'text';
}

export async function ingestDocument(data: IngestJobData): Promise<void> {
  console.log(`[IngestJob] Processing document ${data.documentId}`);

  try {
    const content = await fetchDocumentFromS3(data.s3Key);

    let text: string;
    if (data.type === 'pdf') {
      const pdfData = await pdf(Buffer.from(content));
      text = pdfData.text;
    } else if (data.type === 'markdown') {
      text = extractTextFromMarkdown(content.toString());
    } else {
      text = content.toString();
    }

    const chunks = chunkText(text, 1000, 200);
    console.log(`[IngestJob] Created ${chunks.length} chunks`);

    const embeddings = await generateEmbeddings(chunks.map((c) => c.content));
    console.log(`[IngestJob] Generated ${embeddings.length} embeddings`);

    const vectors = chunks.map((chunk, index) => ({
      id: `${data.documentId}_chunk_${index}`,
      values: embeddings[index],
      metadata: {
        documentId: data.documentId,
        tenantId: data.tenantId,
        content: chunk.content,
        chunkIndex: chunk.metadata.chunkIndex,
        totalChunks: chunk.metadata.totalChunks,
      },
    }));

    const index = pinecone.index(process.env.PINECONE_INDEX || 'echo-knowledge');
    await index.namespace(data.tenantId).upsert(vectors);

    console.log(`[IngestJob] Upserted ${vectors.length} vectors to Pinecone`);
  } catch (error) {
    console.error(`[IngestJob] Error:`, error);
    throw error;
  }
}

async function fetchDocumentFromS3(key: string): Promise<Buffer> {
  const result = await s3
    .getObject({
      Bucket: process.env.S3_DOCUMENTS_BUCKET!,
      Key: key,
    })
    .promise();

  return result.Body as Buffer;
}

async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: texts,
  });

  return response.data.map((d) => d.embedding);
}
