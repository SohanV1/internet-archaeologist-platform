/**
 * @jest-environment node
 *
 * Internet Archaeologist Platform v2.1
 * Milestone M3 & M4 (Requirements R3 and R4) Test Suite
 *
 * Verifies:
 * 1. 1-hop crawl depth bounding (max 20 same-domain pages, asset exclusion, external domain exclusion)
 * 2. Broken link capture with anchorText, sourcePage, and statusCode (excluding 403 WAF blocks)
 * 3. Form endpoint discovery with method, HTTPS status, public accessibility, and sourcePage
 * 4. Login form detection and input mapping (username, password, hidden CSRF tokens)
 * 5. Single dummy probe execution with test@invalid.tld / invalidpassword123 and zero retries
 * 6. Error classification (generic_error vs username_enumeration_risk vs rate_limited vs redirected)
 * 7. SSRF protection blocking private IPs from crawl and probe
 */

import { websiteHealthAgent } from '@/lib/agents/websiteHealthAgent';
import { AgentContext, AgentSharedState } from '@/lib/agents/types';
import { isSafeUrlForFetch } from '@/lib/osint/validator';
import { LoginProbeResult, FormEndpoint, BrokenLinkItem } from '@/types/osint';

function createMockContext(domain: string = 'audit-target.com'): AgentContext {
  const sharedState: AgentSharedState = {
    domain,
    targetUrl: `https://${domain}`,
    dnsRecords: [],
    ipAddresses: [],
    subdomains: [],
    certificates: [],
    asnInfo: [],
    snapshots: [],
    technologies: [],
    evidence: [],
    vulnerabilities: [],
  };

  return {
    domain,
    targetUrl: `https://${domain}`,
    sharedState,
    emitTelemetry: jest.fn(),
    emitFinding: jest.fn(),
    emitAudit: jest.fn(),
  };
}

