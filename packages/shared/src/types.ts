import { z } from 'zod';

export const ModelProviderSchema = z.enum(['openai', 'anthropic', 'gemini', 'grok']);
export type ModelProvider = z.infer<typeof ModelProviderSchema>;

export const ChannelSchema = z.enum(['widget', 'voice', 'api', 'dashboard']);
export type Channel = z.infer<typeof ChannelSchema>;

export const SessionStatusSchema = z.enum(['active', 'escalated', 'resolved', 'abandoned']);
export type SessionStatus = z.infer<typeof SessionStatusSchema>;

export const MessageRoleSchema = z.enum(['user', 'assistant', 'system']);
export type MessageRole = z.infer<typeof MessageRoleSchema>;

export const TenantSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  organizationId: z.string(),
  settings: z.object({
    defaultModel: ModelProviderSchema,
    voiceEnabled: z.boolean(),
    ragEnabled: z.boolean(),
    autoEscalateEnabled: z.boolean(),
    autoEscalateThreshold: z.number().min(0).max(1),
    maxTokensPerDay: z.number().optional(),
    maxMessagesPerHour: z.number().optional(),
    retentionDays: z.number().default(90),
    piiRedactionEnabled: z.boolean().default(true),
  }),
  byok: z.object({
    openaiKey: z.string().optional(),
    anthropicKey: z.string().optional(),
    geminiKey: z.string().optional(),
    grokKey: z.string().optional(),
  }).optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
});
export type Tenant = z.infer<typeof TenantSchema>;

export const UserSchema = z.object({
  id: z.string(),
  clerkId: z.string(),
  email: z.string().email(),
  name: z.string(),
  tenantId: z.string(),
  role: z.enum(['admin', 'agent', 'viewer']),
  createdAt: z.number(),
  updatedAt: z.number(),
});
export type User = z.infer<typeof UserSchema>;

export const MessageSchema = z.object({
  id: z.string(),
  sessionId: z.string(),
  role: MessageRoleSchema,
  content: z.string(),
  metadata: z.object({
    model: z.string().optional(),
    tokens: z.number().optional(),
    cost: z.number().optional(),
    latency: z.number().optional(),
    redacted: z.boolean().optional(),
    ragSources: z.array(z.string()).optional(),
  }).optional(),
  createdAt: z.number(),
});
export type Message = z.infer<typeof MessageSchema>;

export const SessionSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  userId: z.string().optional(),
  channel: ChannelSchema,
  status: SessionStatusSchema,
  assignedAgentId: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  tags: z.array(z.string()).optional(),
  sentiment: z.number().min(-1).max(1).optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
  closedAt: z.number().optional(),
});
export type Session = z.infer<typeof SessionSchema>;

export const EscalationRuleSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  name: z.string(),
  enabled: z.boolean(),
  conditions: z.object({
    sentimentThreshold: z.number().optional(),
    messageCount: z.number().optional(),
    keywords: z.array(z.string()).optional(),
    duration: z.number().optional(),
  }),
  actions: z.object({
    assignTo: z.string().optional(),
    notifySlack: z.boolean().optional(),
    notifyEmail: z.array(z.string()).optional(),
  }),
  priority: z.number(),
  createdAt: z.number(),
  updatedAt: z.number(),
});
export type EscalationRule = z.infer<typeof EscalationRuleSchema>;

export const UsageMetricSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  date: z.string(),
  provider: ModelProviderSchema,
  model: z.string(),
  promptTokens: z.number(),
  completionTokens: z.number(),
  totalTokens: z.number(),
  estimatedCost: z.number(),
  requestCount: z.number(),
});
export type UsageMetric = z.infer<typeof UsageMetricSchema>;

export const DocumentSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  name: z.string(),
  type: z.enum(['markdown', 'pdf', 'text']),
  url: z.string().url(),
  s3Key: z.string(),
  size: z.number(),
  status: z.enum(['pending', 'processing', 'indexed', 'failed']),
  error: z.string().optional(),
  chunkCount: z.number().optional(),
  vectorCount: z.number().optional(),
  uploadedBy: z.string(),
  createdAt: z.number(),
  updatedAt: z.number(),
  indexedAt: z.number().optional(),
});
export type Document = z.infer<typeof DocumentSchema>;

export const AuditLogSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  userId: z.string(),
  action: z.string(),
  resource: z.string(),
  resourceId: z.string(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  timestamp: z.number(),
});
export type AuditLog = z.infer<typeof AuditLogSchema>;

export const VoiceCallSchema = z.object({
  id: z.string(),
  sessionId: z.string(),
  tenantId: z.string(),
  vapiCallId: z.string(),
  phoneNumber: z.string(),
  direction: z.enum(['inbound', 'outbound']),
  status: z.enum(['ringing', 'in-progress', 'completed', 'failed']),
  duration: z.number().optional(),
  recordingUrl: z.string().optional(),
  transcript: z.string().optional(),
  createdAt: z.number(),
  endedAt: z.number().optional(),
});
export type VoiceCall = z.infer<typeof VoiceCallSchema>;

export const KnowledgeQuerySchema = z.object({
  query: z.string().min(1).max(500),
  tenantId: z.string(),
  topK: z.number().min(1).max(20).default(5),
  threshold: z.number().min(0).max(1).default(0.7),
  filters: z.record(z.string(), z.unknown()).optional(),
});
export type KnowledgeQuery = z.infer<typeof KnowledgeQuerySchema>;

export const KnowledgeResultSchema = z.object({
  id: z.string(),
  content: z.string(),
  metadata: z.record(z.string(), z.unknown()),
  score: z.number(),
  documentId: z.string(),
});
export type KnowledgeResult = z.infer<typeof KnowledgeResultSchema>;

export const ModelRequestSchema = z.object({
  provider: ModelProviderSchema,
  model: z.string(),
  messages: z.array(z.object({
    role: MessageRoleSchema,
    content: z.string(),
  })),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().optional(),
  stream: z.boolean().optional(),
});
export type ModelRequest = z.infer<typeof ModelRequestSchema>;

export const ModelResponseSchema = z.object({
  content: z.string(),
  model: z.string(),
  usage: z.object({
    promptTokens: z.number(),
    completionTokens: z.number(),
    totalTokens: z.number(),
  }),
  cost: z.number(),
  latency: z.number(),
});
export type ModelResponse = z.infer<typeof ModelResponseSchema>;

export interface WidgetConfig {
  tenantId: string;
  theme?: 'light' | 'dark' | 'auto';
  position?: 'bottom-right' | 'bottom-left';
  primaryColor?: string;
  brandName?: string;
  welcomeMessage?: string;
  placeholder?: string;
  showBranding?: boolean;
  allowFileUpload?: boolean;
  maxFileSize?: number;
}

export interface WebSocketMessage {
  type: 'ping' | 'message' | 'typing' | 'presence' | 'error' | 'close';
  payload?: unknown;
  timestamp: number;
}
