# Echo Operations Runbook

## Architecture Overview

Echo is deployed on AWS ECS Fargate with the following components:
- Dashboard (Next.js): Web application for support agents
- Workers (Node.js): Background job processors
- RDS PostgreSQL: Analytics database
- S3: Document storage
- CloudFront: CDN
- Convex: Real-time database (hosted)
- Pinecone: Vector database (hosted)

## Common Operations

### Accessing Logs

```bash
# Dashboard logs
aws logs tail /ecs/echo-production-dashboard --follow

# Worker logs
aws logs tail /ecs/echo-production-workers --follow

# Filter for errors
aws logs tail /ecs/echo-production-dashboard --follow --filter-pattern "ERROR"
```

### Checking Service Health

```bash
# List services
aws ecs list-services --cluster echo-production

# Describe service
aws ecs describe-services \
  --cluster echo-production \
  --services echo-production-dashboard

# Check task status
aws ecs list-tasks --cluster echo-production --service echo-production-dashboard
```

### Scaling Services

```bash
# Scale dashboard
aws ecs update-service \
  --cluster echo-production \
  --service echo-production-dashboard \
  --desired-count 10

# Scale workers
aws ecs update-service \
  --cluster echo-production \
  --service echo-production-workers \
  --desired-count 5
```

### Executing Commands in Container

```bash
# List running tasks
TASK_ARN=$(aws ecs list-tasks \
  --cluster echo-production \
  --service echo-production-dashboard \
  --query 'taskArns[0]' \
  --output text)

# Execute command
aws ecs execute-command \
  --cluster echo-production \
  --task $TASK_ARN \
  --container dashboard \
  --interactive \
  --command "/bin/sh"
```

## Troubleshooting

### Issue: Dashboard not loading

1. Check ECS service status
   ```bash
   aws ecs describe-services --cluster echo-production --services echo-production-dashboard
   ```

2. Check target group health
   ```bash
   aws elbv2 describe-target-health --target-group-arn <arn>
   ```

3. Check logs for errors
   ```bash
   aws logs tail /ecs/echo-production-dashboard --follow
   ```

4. Common causes:
   - Health check failing (check `/api/health` endpoint)
   - Environment variables missing
   - Database connection issues

### Issue: High error rate

1. Check Sentry for error details
   ```
   https://sentry.io/organizations/echo/issues/
   ```

2. Check CloudWatch metrics
   ```bash
   aws cloudwatch get-metric-statistics \
     --namespace AWS/ECS \
     --metric-name CPUUtilization \
     --dimensions Name=ServiceName,Value=echo-production-dashboard \
     --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
     --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
     --period 300 \
     --statistics Average
   ```

3. Common causes:
   - Convex rate limiting
   - API key exhausted (OpenAI, Anthropic)
   - Database connection pool exhausted
   - Memory leak in workers

### Issue: Workers not processing jobs

1. Check Redis connection
   ```bash
   redis-cli -h <redis-endpoint> ping
   ```

2. Check queue length
   ```bash
   redis-cli -h <redis-endpoint> llen bull:ingest:waiting
   ```

3. Check worker logs
   ```bash
   aws logs tail /ecs/echo-production-workers --follow
   ```

4. Common causes:
   - Redis connection timeout
   - Job timeout (increase worker timeout)
   - OOM (increase memory limit)
   - API rate limits (Pinecone, OpenAI)

### Issue: Voice calls failing

1. Check Vapi webhook endpoint
   ```bash
   curl -X POST https://api.echo.com/api/vapi/webhook \
     -H "Content-Type: application/json" \
     -d '{"type":"ping"}'
   ```

2. Verify Vapi configuration
   - Check webhook URL in Vapi dashboard
   - Verify webhook secret matches

3. Check Convex logs for voice function errors

4. Common causes:
   - Webhook signature mismatch
   - Convex function timeout
   - Invalid phone number format

### Issue: RAG not finding documents

1. Check Pinecone index exists
   ```bash
   curl -X GET "https://controller.YOUR_ENV.pinecone.io/databases" \
     -H "Api-Key: $PINECONE_API_KEY"
   ```

2. Check namespace for tenant
   ```bash
   # Query with namespace filter
   ```

3. Check ingestion job status
   ```bash
   aws logs tail /ecs/echo-production-workers --follow --filter-pattern "ingest"
   ```

4. Common causes:
   - Wrong namespace
   - Embeddings not generated
   - Pinecone index full
   - Query embedding dimension mismatch

### Issue: High costs

