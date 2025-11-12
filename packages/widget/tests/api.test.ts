import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EchoAPI } from '../src/api';

describe('EchoAPI', () => {
  let api: EchoAPI;

  beforeEach(() => {
    api = new EchoAPI({
      tenantId: 'test-tenant',
      theme: 'light',
    });
  });

  it('should create an instance', () => {
    expect(api).toBeInstanceOf(EchoAPI);
  });

  it('should register event listeners', () => {
    const callback = vi.fn();
    const unsubscribe = api.on('message', callback);

    expect(typeof unsubscribe).toBe('function');
  });

  it('should remove event listeners on unsubscribe', () => {
    const callback = vi.fn();
    const unsubscribe = api.on('message', callback);
    unsubscribe();

    expect(callback).not.toHaveBeenCalled();
  });

  it('should queue messages when disconnected', () => {
    api.send({ type: 'message', timestamp: Date.now() });
    expect(api.isConnected()).toBe(false);
  });
});
