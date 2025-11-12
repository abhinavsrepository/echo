import { mutation, query, action } from '../_generated/server';
import { v } from 'convex/values';
import { ModelAdapter } from '../helpers/modelAdapter';
import { PineconeClient } from '../helpers/pinecone';
import { redactPII } from '@echo/shared/utils';
import { SYSTEM_PROMPTS, LIMITS } from '@echo/shared/constants';

export const sendMessage = mutation({
  args: {
    sessionId: v.id('sessions'),
    content: v.string(),
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.content.length > LIMITS.MESSAGE_MAX_LENGTH) {
      throw new Error('Message exceeds maximum length');
    }

    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error('Session not found');

    const tenant = await ctx.db.get(session.tenantId);
    if (!tenant) throw new Error('Tenant not found');

    let content = args.content;
    if (tenant.settings.piiRedactionEnabled) {
      content = redactPII(content);
    }

    const messageId = await ctx.db.insert('messages', {
      sessionId: args.sessionId,
      role: 'user',
      content,
      createdAt: Date.now(),
    });

    await ctx.db.patch(args.sessionId, {
      updatedAt: Date.now(),
    });

    await ctx.scheduler.runAfter(0, 'functions/messages:generateResponse', {
      sessionId: args.sessionId,
      messageId,
    });

    return messageId;
  },
});

export const generateResponse = action({
  args: {
    sessionId: v.id('sessions'),
    messageId: v.id('messages'),
  },
  handler: async (ctx, args) => {
    const session = await ctx.runQuery('functions/sessions:get', {
      sessionId: args.sessionId,
    });
    if (!session) throw new Error('Session not found');

    const tenant = await ctx.runQuery('tenants:get', {
      tenantId: session.tenantId,
    });
    if (!tenant) throw new Error('Tenant not found');

    const recentMessages = await ctx.runQuery('functions/messages:listBySession', {
      sessionId: args.sessionId,
      limit: LIMITS.MAX_CONTEXT_MESSAGES,
    });

    let context = '';
    if (tenant.settings.ragEnabled) {
      const lastUserMessage = recentMessages.find((m) => m._id === args.messageId);
      if (lastUserMessage) {
        const ragResults = await ctx.runAction('functions/rag:queryVector', {
          tenantId: session.tenantId,
          query: lastUserMessage.content,
          topK: LIMITS.DEFAULT_TOP_K,
        });

        if (ragResults.length > 0) {
          context = `Context from knowledge base:\n${ragResults
            .map((r) => r.content)
            .join('\n\n')}`;
        }
      }
    }

    const messages = [
      {
        role: 'system' as const,
        content: context ? `${SYSTEM_PROMPTS.DEFAULT}\n\n${context}` : SYSTEM_PROMPTS.DEFAULT,
      },
      ...recentMessages.map((m) => ({
        role: m.role as 'user' | 'assistant' | 'system',
        content: m.content,
      })),
    ];

    const adapter = new ModelAdapter();
    const response = await adapter.chat({
      provider: tenant.settings.defaultModel as 'openai' | 'anthropic' | 'gemini' | 'grok',
      model: 'gpt-4o',
      messages,
      temperature: LIMITS.DEFAULT_TEMPERATURE,
    });

    await ctx.runMutation('functions/messages:insertAssistantMessage', {
      sessionId: args.sessionId,
      content: response.content,
      metadata: {
        model: response.model,
        tokens: response.usage.totalTokens,
        cost: response.cost,
        latency: response.latency,
        ragSources: context ? ['knowledge-base'] : undefined,
      },
    });

    await ctx.runMutation('functions/usage:recordUsage', {
      tenantId: session.tenantId,
      provider: tenant.settings.defaultModel,
      model: response.model,
      promptTokens: response.usage.promptTokens,
      completionTokens: response.usage.completionTokens,
      cost: response.cost,
    });

    if (tenant.settings.autoEscalateEnabled) {
      await ctx.runMutation('functions/messages:checkEscalation', {
        sessionId: args.sessionId,
      });
    }

    return response;
  },
});

export const insertAssistantMessage = mutation({
  args: {
    sessionId: v.id('sessions'),
    content: v.string(),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const messageId = await ctx.db.insert('messages', {
      sessionId: args.sessionId,
      role: 'assistant',
      content: args.content,
      metadata: args.metadata,
      createdAt: Date.now(),
    });

    return messageId;
  },
});

export const listBySession = query({
  args: {
    sessionId: v.id('sessions'),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query('messages')
      .withIndex('by_session', (q) => q.eq('sessionId', args.sessionId))
      .order('desc')
      .take(args.limit || 50);

    return messages.reverse();
  },
});

export const checkEscalation = mutation({
  args: {
    sessionId: v.id('sessions'),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) return;

    const messages = await ctx.db
      .query('messages')
      .withIndex('by_session', (q) => q.eq('sessionId', args.sessionId))
      .collect();

    const rules = await ctx.db
      .query('escalationRules')
      .withIndex('by_tenant', (q) => q.eq('tenantId', session.tenantId))
      .filter((q) => q.eq(q.field('enabled'), true))
      .collect();

    for (const rule of rules) {
      let shouldEscalate = false;

      if (rule.conditions.messageCount && messages.length >= rule.conditions.messageCount) {
        shouldEscalate = true;
      }

      if (rule.conditions.sentimentThreshold && session.sentiment !== undefined) {
        if (session.sentiment <= rule.conditions.sentimentThreshold) {
          shouldEscalate = true;
        }
      }

      if (rule.conditions.keywords && rule.conditions.keywords.length > 0) {
        const recentMessage = messages[messages.length - 1];
        const hasKeyword = rule.conditions.keywords.some((keyword) =>
          recentMessage.content.toLowerCase().includes(keyword.toLowerCase())
        );
        if (hasKeyword) shouldEscalate = true;
      }

      if (shouldEscalate) {
        await ctx.db.patch(args.sessionId, {
          status: 'escalated',
          assignedAgentId: rule.actions.assignTo,
          updatedAt: Date.now(),
        });

        await ctx.scheduler.runAfter(0, 'triggers/onEscalation:handle', {
          sessionId: args.sessionId,
          ruleId: rule._id,
        });

        break;
      }
    }
  },
});

export const escalateManually = mutation({
  args: {
    sessionId: v.id('sessions'),
    agentId: v.optional(v.id('users')),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.sessionId, {
      status: 'escalated',
      assignedAgentId: args.agentId,
      updatedAt: Date.now(),
    });

    return true;
  },
});

export const closeSession = mutation({
  args: {
    sessionId: v.id('sessions'),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.sessionId, {
      status: 'resolved',
      closedAt: Date.now(),
      updatedAt: Date.now(),
    });

    return true;
  },
});
