import { describe, it, expect } from 'vitest';
import { TenantSchema, MessageSchema, SessionSchema } from '../src/types';

describe('TenantSchema', () => {
  it('should validate a valid tenant', () => {
    const tenant = {
      id: 'tenant_123',
      name: 'Acme Corp',
      slug: 'acme-corp',
      organizationId: 'org_123',
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
    };

    expect(() => TenantSchema.parse(tenant)).not.toThrow();
  });

  it('should reject invalid model provider', () => {
    const tenant = {
      id: 'tenant_123',
      name: 'Acme Corp',
      slug: 'acme-corp',
      organizationId: 'org_123',
      settings: {
        defaultModel: 'invalid',
        voiceEnabled: true,
        ragEnabled: true,
        autoEscalateEnabled: false,
        autoEscalateThreshold: 0.5,
        retentionDays: 90,
        piiRedactionEnabled: true,
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    expect(() => TenantSchema.parse(tenant)).toThrow();
  });
});

describe('MessageSchema', () => {
  it('should validate a valid message', () => {
    const message = {
      id: 'msg_123',
      sessionId: 'session_123',
      role: 'user',
      content: 'Hello, I need help!',
      createdAt: Date.now(),
    };

    expect(() => MessageSchema.parse(message)).not.toThrow();
  });

  it('should validate message with metadata', () => {
    const message = {
      id: 'msg_123',
      sessionId: 'session_123',
      role: 'assistant',
      content: 'How can I help you?',
      metadata: {
        model: 'gpt-4o',
        tokens: 150,
        cost: 0.003,
        latency: 1200,
      },
      createdAt: Date.now(),
    };

    expect(() => MessageSchema.parse(message)).not.toThrow();
  });
});

describe('SessionSchema', () => {
  it('should validate an active session', () => {
    const session = {
      id: 'session_123',
      tenantId: 'tenant_123',
      channel: 'widget',
      status: 'active',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    expect(() => SessionSchema.parse(session)).not.toThrow();
  });

  it('should validate an escalated session', () => {
    const session = {
      id: 'session_123',
      tenantId: 'tenant_123',
      channel: 'voice',
      status: 'escalated',
      assignedAgentId: 'agent_123',
      sentiment: -0.5,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    expect(() => SessionSchema.parse(session)).not.toThrow();
  });

  it('should reject invalid sentiment', () => {
    const session = {
      id: 'session_123',
      tenantId: 'tenant_123',
      channel: 'widget',
      status: 'active',
      sentiment: 2,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    expect(() => SessionSchema.parse(session)).toThrow();
  });
});
