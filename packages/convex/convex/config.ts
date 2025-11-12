export const config = {
  aws: {
    region: process.env.AWS_REGION || 'us-east-1',
    secretsPrefix: process.env.AWS_SECRETS_MANAGER_PREFIX || 'echo',
  },
  pinecone: {
    apiKey: process.env.PINECONE_API_KEY!,
    environment: process.env.PINECONE_ENVIRONMENT!,
    index: process.env.PINECONE_INDEX || 'echo-knowledge',
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY!,
  },
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY!,
  },
  google: {
    apiKey: process.env.GOOGLE_AI_API_KEY!,
  },
  grok: {
    apiKey: process.env.GROK_API_KEY!,
  },
  vapi: {
    apiKey: process.env.VAPI_API_KEY!,
    webhookSecret: process.env.VAPI_WEBHOOK_SECRET!,
  },
  clerk: {
    secretKey: process.env.CLERK_SECRET_KEY!,
    webhookSecret: process.env.CLERK_WEBHOOK_SECRET!,
  },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY!,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
  },
};

export function getConfig() {
  return config;
}
