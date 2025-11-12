import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  tenants: defineTable({
    name: v.string(),
    slug: v.string(),
    organizationId: v.string(),
    settings: v.object({
      defaultModel: v.string(),
      voiceEnabled: v.boolean(),
      ragEnabled: v.boolean(),
      autoEscalateEnabled: v.boolean(),
      autoEscalateThreshold: v.number(),
      maxTokensPerDay: v.optional(v.number()),
      maxMessagesPerHour: v.optional(v.number()),
      retentionDays: v.number(),
      piiRedactionEnabled: v.boolean(),
    }),
    byok: v.optional(
      v.object({
        openaiKey: v.optional(v.string()),
        anthropicKey: v.optional(v.string()),
        geminiKey: v.optional(v.string()),
        grokKey: v.optional(v.string()),
      })
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_slug', ['slug'])
    .index('by_organization', ['organizationId']),

  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
    tenantId: v.id('tenants'),
    role: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_clerk_id', ['clerkId'])
    .index('by_tenant', ['tenantId'])
    .index('by_email', ['email']),

  sessions: defineTable({
    tenantId: v.id('tenants'),
    userId: v.optional(v.string()),
    channel: v.string(),
    status: v.string(),
    assignedAgentId: v.optional(v.id('users')),
    metadata: v.optional(v.any()),
    tags: v.optional(v.array(v.string())),
    sentiment: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
    closedAt: v.optional(v.number()),
  })
    .index('by_tenant', ['tenantId', 'createdAt'])
    .index('by_status', ['tenantId', 'status'])
    .index('by_assigned_agent', ['assignedAgentId'])
    .index('by_user', ['userId']),

  messages: defineTable({
    sessionId: v.id('sessions'),
    role: v.string(),
    content: v.string(),
    metadata: v.optional(
      v.object({
        model: v.optional(v.string()),
        tokens: v.optional(v.number()),
        cost: v.optional(v.number()),
        latency: v.optional(v.number()),
        redacted: v.optional(v.boolean()),
        ragSources: v.optional(v.array(v.string())),
      })
    ),
    createdAt: v.number(),
  })
    .index('by_session', ['sessionId', 'createdAt'])
    .index('by_created_at', ['createdAt']),

  documents: defineTable({
    tenantId: v.id('tenants'),
    name: v.string(),
    type: v.string(),
    url: v.string(),
    s3Key: v.string(),
    size: v.number(),
    status: v.string(),
    error: v.optional(v.string()),
    chunkCount: v.optional(v.number()),
    vectorCount: v.optional(v.number()),
    uploadedBy: v.id('users'),
    createdAt: v.number(),
    updatedAt: v.number(),
    indexedAt: v.optional(v.number()),
  })
    .index('by_tenant', ['tenantId', 'createdAt'])
    .index('by_status', ['tenantId', 'status']),

  escalationRules: defineTable({
    tenantId: v.id('tenants'),
    name: v.string(),
    enabled: v.boolean(),
    conditions: v.object({
      sentimentThreshold: v.optional(v.number()),
      messageCount: v.optional(v.number()),
      keywords: v.optional(v.array(v.string())),
      duration: v.optional(v.number()),
    }),
    actions: v.object({
      assignTo: v.optional(v.id('users')),
      notifySlack: v.optional(v.boolean()),
      notifyEmail: v.optional(v.array(v.string())),
    }),
    priority: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_tenant', ['tenantId'])
    .index('by_priority', ['tenantId', 'priority']),

  auditLogs: defineTable({
    tenantId: v.id('tenants'),
    userId: v.id('users'),
    action: v.string(),
    resource: v.string(),
    resourceId: v.string(),
    metadata: v.optional(v.any()),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    timestamp: v.number(),
  })
    .index('by_tenant', ['tenantId', 'timestamp'])
    .index('by_user', ['userId', 'timestamp'])
    .index('by_resource', ['resource', 'resourceId']),

  usage: defineTable({
    tenantId: v.id('tenants'),
    date: v.string(),
    provider: v.string(),
    model: v.string(),
    promptTokens: v.number(),
    completionTokens: v.number(),
    totalTokens: v.number(),
    estimatedCost: v.number(),
    requestCount: v.number(),
  })
    .index('by_tenant_date', ['tenantId', 'date'])
    .index('by_date', ['date']),

  voiceCalls: defineTable({
    sessionId: v.id('sessions'),
    tenantId: v.id('tenants'),
    vapiCallId: v.string(),
    phoneNumber: v.string(),
    direction: v.string(),
    status: v.string(),
    duration: v.optional(v.number()),
    recordingUrl: v.optional(v.string()),
    transcript: v.optional(v.string()),
    createdAt: v.number(),
    endedAt: v.optional(v.number()),
  })
    .index('by_session', ['sessionId'])
    .index('by_tenant', ['tenantId', 'createdAt'])
    .index('by_vapi_id', ['vapiCallId']),
});
