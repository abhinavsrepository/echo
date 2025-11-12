import { action, mutation, query } from '../_generated/server';
import { v } from 'convex/values';
import { config } from '../config';

export const clerkWebhook = action({
  args: {
    payload: v.any(),
    signature: v.string(),
  },
  handler: async (ctx, args) => {
    const event = args.payload;

    switch (event.type) {
      case 'user.created':
        await ctx.runMutation('functions/auth:handleUserCreated', {
          userData: event.data,
        });
        break;

      case 'user.updated':
        await ctx.runMutation('functions/auth:handleUserUpdated', {
          userData: event.data,
        });
        break;

      case 'user.deleted':
        await ctx.runMutation('functions/auth:handleUserDeleted', {
          userId: event.data.id,
        });
        break;

      case 'organization.created':
        await ctx.runMutation('functions/auth:handleOrganizationCreated', {
          orgData: event.data,
        });
        break;

      default:
        console.log('[Auth] Unknown event type:', event.type);
    }

    return { received: true };
  },
});

export const handleUserCreated = mutation({
  args: {
    userData: v.any(),
  },
  handler: async (ctx, args) => {
    const { id, email_addresses, first_name, last_name, public_metadata } = args.userData;

    const email = email_addresses[0]?.email_address;
    const name = `${first_name || ''} ${last_name || ''}`.trim();

    const tenantId = public_metadata?.tenantId;
    if (!tenantId) {
      console.warn('[Auth] User created without tenantId');
      return null;
    }

    const userId = await ctx.db.insert('users', {
      clerkId: id,
      email,
      name: name || email,
      tenantId,
      role: public_metadata?.role || 'viewer',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return userId;
  },
});

export const handleUserUpdated = mutation({
  args: {
    userData: v.any(),
  },
  handler: async (ctx, args) => {
    const { id, email_addresses, first_name, last_name, public_metadata } = args.userData;

    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', id))
      .first();

    if (!user) return null;

    const email = email_addresses[0]?.email_address;
    const name = `${first_name || ''} ${last_name || ''}`.trim();

    await ctx.db.patch(user._id, {
      email,
      name: name || email,
      role: public_metadata?.role || user.role,
      updatedAt: Date.now(),
    });

    return user._id;
  },
});

export const handleUserDeleted = mutation({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', args.userId))
      .first();

    if (user) {
      await ctx.db.delete(user._id);
    }

    return true;
  },
});

export const handleOrganizationCreated = mutation({
  args: {
    orgData: v.any(),
  },
  handler: async (ctx, args) => {
    const { id, name, slug } = args.orgData;

    const tenantId = await ctx.db.insert('tenants', {
      name,
      slug,
      organizationId: id,
      settings: {
        defaultModel: 'openai',
        voiceEnabled: true,
        ragEnabled: true,
        autoEscalateEnabled: false,
        autoEscalateThreshold: 0.5,
        retentionDays: 90,
        piiRedactionEnabled: true,
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return tenantId;
  },
});

export const getAuth = query({
  args: {},
  handler: async (ctx) => {
    return null;
  },
});
