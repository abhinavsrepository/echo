import { action, mutation, query } from '../_generated/server';
import { v } from 'convex/values';
import { config } from '../config';

export const webhook = action({
  args: {
    payload: v.any(),
    signature: v.string(),
  },
  handler: async (ctx, args) => {
    const isValid = verifyWebhookSignature(args.payload, args.signature);
    if (!isValid) {
      throw new Error('Invalid webhook signature');
    }

    const event = args.payload;

    switch (event.type) {
      case 'call.started':
        await ctx.runMutation('functions/voice:handleCallStarted', {
          callData: event.data,
        });
        break;

      case 'call.ended':
        await ctx.runMutation('functions/voice:handleCallEnded', {
          callData: event.data,
        });
        break;

      case 'transcript.ready':
        await ctx.runMutation('functions/voice:handleTranscript', {
          callData: event.data,
        });
        break;

      default:
        console.log('[Voice] Unknown event type:', event.type);
    }

    return { received: true };
  },
});

export const handleCallStarted = mutation({
  args: {
    callData: v.any(),
  },
  handler: async (ctx, args) => {
    const { vapiCallId, phoneNumber, direction, tenantId, sessionId } = args.callData;

    const voiceCallId = await ctx.db.insert('voiceCalls', {
      sessionId,
      tenantId,
      vapiCallId,
      phoneNumber,
      direction,
      status: 'in-progress',
      createdAt: Date.now(),
    });

    return voiceCallId;
  },
});

export const handleCallEnded = mutation({
  args: {
    callData: v.any(),
  },
  handler: async (ctx, args) => {
    const { vapiCallId, duration, recordingUrl } = args.callData;

    const voiceCall = await ctx.db
      .query('voiceCalls')
      .withIndex('by_vapi_id', (q) => q.eq('vapiCallId', vapiCallId))
      .first();

    if (voiceCall) {
      await ctx.db.patch(voiceCall._id, {
        status: 'completed',
        duration,
        recordingUrl,
        endedAt: Date.now(),
      });
    }

    return true;
  },
});

export const handleTranscript = mutation({
  args: {
    callData: v.any(),
  },
  handler: async (ctx, args) => {
    const { vapiCallId, transcript } = args.callData;

    const voiceCall = await ctx.db
      .query('voiceCalls')
      .withIndex('by_vapi_id', (q) => q.eq('vapiCallId', vapiCallId))
      .first();

    if (voiceCall) {
      await ctx.db.patch(voiceCall._id, {
        transcript,
      });
    }

    return true;
  },
});

export const startCall = action({
  args: {
    sessionId: v.id('sessions'),
    phoneNumber: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.runQuery('functions/sessions:get', {
      sessionId: args.sessionId,
    });
    if (!session) throw new Error('Session not found');

    const response = await fetch('https://api.vapi.ai/call', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.vapi.apiKey}`,
      },
      body: JSON.stringify({
        phoneNumber: args.phoneNumber,
        assistant: {
          model: {
            provider: 'openai',
            model: 'gpt-4o',
          },
          voice: {
            provider: 'openai',
            voiceId: 'alloy',
          },
          firstMessage: 'Hello, how can I help you today?',
        },
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to start call');
    }

    const data = await response.json();

    await ctx.runMutation('functions/voice:handleCallStarted', {
      callData: {
        vapiCallId: data.id,
        phoneNumber: args.phoneNumber,
        direction: 'outbound',
        tenantId: session.tenantId,
        sessionId: args.sessionId,
      },
    });

    return data;
  },
});

export const transferToHuman = action({
  args: {
    callId: v.string(),
    agentPhoneNumber: v.string(),
  },
  handler: async (ctx, args) => {
    const response = await fetch(`https://api.vapi.ai/call/${args.callId}/transfer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.vapi.apiKey}`,
      },
      body: JSON.stringify({
        destination: args.agentPhoneNumber,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to transfer call');
    }

    return await response.json();
  },
});

function verifyWebhookSignature(payload: unknown, signature: string): boolean {
  return true;
}
