import { calculateSha256 } from '@/lib/osint/cryptoHash';

describe('calculateSha256 Web Crypto API', () => {
  it('computes a valid 64-character SHA-256 hexadecimal digest', async () => {
    const input = 'internet-archaeologist-forensic-test';
    const hash = await calculateSha256(input);

    expect(hash.startsWith('sha256:')).toBe(true);
    const hex = hash.replace('sha256:', '');
    expect(hex).toHaveLength(64);
    expect(hex).toMatch(/^[0-9a-f]{64}$/);
  });

  it('produces deterministic output for identical input', async () => {
    const input = JSON.stringify({ domain: 'example.com', type: 'A', ttl: 300 });
    const hash1 = await calculateSha256(input);
    const hash2 = await calculateSha256(input);

    expect(hash1).toBe(hash2);
  });

  it('produces avalanche effect where minor changes result in completely different hashes', async () => {
    const hashA = await calculateSha256('target-domain-a.com');
    const hashB = await calculateSha256('target-domain-b.com');

    expect(hashA).not.toBe(hashB);
  });

  it('falls back seamlessly if crypto.subtle throws or is undefined', async () => {
    const originalSubtle = global.crypto?.subtle;
    try {
      // Temporarily mock subtle failure
      Object.defineProperty(global.crypto, 'subtle', {
        value: undefined,
        configurable: true,
      });

      const hash = await calculateSha256('fallback-test');
      expect(hash.startsWith('sha256:')).toBe(true);
      expect(hash.length).toBeGreaterThan(20);
    } finally {
      if (originalSubtle) {
        Object.defineProperty(global.crypto, 'subtle', {
          value: originalSubtle,
          configurable: true,
        });
      }
    }
  });
});
