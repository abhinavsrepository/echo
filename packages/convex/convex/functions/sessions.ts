import { mutation, query } from '../_generated/server';
import { v } from 'convex/values';

export const create = mutation({
  args: {
    tenantId: v.id('tenants'),
    userId: v.optional(v.string()),
    channel: v.string(),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const sessionId = await ctx.db.insert('sessions', {
      tenantId: args.tenantId,
      userId: args.userId,
      channel: args.channel,
      status: 'active',
      metadata: args.metadata,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return sessionId;
  },
});

export const get = query({
  args: {
    sessionId: v.id('sessions'),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.sessionId);
  },
});

export const listByTenant = query({
  args: {
    tenantId: v.id('tenants'),
    status: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query('sessions')
      .withIndex('by_tenant', (q) => q.eq('tenantId', args.tenantId))
      .order('desc');

    if (args.status) {
      query = ctx.db
        .query('sessions')
        .withIndex('by_status', (q) =>
          q.eq('tenantId', args.tenantId).eq('status', args.status)
        )
        .order('desc');
    }

    const sessions = await query.take(args.limit || 50);
    return sessions;
  },
});

export const listByAgent = query({
  args: {
    agentId: v.id('users'),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('sessions')
      .withIndex('by_assigned_agent', (q) => q.eq('assignedAgentId', args.agentId))
      .order('desc')
      .collect();
  },
});

export const updateSentiment = mutation({
  args: {
    sessionId: v.id('sessions'),
    sentiment: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.sessionId, {
      sentiment: Math.max(-1, Math.min(1, args.sentiment)),
      updatedAt: Date.now(),
    });

    return true;
  },
});

export const assignAgent = mutation({
  args: {
    sessionId: v.id('sessions'),
    agentId: v.id('users'),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.sessionId, {
      assignedAgentId: args.agentId,
      updatedAt: Date.now(),
    });

    return true;
  },
});

export const addTags = mutation({
  args: {
    sessionId: v.id('sessions'),
    tags: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error('Session not found');

    const existingTags = session.tags || [];
    const newTags = Array.from(new Set([...existingTags, ...args.tags]));

    await ctx.db.patch(args.sessionId, {
      tags: newTags,
      updatedAt: Date.now(),
    });

    return true;
  },
});

export const subscribe = query({
  args: {
    sessionId: v.id('sessions'),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) return null;

    const messages = await ctx.db
      .query('messages')
      .withIndex('by_session', (q) => q.eq('sessionId', args.sessionId))
      .order('desc')
      .take(50);

    return {
      session,
      messages: messages.reverse(),
    };
  },
});
