import { describe, it, expect } from 'vitest';
import {
  slugify,
  sanitizeHtml,
  redactPII,
  calculateCost,
  truncate,
  formatBytes,
  formatDuration,
  chunk,
  groupBy,
  sleep,
} from '../src/utils';

describe('slugify', () => {
  it('should convert text to slug', () => {
    expect(slugify('Hello World')).toBe('hello-world');
    expect(slugify('Test@#$%String')).toBe('teststring');
    expect(slugify('  Spaces  ')).toBe('spaces');
  });
});

describe('sanitizeHtml', () => {
  it('should escape HTML entities', () => {
    expect(sanitizeHtml('<script>alert("xss")</script>')).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;'
    );
  });
});

describe('redactPII', () => {
  it('should redact email addresses', () => {
    expect(redactPII('Contact me at test@example.com')).toBe(
      'Contact me at [EMAIL_REDACTED]'
    );
  });

  it('should redact phone numbers', () => {
    expect(redactPII('Call 555-123-4567')).toBe('Call [PHONE_REDACTED]');
  });

  it('should redact SSN', () => {
    expect(redactPII('SSN: 123-45-6789')).toBe('SSN: [SSN_REDACTED]');
  });

  it('should redact credit cards', () => {
    expect(redactPII('Card: 1234 5678 9012 3456')).toBe('Card: [CARD_REDACTED]');
  });
});

describe('calculateCost', () => {
  it('should calculate OpenAI costs', () => {
    const cost = calculateCost('openai', 'gpt-4o', 1000, 500);
    expect(cost).toBeGreaterThan(0);
  });

  it('should calculate Anthropic costs', () => {
    const cost = calculateCost('anthropic', 'claude-3-5-sonnet-20241022', 1000, 500);
    expect(cost).toBeGreaterThan(0);
  });

  it('should return 0 for unknown models', () => {
    const cost = calculateCost('unknown', 'model', 1000, 500);
    expect(cost).toBe(0);
  });
});

describe('truncate', () => {
  it('should truncate long strings', () => {
    expect(truncate('This is a long string', 10)).toBe('This is...');
  });

  it('should not truncate short strings', () => {
    expect(truncate('Short', 10)).toBe('Short');
  });
});

describe('formatBytes', () => {
  it('should format bytes correctly', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(1024)).toBe('1.00 KB');
    expect(formatBytes(1048576)).toBe('1.00 MB');
  });
});

describe('formatDuration', () => {
  it('should format milliseconds', () => {
    expect(formatDuration(500)).toBe('500ms');
  });

  it('should format seconds', () => {
    expect(formatDuration(5000)).toBe('5.0s');
  });

  it('should format minutes', () => {
    expect(formatDuration(120000)).toBe('2.0m');
  });
});

describe('chunk', () => {
  it('should split array into chunks', () => {
    const result = chunk([1, 2, 3, 4, 5], 2);
    expect(result).toEqual([[1, 2], [3, 4], [5]]);
  });
});

describe('groupBy', () => {
  it('should group array by key', () => {
    const data = [
      { type: 'a', value: 1 },
      { type: 'b', value: 2 },
      { type: 'a', value: 3 },
    ];
    const result = groupBy(data, 'type');
    expect(result.a).toHaveLength(2);
    expect(result.b).toHaveLength(1);
  });
});

describe('sleep', () => {
  it('should wait for specified time', async () => {
    const start = Date.now();
    await sleep(100);
    const elapsed = Date.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(90);
  });
});