describe('Milestone M3 & M4: Website Health Agent v2.1', () => {
  let originalFetch: typeof global.fetch;

  beforeAll(() => {
    originalFetch = global.fetch;
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==========================================================================
  // 1. 1-Hop Crawl Depth Bounding & Asset Exclusion
  // ==========================================================================
  describe('1-Hop Crawl Depth & Filtering', () => {
    it('bounds 1-hop crawl to at most 20 unique same-domain pages when 35+ links exist', async () => {
      const fetchedUrls: string[] = [];

      global.fetch = jest.fn().mockImplementation((url: string, init?: any) => {
        const urlStr = String(url);
        fetchedUrls.push(urlStr);
        if (init?.method === 'HEAD') {
          return Promise.resolve({ status: 200, ok: true });
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          headers: new Headers({ 'content-type': 'text/html' }),
          text: async () => '<html><body><h3>Subpage</h3></body></html>',
        });
      });

      const linksMarkup = Array.from({ length: 35 }, (_, i) => `<a href="/subpage-${i}">Link ${i}</a>`).join('\n');
      const ctx = createMockContext('crawl-domain.org');
      ctx.sharedState.htmlSample = `
        <html>
          <body>
            <h1>Landing Page</h1>
            ${linksMarkup}
          </body>
        </html>
      `;

      const result = await websiteHealthAgent.execute(ctx);
      expect(result.healthReport.crawledPagesCount).toBeDefined();
      // Total crawled pages = landing page (1) + at most 20 subpages
      expect(result.healthReport.crawledPagesCount).toBeLessThanOrEqual(21);
      expect(result.healthReport.crawledPagesCount).toBeGreaterThan(1);
    });

    it('filters out static assets, media files, and non-navigable schemes from crawl', async () => {
      const requestedSubpages: string[] = [];

      global.fetch = jest.fn().mockImplementation((url: string, init?: any) => {
        const urlStr = String(url);
        if (init?.method === 'GET' && !urlStr.endsWith('crawl-assets.com')) {
          requestedSubpages.push(urlStr);
        }
        if (init?.method === 'HEAD') {
          return Promise.resolve({ status: 200, ok: true });
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          text: async () => '<html><body>Content</body></html>',
        });
      });

      const ctx = createMockContext('crawl-assets.com');
      ctx.sharedState.htmlSample = `
        <html>
          <body>
            <a href="/logo.png">Logo Image</a>
            <a href="/report.pdf">Financial PDF</a>
            <a href="/styles.css">Styles</a>
            <a href="/script.js">Script</a>
            <a href="javascript:void(0)">JS Void</a>
            <a href="mailto:admin@crawl-assets.com">Mailto</a>
            <a href="tel:+18005550199">Phone</a>
            <a href="#section-2">Anchor Fragment</a>
            <a href="/real-subpage">Real HTML Subpage</a>
          </body>
        </html>
      `;

      await websiteHealthAgent.execute(ctx);

      const hasAsset = requestedSubpages.some((u) =>
        /\.(png|pdf|css|js)$/i.test(u) || u.startsWith('javascript:') || u.startsWith('mailto:')
      );
      expect(hasAsset).toBe(false);
      expect(requestedSubpages.some((u) => u.includes('/real-subpage'))).toBe(true);
    });

    it('excludes external out-of-domain links from crawl', async () => {
      const requestedUrls: string[] = [];

      global.fetch = jest.fn().mockImplementation((url: string, init?: any) => {
        const urlStr = String(url);
        if (init?.method === 'GET') {
          requestedUrls.push(urlStr);
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          text: async () => '<html><body>OK</body></html>',
        });
      });

      const ctx = createMockContext('internal-corp.net');
      ctx.sharedState.htmlSample = `
        <html>
          <body>
            <a href="https://external-vendor.com/pricing">External Pricing</a>
            <a href="https://partner.org/api">Partner API</a>
            <a href="/internal-portal">Internal Portal</a>
          </body>
        </html>
      `;

      await websiteHealthAgent.execute(ctx);

      expect(requestedUrls.some((u) => u.includes('external-vendor.com'))).toBe(false);
      expect(requestedUrls.some((u) => u.includes('partner.org'))).toBe(false);
    });
  });

  // ==========================================================================
  // 2. Broken Link Discovery
  // ==========================================================================
  describe('Broken Link Discovery', () => {
    it('discovers broken links (HTTP >= 400), recording anchorText, sourcePage, and statusCode', async () => {
      global.fetch = jest.fn().mockImplementation((url: string, init?: any) => {
        const urlStr = String(url);
        if (init?.method === 'HEAD' && urlStr.includes('/broken-resource')) {
          return Promise.resolve({ status: 404, ok: false });
        }
        if (init?.method === 'HEAD' && urlStr.includes('/server-error')) {
          return Promise.resolve({ status: 500, ok: false });
        }
        return Promise.resolve({
          status: 200,
          ok: true,
          text: async () => '<html><body>OK</body></html>',
        });
      });

      const ctx = createMockContext('link-audit.com');
      ctx.sharedState.htmlSample = `
        <html>
          <body>
            <a href="/broken-resource">Missing Specification Doc</a>
            <a href="/server-error">Legacy Gateway</a>
            <a href="/valid-page">Active Documentation</a>
          </body>
        </html>
      `;

      const result = await websiteHealthAgent.execute(ctx);
      const broken = result.healthReport.brokenLinks;

      const notFoundItem = broken.find((b) => b.url.includes('/broken-resource'));
      expect(notFoundItem).toBeDefined();
      expect(notFoundItem?.statusCode).toBe(404);
      expect(notFoundItem?.anchorText).toContain('Missing Specification Doc');
      expect(notFoundItem?.sourcePage).toBe('https://link-audit.com');

      const serverErrItem = broken.find((b) => b.url.includes('/server-error'));
      expect(serverErrItem).toBeDefined();
      expect(serverErrItem?.statusCode).toBe(500);
      expect(serverErrItem?.anchorText).toContain('Legacy Gateway');
    });

    it('excludes HTTP 403 WAF blocks from broken links list', async () => {
      global.fetch = jest.fn().mockImplementation((url: string, init?: any) => {
        const urlStr = String(url);
        if (init?.method === 'HEAD' && urlStr.includes('/protected-waf')) {
          return Promise.resolve({ status: 403, ok: false });
        }
        return Promise.resolve({
          status: 200,
          ok: true,
          text: async () => '<html><body>OK</body></html>',
        });
      });

      const ctx = createMockContext('waf-target.com');
      ctx.sharedState.htmlSample = `
        <html>
          <body>
            <a href="/protected-waf">Cloudflare Protected Asset</a>
          </body>
        </html>
      `;

      const result = await websiteHealthAgent.execute(ctx);
      const has403 = result.healthReport.brokenLinks.some((l) => l.statusCode === 403);
      expect(has403).toBe(false);
    });
  });

  // ==========================================================================
  // 3. Form Endpoint Discovery
  // ==========================================================================
  describe('Form Endpoint Discovery', () => {
    it('extracts form actions reporting HTTP method, HTTPS status, sourcePage, and reachability', async () => {
      global.fetch = jest.fn().mockImplementation((url: string, init?: any) => {
        const urlStr = String(url);
        if (init?.method === 'HEAD') {
          if (urlStr.includes('/api/v2/checkout')) {
            return Promise.resolve({ status: 200, ok: true });
          }
          if (urlStr.includes('/dead-action')) {
            return Promise.resolve({ status: 404, ok: false });
          }
        }
        return Promise.resolve({
          status: 200,
          ok: true,
          text: async () => '<html><body>OK</body></html>',
        });
      });

      const ctx = createMockContext('forms-test.com');
      ctx.sharedState.htmlSample = `
        <html>
          <body>
            <form action="https://forms-test.com/api/v2/checkout" method="POST">
              <input type="text" name="cart_id" />
            </form>
            <form action="/dead-action" method="GET">
              <input type="text" name="q" />
            </form>
          </body>
        </html>
      `;

      const result = await websiteHealthAgent.execute(ctx);
      expect(result.healthReport.formEndpoints).toBeDefined();
      const endpoints = result.healthReport.formEndpoints!;

      const postForm = endpoints.find((e) => e.actionUrl.includes('/api/v2/checkout'));
      expect(postForm).toBeDefined();
      expect(postForm?.httpMethod).toBe('POST');
      expect(postForm?.isHttps).toBe(true);
      expect(postForm?.isPubliclyAccessible).toBe(true);
      expect(postForm?.sourcePage).toBe('https://forms-test.com');

      const deadForm = endpoints.find((e) => e.actionUrl.includes('/dead-action'));
      expect(deadForm).toBeDefined();
      expect(deadForm?.httpMethod).toBe('GET');
      expect(deadForm?.isPubliclyAccessible).toBe(false);
    });

    it('defaults form method to GET when omitted', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        status: 200,
        ok: true,
        text: async () => '<html><body>OK</body></html>',
      });

      const ctx = createMockContext('default-method.com');
      ctx.sharedState.htmlSample = `
        <html>
          <body>
            <form action="/search">
              <input type="text" name="query" />
            </form>
          </body>
        </html>
      `;

      const result = await websiteHealthAgent.execute(ctx);
      const searchForm = result.healthReport.formEndpoints?.find((e) => e.actionUrl.includes('/search'));
      expect(searchForm).toBeDefined();
      expect(searchForm?.httpMethod).toBe('GET');
    });
  });

  // ==========================================================================
  // 4. Login Form Detection & Input Mapping
  // ==========================================================================
  describe('Login Form Detection & Input Mapping', () => {
    it('identifies username, password, and preserves hidden CSRF tokens', async () => {
      let capturedProbeBody: string | undefined;

      global.fetch = jest.fn().mockImplementation((url: string, init?: any) => {
        if (init?.method === 'POST') {
          capturedProbeBody = String(init?.body);
          return Promise.resolve({
            status: 401,
            ok: false,
            headers: new Headers({ 'content-type': 'application/json' }),
            text: async () => JSON.stringify({ error: 'Invalid username or password' }),
          });
        }
        return Promise.resolve({
          status: 200,
          ok: true,
          text: async () => '<html><body>OK</body></html>',
        });
      });

      const ctx = createMockContext('auth-mapping.com');
      ctx.sharedState.htmlSample = `
        <html>
          <body>
            <form action="https://auth-mapping.com/api/login" method="POST">
              <input type="hidden" name="csrf_token" value="sec_token_987xyz" />
              <input type="hidden" name="session_nonce" value="nonce_456" />
              <input type="text" name="user_email" autocomplete="username" />
              <input type="password" name="user_secret" autocomplete="current-password" />
              <button type="submit">Sign In</button>
            </form>
          </body>
        </html>
      `;

      const result = await websiteHealthAgent.execute(ctx);
      expect(capturedProbeBody).toBeDefined();
      const params = new URLSearchParams(capturedProbeBody!);

      // Verifies hidden CSRF tokens are retained
      expect(params.get('csrf_token')).toBe('sec_token_987xyz');
      expect(params.get('session_nonce')).toBe('nonce_456');
      // Verifies username and password inputs were mapped and populated with dummy credentials
      expect(params.get('user_email')).toBe('test@invalid.tld');
      expect(params.get('user_secret')).toBe('invalidpassword123');

      expect(result.healthReport.loginFormHygiene[0].hasPasswordInput).toBe(true);
      expect(result.healthReport.loginFormHygiene[0].hasCsrfToken).toBe(true);
    });

    it('identifies preceding input as username when explicit username attribute is missing', async () => {
      let capturedBody: string | undefined;

      global.fetch = jest.fn().mockImplementation((url: string, init?: any) => {
        if (init?.method === 'POST') {
          capturedBody = String(init?.body);
          return Promise.resolve({
            status: 401,
            ok: false,
            text: async () => 'Authentication failed',
          });
        }
        return Promise.resolve({
          status: 200,
          ok: true,
          text: async () => '<html><body>OK</body></html>',
        });
      });

      const ctx = createMockContext('anonymous-inputs.com');
      ctx.sharedState.htmlSample = `
        <html>
          <body>
            <form action="https://anonymous-inputs.com/auth" method="POST">
              <input type="text" name="custom_id_field" />
              <input type="password" name="key_pass" />
            </form>
          </body>
        </html>
      `;

      await websiteHealthAgent.execute(ctx);
      expect(capturedBody).toBeDefined();
      const params = new URLSearchParams(capturedBody!);
      expect(params.get('custom_id_field')).toBe('test@invalid.tld');
      expect(params.get('key_pass')).toBe('invalidpassword123');
    });
  });

  // ==========================================================================
  // 5. Single Dummy Probe Execution & Safeguards
  // ==========================================================================
  describe('Single Dummy Probe Execution', () => {
    it('executes exactly ONE probe per form using RFC 2606 dummy credentials with zero retries', async () => {
      let postCallCount = 0;

      global.fetch = jest.fn().mockImplementation((url: string, init?: any) => {
        if (init?.method === 'POST') {
          postCallCount++;
          return Promise.resolve({
            status: 401,
            ok: false,
            text: async () => 'Invalid credentials',
          });
        }
        return Promise.resolve({
          status: 200,
          ok: true,
          text: async () => '<html><body>OK</body></html>',
        });
      });

      const ctx = createMockContext('safe-probe.com');
      ctx.sharedState.htmlSample = `
        <html>
          <body>
            <form action="https://safe-probe.com/login" method="POST">
              <input type="text" name="username" />
              <input type="password" name="password" />
            </form>
          </body>
        </html>
      `;

      const result = await websiteHealthAgent.execute(ctx);
      // Strictly 1 attempt, zero retry loops
      expect(postCallCount).toBe(1);

      expect(result.healthReport.loginProbeResults).toBeDefined();
      expect(result.healthReport.loginProbeResults!.length).toBe(1);
      const probe = result.healthReport.loginProbeResults![0];
      expect(probe.dummyCredentialUsed).toBe('test@invalid.tld');
      expect(probe.httpStatus).toBe(401);
      expect(probe.responseTimeMs).toBeGreaterThanOrEqual(0);
    });
  });

  // ==========================================================================
  // 6. Error Pattern Classification
  // ==========================================================================
  describe('OWASP Error Pattern Classification', () => {
    it('classifies generic failure as generic_error (OWASP compliant)', async () => {
      global.fetch = jest.fn().mockImplementation((url: string, init?: any) => {
        if (init?.method === 'POST') {
          return Promise.resolve({
            status: 401,
            ok: false,
            headers: new Headers({ 'content-type': 'application/json' }),
            text: async () => JSON.stringify({ message: 'Invalid username or password' }),
          });
        }
        return Promise.resolve({ status: 200, ok: true, text: async () => '<html><body>OK</body></html>' });
      });

      const ctx = createMockContext('generic-fail.com');
      ctx.sharedState.htmlSample = `
        <html><body><form action="https://generic-fail.com/login" method="POST"><input type="password" name="p" /></form></body></html>
      `;

      const result = await websiteHealthAgent.execute(ctx);
      const probe = result.healthReport.loginProbeResults![0];
      expect(probe.errorPattern).toBe('generic_error');
      expect(probe.enumerationRiskDetected).toBe(false);
      expect(probe.extractedErrorText).toContain('Invalid username or password');
    });

    it('classifies account leakage as username_enumeration_risk', async () => {
      global.fetch = jest.fn().mockImplementation((url: string, init?: any) => {
        if (init?.method === 'POST') {
          return Promise.resolve({
            status: 404,
            ok: false,
            headers: new Headers({ 'content-type': 'text/html' }),
            text: async () => '<div class="alert alert-danger">No account registered with this email address.</div>',
          });
        }
        return Promise.resolve({ status: 200, ok: true, text: async () => '<html><body>OK</body></html>' });
      });

      const ctx = createMockContext('leak-target.com');
      ctx.sharedState.htmlSample = `
        <html><body><form action="https://leak-target.com/login" method="POST"><input type="password" name="p" /></form></body></html>
      `;

      const result = await websiteHealthAgent.execute(ctx);
      const probe = result.healthReport.loginProbeResults![0];
      expect(probe.errorPattern).toBe('username_enumeration_risk');
      expect(probe.enumerationRiskDetected).toBe(true);
      expect(probe.extractedErrorText).toContain('No account registered with this email address');
    });

    it('classifies HTTP 429 response as rate_limited', async () => {
      global.fetch = jest.fn().mockImplementation((url: string, init?: any) => {
        if (init?.method === 'POST') {
          return Promise.resolve({
            status: 429,
            ok: false,
            text: async () => 'Too many login attempts. Please try again later.',
          });
        }
        return Promise.resolve({ status: 200, ok: true, text: async () => '<html><body>OK</body></html>' });
      });

      const ctx = createMockContext('ratelimit-target.com');
      ctx.sharedState.htmlSample = `
        <html><body><form action="https://ratelimit-target.com/login" method="POST"><input type="password" name="p" /></form></body></html>
      `;

      const result = await websiteHealthAgent.execute(ctx);
      const probe = result.healthReport.loginProbeResults![0];
      expect(probe.errorPattern).toBe('rate_limited');
      expect(probe.enumerationRiskDetected).toBe(false);
    });

    it('classifies HTTP 302 redirect response as redirected', async () => {
      global.fetch = jest.fn().mockImplementation((url: string, init?: any) => {
        if (init?.method === 'POST') {
          return Promise.resolve({
            status: 302,
            ok: false,
            headers: new Headers({ location: '/auth/failure' }),
            text: async () => '',
          });
        }
        return Promise.resolve({ status: 200, ok: true, text: async () => '<html><body>OK</body></html>' });
      });

      const ctx = createMockContext('redirect-target.com');
      ctx.sharedState.htmlSample = `
        <html><body><form action="https://redirect-target.com/login" method="POST"><input type="password" name="p" /></form></body></html>
      `;

      const result = await websiteHealthAgent.execute(ctx);
      const probe = result.healthReport.loginProbeResults![0];
      expect(probe.errorPattern).toBe('redirected');
    });
  });

  // ==========================================================================
  // 7. SSRF Protection Guard
  // ==========================================================================
  describe('SSRF Protection Guard', () => {
    it('blocks crawl links pointing to private IP addresses and loopback', () => {
      const dangerousUrls = [
        'http://127.0.0.1:8080/admin',
        'http://localhost/config',
        'http://169.254.169.254/latest/meta-data',
        'http://10.0.0.5/internal',
        'http://192.168.1.100/status',
      ];

      dangerousUrls.forEach((url) => {
        const check = isSafeUrlForFetch(url);
        expect(check.safe).toBe(false);
      });
    });

    it('prevents dummy login probe from executing against internal or metadata endpoints', async () => {
      let outboundFetchMade = false;

      global.fetch = jest.fn().mockImplementation((url: string, init?: any) => {
        if (init?.method === 'POST') {
          outboundFetchMade = true;
        }
        return Promise.resolve({
          status: 200,
          ok: true,
          text: async () => '<html><body>OK</body></html>',
        });
      });

      const ctx = createMockContext('ssrf-login-test.com');
      ctx.sharedState.htmlSample = `
        <html>
          <body>
            <form action="http://169.254.169.254/latest/meta-data" method="POST">
              <input type="password" name="pass" />
            </form>
          </body>
        </html>
      `;

      const result = await websiteHealthAgent.execute(ctx);
      // Ensure no POST fetch was executed against the private IP
      expect(outboundFetchMade).toBe(false);
      expect(result.healthReport.loginProbeResults).toBeDefined();
      const probe = result.healthReport.loginProbeResults![0];
      expect(probe.notes).toContain('Blocked by SSRF protection');
    });
  });
});
