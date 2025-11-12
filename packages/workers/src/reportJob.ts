import AWS from 'aws-sdk';

const s3 = new AWS.S3();

interface ReportJobData {
  tenantId: string;
  month: string;
}

export async function generateReport(data: ReportJobData): Promise<void> {
  console.log(`[ReportJob] Generating report for ${data.tenantId} - ${data.month}`);

  const csvData = 'Date,Tokens,Cost,Requests\n';

  const key = `reports/${data.tenantId}/${data.month}.csv`;

  await s3
    .putObject({
      Bucket: process.env.S3_DOCUMENTS_BUCKET!,
      Key: key,
      Body: csvData,
      ContentType: 'text/csv',
    })
    .promise();

  console.log(`[ReportJob] Report uploaded to S3: ${key}`);
}