1. Check usage metrics in Convex dashboard
2. Check OpenAI/Anthropic usage
   - OpenAI: https://platform.openai.com/usage
   - Anthropic: https://console.anthropic.com/usage

3. Review per-tenant usage
   ```typescript
   await convex.query(api.usage.getTopTenants, { month: "2025-01" })
   ```

4. Common causes:
   - Infinite loops in conversations
   - Large embeddings being regenerated
   - No rate limiting on tenant
   - Expensive models used unnecessarily

## Deployment

### Manual Deployment

```bash
# Build and push images
cd echo
docker build -f ops/Dockerfile.dashboard -t echo-dashboard:latest .
docker tag echo-dashboard:latest $ECR_REGISTRY/echo-dashboard:latest
docker push $ECR_REGISTRY/echo-dashboard:latest

# Update ECS service
aws ecs update-service \
  --cluster echo-production \
  --service echo-production-dashboard \
  --force-new-deployment
```

### Rollback

```bash
# Get previous task definition
PREVIOUS_TASK_DEF=$(aws ecs describe-services \
  --cluster echo-production \
  --services echo-production-dashboard \
  --query 'services[0].deployments[1].taskDefinition' \
  --output text)

# Update service to previous version
aws ecs update-service \
  --cluster echo-production \
  --service echo-production-dashboard \
  --task-definition $PREVIOUS_TASK_DEF
```

## Secrets Management

### Rotating Secrets

```bash
# Generate new secret
NEW_SECRET=$(openssl rand -base64 32)

# Update in AWS Secrets Manager
aws secretsmanager update-secret \
  --secret-id echo/production/openai-api-key \
  --secret-string "$NEW_SECRET"

# Force new deployment to pick up secret
aws ecs update-service \
  --cluster echo-production \
  --service echo-production-dashboard \
  --force-new-deployment
```

### Per-Tenant BYOK

```bash
# Store tenant API key
aws secretsmanager create-secret \
  --name echo/tenant/acme-corp/openai-key \
  --secret-string "sk-..." \
  --kms-key-id alias/echo-production

# Retrieve in Convex function
const secret = await getSecretFromAWS(`echo/tenant/${tenantId}/openai-key`)
```

## Monitoring

### Key Metrics

1. **Dashboard**
   - CPU/Memory utilization
   - Request count
   - Response time (p50, p95, p99)
   - Error rate

2. **Workers**
   - Job processing rate
   - Job failure rate
   - Queue length
   - Processing time

3. **Convex**
   - Function execution time
   - Function call rate
   - Bandwidth usage

4. **Costs**
   - OpenAI token usage
   - Anthropic token usage
   - Pinecone query count
   - Vapi call minutes

### Alerts

Configure CloudWatch alarms for:
- High error rate (> 1%)
- High response time (> 2s p95)
- High CPU (> 80%)
- High memory (> 80%)
- Service unhealthy
- Failed deployments

## Disaster Recovery

### Database Backup

```bash
# Create manual snapshot
aws rds create-db-snapshot \
  --db-instance-identifier echo-production-db \
  --db-snapshot-identifier echo-manual-$(date +%Y%m%d-%H%M%S)

# Restore from snapshot
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier echo-production-db-restored \
  --db-snapshot-identifier echo-manual-20250113-120000
```

### S3 Backup

S3 versioning is enabled. To restore a deleted object:

```bash
# List versions
aws s3api list-object-versions \
  --bucket echo-production-documents \
  --prefix "tenant/acme-corp/"

# Restore specific version
aws s3api copy-object \
  --bucket echo-production-documents \
  --copy-source echo-production-documents/tenant/acme-corp/file.pdf?versionId=VERSION_ID \
  --key tenant/acme-corp/file.pdf
```

## Compliance

### GDPR Data Export

```bash
# Trigger export in Convex
curl -X POST https://api.echo.com/api/gdpr/export \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"userId": "user_123"}'

# Download export from S3
aws s3 cp s3://echo-production-documents/exports/user_123.zip .
```

### GDPR Data Deletion

```bash
# Delete user data
curl -X DELETE https://api.echo.com/api/gdpr/delete \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"userId": "user_123"}'
```

### Audit Log Query

```typescript
// In Convex
const logs = await ctx.db
  .query("auditLogs")
  .withIndex("by_tenant_and_timestamp", q =>
    q.eq("tenantId", "tenant_123")
     .gte("timestamp", startDate)
     .lte("timestamp", endDate)
  )
  .collect()
```

## Contacts

- On-call engineer: Check PagerDuty
- DevOps lead: devops@echo.ai
- Security incidents: security@echo.ai
- AWS support: Enterprise support plan
