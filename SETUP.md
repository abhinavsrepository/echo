# Echo Setup Guide

## Quick Start

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
# Edit .env with your credentials

# Initialize Convex
cd packages/convex
npx convex dev --once
cd ../..

# Start development servers
pnpm dev
```

## Prerequisites

1. **Node.js 22+** - Install from [nodejs.org](https://nodejs.org/)
2. **pnpm 9+** - `npm install -g pnpm`
3. **Convex account** - Sign up at [convex.dev](https://convex.dev)
4. **Clerk account** - Sign up at [clerk.com](https://clerk.com)
5. **AWS account** - For Secrets Manager, S3, ECS
6. **API Keys**:
   - OpenAI (required)
   - Anthropic (optional)
   - Google AI (optional)
   - Grok (optional)
   - Pinecone (required for RAG)
   - Vapi (required for voice)
   - Stripe (required for billing)

## Configuration

### 1. Convex Setup

```bash
cd packages/convex
npx convex login
npx convex dev
```

Copy the deployment URL and add to `.env`:
```
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
```

### 2. Clerk Setup

1. Create a new application at [clerk.com](https://clerk.com)
2. Enable Organizations
3. Add API keys to `.env`:
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
```

### 3. AWS Secrets Manager

Store all API keys in AWS Secrets Manager:

```bash
aws secretsmanager create-secret \
  --name echo/dev/openai-api-key \
  --secret-string "sk-..."

aws secretsmanager create-secret \
  --name echo/dev/anthropic-api-key \
  --secret-string "sk-ant-..."

aws secretsmanager create-secret \
  --name echo/dev/pinecone-api-key \
  --secret-string "..."
```

### 4. Pinecone Setup

1. Create an index at [pinecone.io](https://pinecone.io)
2. Name: `echo-knowledge`
3. Dimensions: `1536`
4. Metric: `cosine`
5. Add credentials to `.env`

### 5. Vapi Setup

1. Sign up at [vapi.ai](https://vapi.ai)
2. Configure webhook URL: `https://your-domain.com/api/vapi/webhook`
3. Add API key to `.env`

## Development

### Start All Services

```bash
pnpm dev
```

This starts:
- Dashboard: http://localhost:3000
- Widget Playground: http://localhost:3001
- Convex: background sync

### Run Tests

```bash
# Unit tests
pnpm test

# E2E tests
cd packages/dashboard
pnpm cypress:run

cd packages/widget
pnpm playwright test
```

### Build for Production

```bash
pnpm build
```

## Deployment

### Infrastructure (Terraform)

```bash
cd terraform

# Initialize
terraform init

# Create workspace
terraform workspace new production

# Plan
terraform plan -var-file=environments/production.tfvars

# Apply
terraform apply -var-file=environments/production.tfvars
```

### Application (GitHub Actions)

Push to `main` branch triggers automatic deployment:

1. Runs CI tests
2. Builds Docker images
3. Pushes to ECR
4. Updates ECS services
5. Runs canary deployment
6. Promotes to production

### Manual Deployment

```bash
# Build images
docker build -f ops/Dockerfile.dashboard -t echo-dashboard .
docker build -f ops/Dockerfile.workers -t echo-workers .

# Tag and push
docker tag echo-dashboard:latest $ECR_REGISTRY/echo-dashboard:latest
docker push $ECR_REGISTRY/echo-dashboard:latest

# Update ECS
aws ecs update-service \
  --cluster echo-production \
  --service echo-dashboard \
  --force-new-deployment
```

## Monitoring

### Sentry

1. Create project at [sentry.io](https://sentry.io)
2. Add DSN to `.env`:
```
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
SENTRY_AUTH_TOKEN=...
```

### CloudWatch

```bash
# View logs
aws logs tail /ecs/echo-production-dashboard --follow

# View metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/ECS \
  --metric-name CPUUtilization \
  --dimensions Name=ServiceName,Value=echo-production-dashboard \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average
```

## Widget Integration

### Vanilla JS

```html
<script>
  (function(w,d,s,o,f,js,fjs){
    w['EchoWidget']=o;w[o]=w[o]||function(){(w[o].q=w[o].q||[]).push(arguments)};
    js=d.createElement(s),fjs=d.getElementsByTagName(s)[0];
    js.id=o;js.src=f;js.async=1;fjs.parentNode.insertBefore(js,fjs);
  }(window,document,'script','echo','https://cdn.echo.ai/widget.js'));

  echo('init', {
    tenantId: 'your-tenant-id',
    theme: 'auto',
    position: 'bottom-right',
  });
</script>
```

### React

```tsx
import { EchoWidget } from '@echo/widget/react';

export default function App() {
  return (
    <EchoWidget
      convexUrl={process.env.NEXT_PUBLIC_CONVEX_URL}
      tenantId="your-tenant-id"
      theme="light"
    />
  );
}
```

## Troubleshooting

### Widget Not Loading

1. Check browser console for errors
2. Verify `tenantId` is correct
3. Check CORS settings in Convex dashboard
4. Ensure widget URL is accessible

### Voice Calls Failing

1. Verify Vapi webhook URL is accessible
2. Check webhook signature is correct
3. Ensure Convex function has correct permissions
4. Check Vapi dashboard for errors

### RAG Not Finding Documents

1. Check Pinecone index exists
2. Verify namespace matches tenant ID
3. Check document ingestion status
4. Verify embeddings were generated

### High Costs

1. Review usage in Convex dashboard
2. Check model selection (use cheaper models where possible)
3. Implement rate limiting per tenant
4. Review RAG query frequency

## Support

- Documentation: https://docs.echo.ai
- GitHub Issues: https://github.com/your-org/echo/issues
- Discord: https://discord.gg/echo
- Email: support@echo.ai
