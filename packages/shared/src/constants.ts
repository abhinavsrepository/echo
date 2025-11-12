export const EVENTS = {
  MESSAGE_SENT: 'message.sent',
  MESSAGE_RECEIVED: 'message.received',
  SESSION_CREATED: 'session.created',
  SESSION_ESCALATED: 'session.escalated',
  SESSION_RESOLVED: 'session.resolved',
  AGENT_JOINED: 'agent.joined',
  AGENT_LEFT: 'agent.left',
  TYPING_START: 'typing.start',
  TYPING_END: 'typing.end',
  VOICE_CALL_STARTED: 'voice.call.started',
  VOICE_CALL_ENDED: 'voice.call.ended',
  DOCUMENT_UPLOADED: 'document.uploaded',
  DOCUMENT_INDEXED: 'document.indexed',
} as const;

export const ROUTES = {
  CONVERSATIONS: '/conversations',
  KNOWLEDGE: '/knowledge',
  SETTINGS: '/settings',
  ANALYTICS: '/analytics',
  API_HEALTH: '/api/health',
  API_WEBHOOK_VAPI: '/api/vapi/webhook',
  API_WEBHOOK_CLERK: '/api/clerk/webhook',
  API_WEBHOOK_STRIPE: '/api/stripe/webhook',
} as const;

export const LIMITS = {
  MESSAGE_MAX_LENGTH: 10000,
  FILE_MAX_SIZE: 10 * 1024 * 1024,
  CHUNK_SIZE: 1000,
  CHUNK_OVERLAP: 200,
  EMBEDDING_DIMENSIONS: 1536,
  MAX_CONTEXT_MESSAGES: 20,
  DEFAULT_TOP_K: 5,
  DEFAULT_TEMPERATURE: 0.7,
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
  REQUEST_TIMEOUT: 30000,
  WEBSOCKET_PING_INTERVAL: 30000,
  SESSION_TIMEOUT: 3600000,
  TYPING_INDICATOR_TIMEOUT: 3000,
} as const;

export const MODELS = {
  OPENAI: {
    'gpt-4o': 'gpt-4o',
    'gpt-4o-mini': 'gpt-4o-mini',
    'gpt-4-turbo': 'gpt-4-turbo',
  },
  ANTHROPIC: {
    'claude-3-5-sonnet-20241022': 'claude-3-5-sonnet-20241022',
    'claude-3-5-haiku-20241022': 'claude-3-5-haiku-20241022',
    'claude-3-opus-20240229': 'claude-3-opus-20240229',
  },
  GEMINI: {
    'gemini-2.0-flash-exp': 'gemini-2.0-flash-exp',
    'gemini-1.5-pro': 'gemini-1.5-pro',
  },
  GROK: {
    'grok-beta': 'grok-beta',
  },
} as const;

export const EMBEDDINGS = {
  OPENAI: 'text-embedding-3-small',
  DIMENSIONS: 1536,
} as const;

export const STATUS_CODES = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  RATE_LIMITED: 429,
  SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

export const ERROR_MESSAGES = {
  INVALID_INPUT: 'Invalid input provided',
  UNAUTHORIZED: 'Unauthorized access',
  TENANT_NOT_FOUND: 'Tenant not found',
  SESSION_NOT_FOUND: 'Session not found',
  MESSAGE_TOO_LONG: 'Message exceeds maximum length',
  FILE_TOO_LARGE: 'File exceeds maximum size',
  RATE_LIMIT_EXCEEDED: 'Rate limit exceeded',
  MODEL_ERROR: 'Error communicating with AI model',
  EMBEDDING_ERROR: 'Error generating embeddings',
  VECTOR_STORE_ERROR: 'Error querying vector store',
  WEBHOOK_SIGNATURE_INVALID: 'Invalid webhook signature',
} as const;

export const WEBHOOK_EVENTS = {
  VAPI: {
    CALL_STARTED: 'call.started',
    CALL_ENDED: 'call.ended',
    TRANSCRIPT_READY: 'transcript.ready',
    ERROR: 'error',
  },
  CLERK: {
    USER_CREATED: 'user.created',
    USER_UPDATED: 'user.updated',
    USER_DELETED: 'user.deleted',
    ORGANIZATION_CREATED: 'organization.created',
    ORGANIZATION_UPDATED: 'organization.updated',
  },
  STRIPE: {
    CHECKOUT_COMPLETED: 'checkout.session.completed',
    SUBSCRIPTION_UPDATED: 'customer.subscription.updated',
    SUBSCRIPTION_DELETED: 'customer.subscription.deleted',
    INVOICE_PAID: 'invoice.paid',
  },
} as const;

export const SYSTEM_PROMPTS = {
  DEFAULT: `You are Echo, an AI customer support assistant. You are helpful, friendly, and professional.
Always aim to resolve customer issues efficiently while maintaining a warm, empathetic tone.

Guidelines:
- Be concise but thorough in your responses
- Ask clarifying questions when needed
- Use the knowledge base to provide accurate information
- Escalate to human agents when appropriate
- Never make promises you can't keep
- Protect customer privacy and data`,

  VOICE: `You are Echo, a voice-based AI customer support assistant. Keep responses concise and natural for spoken conversation.
- Use short sentences
- Avoid complex jargon
- Be conversational and friendly
- Pause appropriately for customer responses`,

  ESCALATION: `This conversation is being escalated to a human agent.
Please summarize the customer's issue and what has been discussed so far.`,
} as const;

export const RETENTION_PERIODS = {
  MESSAGES: 90,
  SESSIONS: 180,
  AUDIT_LOGS: 365,
  VOICE_RECORDINGS: 30,
  ANALYTICS: 730,
} as const;

export const QUEUE_NAMES = {
  INGEST: 'echo:ingest',
  RETENTION: 'echo:retention',
  REPORT: 'echo:report',
  EMBEDDING: 'echo:embedding',
} as const;

export const CACHE_TTL = {
  TENANT_CONFIG: 300,
  USER_SESSION: 3600,
  KNOWLEDGE_QUERY: 600,
  API_KEY: 1800,
} as const;
