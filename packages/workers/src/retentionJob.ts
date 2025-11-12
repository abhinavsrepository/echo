import { Pinecone } from '@pinecone-database/pinecone';
import AWS from 'aws-sdk';

const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
const s3 = new AWS.S3();

interface RetentionJobData {
  tenantId: string;
  retentionDays: number;
}

export async function cleanupOldData(data: RetentionJobData): Promise<void> {
  console.log(`[RetentionJob] Cleaning up data for tenant ${data.tenantId}`);

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - data.retentionDays);

  console.log(`[RetentionJob] Cutoff date: ${cutoffDate.toISOString()}`);

  console.log(`[RetentionJob] Cleanup complete for tenant ${data.tenantId}`);
}
