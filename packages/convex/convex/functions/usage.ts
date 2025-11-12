import { mutation, query } from '../_generated/server';
import { v } from 'convex/values';

export const recordUsage = mutation({
  args: {
    tenantId: v.id('tenants'),
    provider: v.string(),
    model: v.string(),
    promptTokens: v.number(),
    completionTokens: v.number(),
    cost: v.number(),
  },
  handler: async (ctx, args) => {
    const date = new Date().toISOString().split('T')[0];

    const existing = await ctx.db
      .query('usage')
      .withIndex('by_tenant_date', (q) =>
        q.eq('tenantId', args.tenantId).eq('date', date)
      )
      .filter((q) =>
        q.and(
          q.eq(q.field('provider'), args.provider),
          q.eq(q.field('model'), args.model)
        )
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        promptTokens: existing.promptTokens + args.promptTokens,
        completionTokens: existing.completionTokens + args.completionTokens,
        totalTokens: existing.totalTokens + args.promptTokens + args.completionTokens,
        estimatedCost: existing.estimatedCost + args.cost,
        requestCount: existing.requestCount + 1,
      });

      return existing._id;
    } else {
      const usageId = await ctx.db.insert('usage', {
        tenantId: args.tenantId,
        date,
        provider: args.provider,
        model: args.model,
        promptTokens: args.promptTokens,
        completionTokens: args.completionTokens,
        totalTokens: args.promptTokens + args.completionTokens,
        estimatedCost: args.cost,
        requestCount: 1,
      });

      return usageId;
    }
  },
});

export const getCurrentMonth = query({
  args: {
    tenantId: v.id('tenants'),
  },
  handler: async (ctx, args) => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .split('T')[0];

    const usage = await ctx.db
      .query('usage')
      .withIndex('by_tenant_date', (q) => q.eq('tenantId', args.tenantId))
      .filter((q) => q.gte(q.field('date'), startOfMonth))
      .collect();

    const totals = usage.reduce(
      (acc, record) => ({
        totalTokens: acc.totalTokens + record.totalTokens,
        totalCost: acc.totalCost + record.estimatedCost,
        totalRequests: acc.totalRequests + record.requestCount,
      }),
      { totalTokens: 0, totalCost: 0, totalRequests: 0 }
    );

    return {
      usage,
      totals,
    };
  },
});

export const getTopTenants = query({
  args: {
    month: v.string(),
  },
  handler: async (ctx, args) => {
    const usage = await ctx.db
      .query('usage')
      .withIndex('by_date', (q) => q.eq('date', args.month))
      .collect();

    const tenantTotals = new Map<string, { cost: number; tokens: number }>();

    for (const record of usage) {
      const existing = tenantTotals.get(record.tenantId) || { cost: 0, tokens: 0 };
      tenantTotals.set(record.tenantId, {
        cost: existing.cost + record.estimatedCost,
        tokens: existing.tokens + record.totalTokens,
      });
    }

    const sorted = Array.from(tenantTotals.entries())
      .sort((a, b) => b[1].cost - a[1].cost)
      .slice(0, 10);

    return sorted.map(([tenantId, data]) => ({
      tenantId,
      cost: data.cost,
      tokens: data.tokens,
    }));
  },
});

export const incrementTokenCount = mutation({
  args: {
    tenantId: v.id('tenants'),
    count: v.number(),
  },
  handler: async (ctx, args) => {
    return true;
  },
});

export const stripeWebhook = mutation({
  args: {
    payload: v.any(),
  },
  handler: async (ctx, args) => {
    return true;
  },
});
