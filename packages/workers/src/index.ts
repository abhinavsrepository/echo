import { Worker, Queue } from 'bullmq';
import Redis from 'ioredis';
import { QUEUE_NAMES } from '@echo/shared/constants';
import { ingestDocument } from './ingestJob';
import { cleanupOldData } from './retentionJob';
import { generateReport } from './reportJob';

const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

const ingestWorker = new Worker(
  QUEUE_NAMES.INGEST,
  async (job) => {
    console.log(`[IngestWorker] Processing job ${job.id}`);
    await ingestDocument(job.data);
  },
  { connection }
);

const retentionWorker = new Worker(
  QUEUE_NAMES.RETENTION,
  async (job) => {
    console.log(`[RetentionWorker] Processing job ${job.id}`);
    await cleanupOldData(job.data);
  },
  { connection }
);

const reportWorker = new Worker(
  QUEUE_NAMES.REPORT,
  async (job) => {
    console.log(`[ReportWorker] Processing job ${job.id}`);
    await generateReport(job.data);
  },
  { connection }
);

ingestWorker.on('completed', (job) => {
  console.log(`[IngestWorker] Job ${job.id} completed`);
});

ingestWorker.on('failed', (job, err) => {
  console.error(`[IngestWorker] Job ${job?.id} failed:`, err);
});

retentionWorker.on('completed', (job) => {
  console.log(`[RetentionWorker] Job ${job.id} completed`);
});

reportWorker.on('completed', (job) => {
  console.log(`[ReportWorker] Job ${job.id} completed`);
});

console.log('[Workers] All workers started');

process.on('SIGTERM', async () => {
  console.log('[Workers] SIGTERM received, closing workers');
  await ingestWorker.close();
  await retentionWorker.close();
  await reportWorker.close();
  await connection.quit();
  process.exit(0);
});
