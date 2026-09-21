import { validateAndSanitizeDomain } from '@/lib/osint/validator';

describe('Security & Domain Validator (validateAndSanitizeDomain)', () => {
  describe('Valid Domain Scenarios', () => {
    it('accepts standard FQDNs', () => {
      const res = validateAndSanitizeDomain('github.com');
      expect(res.isValid).toBe(true);
      expect(res.sanitizedDomain).toBe('github.com');
    });

    it('strips schemes and trailing paths', () => {
      const res = validateAndSanitizeDomain('https://sub.domain.co.uk/path/to/page?query=1#frag');
      expect(res.isValid).toBe(true);
      expect(res.sanitizedDomain).toBe('sub.domain.co.uk');
    });

    it('strips ports and trailing dots', () => {
      const res = validateAndSanitizeDomain('api.example.org:8443.');
      expect(res.isValid).toBe(true);
      expect(res.sanitizedDomain).toBe('api.example.org');
    });

    it('normalizes uppercase to lowercase', () => {
      const res = validateAndSanitizeDomain('ClOuDfLaRe.CoM');
      expect(res.isValid).toBe(true);
      expect(res.sanitizedDomain).toBe('cloudflare.com');
    });
  });

  describe('SSRF & Malicious Payload Mitigation', () => {
    it('blocks loopback IP addresses (127.0.0.1)', () => {
      const res = validateAndSanitizeDomain('127.0.0.1');
      expect(res.isValid).toBe(false);
      expect(res.error).toMatch(/private, loopback, or non-routable/i);
    });

    it('blocks cloud metadata endpoint (169.254.169.254)', () => {
      const res = validateAndSanitizeDomain('http://169.254.169.254/latest/meta-data/');
      expect(res.isValid).toBe(false);
      expect(res.riskFlags).toContain('SSRF_PRIVATE_IP_BLOCK');
    });

    it('blocks private class A (10.0.0.1)', () => {
      const res = validateAndSanitizeDomain('10.10.1.5');
      expect(res.isValid).toBe(false);
      expect(res.riskFlags).toContain('SSRF_PRIVATE_IP_BLOCK');
    });

    it('blocks private class C (192.168.1.1)', () => {
      const res = validateAndSanitizeDomain('192.168.1.1');
      expect(res.isValid).toBe(false);
      expect(res.riskFlags).toContain('SSRF_PRIVATE_IP_BLOCK');
    });

    it('blocks internal hostnames like localhost', () => {
      const res = validateAndSanitizeDomain('localhost');
      expect(res.isValid).toBe(false);
      expect(res.riskFlags).toContain('RESTRICTED_INTERNAL_HOSTNAME');
    });

    it('blocks internal TLDs (.local, .internal, .lan)', () => {
      expect(validateAndSanitizeDomain('service.internal').isValid).toBe(false);
      expect(validateAndSanitizeDomain('printer.local').isValid).toBe(false);
      expect(validateAndSanitizeDomain('router.lan').isValid).toBe(false);
    });

    it('rejects command injection characters and special symbols', () => {
      const injection1 = validateAndSanitizeDomain('google.com; rm -rf /');
      expect(injection1.isValid).toBe(false);

      const injection2 = validateAndSanitizeDomain('example.com`whoami`');
      expect(injection2.isValid).toBe(false);

      const injection3 = validateAndSanitizeDomain('target.com && curl http://evil.com');
      expect(injection3.isValid).toBe(false);
    });

    it('rejects empty, null, or non-string inputs', () => {
      expect(validateAndSanitizeDomain('').isValid).toBe(false);
      expect(validateAndSanitizeDomain(null).isValid).toBe(false);
      expect(validateAndSanitizeDomain(undefined).isValid).toBe(false);
      expect(validateAndSanitizeDomain(12345).isValid).toBe(false);
    });
  });
});
