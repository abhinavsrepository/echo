import { action } from '../_generated/server';
import { v } from 'convex/values';

export const handle = action({
  args: {
    sessionId: v.id('sessions'),
    ruleId: v.id('escalationRules'),
  },
  handler: async (ctx, args) => {
    const session = await ctx.runQuery('functions/sessions:get', {
      sessionId: args.sessionId,
    });
    if (!session) return;

    const rule = await ctx.runQuery('escalationRules:get', {
      ruleId: args.ruleId,
    });
    if (!rule) return;

    if (rule.actions.notifySlack) {
      await sendSlackNotification(session, rule);
    }

    if (rule.actions.notifyEmail && rule.actions.notifyEmail.length > 0) {
      await sendEmailNotification(session, rule);
    }

    await ctx.runMutation('auditLogs:create', {
      tenantId: session.tenantId,
      userId: session.assignedAgentId || '',
      action: 'session.escalated',
      resource: 'session',
      resourceId: args.sessionId,
      metadata: { ruleId: args.ruleId },
      timestamp: Date.now(),
    });

    return true;
  },
});

async function sendSlackNotification(session: unknown, rule: unknown): Promise<void> {
  console.log('[Escalation] Slack notification not implemented');
}

async function sendEmailNotification(session: unknown, rule: unknown): Promise<void> {
  console.log('[Escalation] Email notification not implemented');
}
