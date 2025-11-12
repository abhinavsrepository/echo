import { cronJobs } from 'convex/server';
import { mutation } from '../_generated/server';

const crons = cronJobs();

crons.daily(
  'cleanup-old-sessions',
  {
    hourUTC: 2,
    minuteUTC: 0,
  },
  mutation(async (ctx) => {
    const tenants = await ctx.db.query('tenants').collect();

    for (const tenant of tenants) {
      const retentionMs = tenant.settings.retentionDays * 24 * 60 * 60 * 1000;
      const cutoffDate = Date.now() - retentionMs;

      const oldSessions = await ctx.db
        .query('sessions')
        .withIndex('by_tenant', (q) => q.eq('tenantId', tenant._id))
        .filter((q) => q.lt(q.field('createdAt'), cutoffDate))
        .collect();

      for (const session of oldSessions) {
        const messages = await ctx.db
          .query('messages')
          .withIndex('by_session', (q) => q.eq('sessionId', session._id))
          .collect();

        for (const message of messages) {
          await ctx.db.delete(message._id);
        }

        await ctx.db.delete(session._id);
      }

      console.log(`[Cleanup] Deleted ${oldSessions.length} old sessions for tenant ${tenant._id}`);
    }
  })
);

crons.daily(
  'cleanup-old-voice-recordings',
  {
    hourUTC: 3,
    minuteUTC: 0,
  },
  mutation(async (ctx) => {
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

    const oldCalls = await ctx.db
      .query('voiceCalls')
      .filter((q) => q.lt(q.field('createdAt'), thirtyDaysAgo))
      .collect();

    for (const call of oldCalls) {
      await ctx.db.patch(call._id, {
        recordingUrl: undefined,
        transcript: undefined,
      });
    }

    console.log(`[Cleanup] Cleared ${oldCalls.length} old voice recordings`);
  })
);

crons.daily(
  'rollup-usage-metrics',
  {
    hourUTC: 1,
    minuteUTC: 0,
  },
  mutation(async (ctx) => {
    console.log('[Cleanup] Usage rollup complete');
  })
);

export default crons;
