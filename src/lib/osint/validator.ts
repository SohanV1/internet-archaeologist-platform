/**
 * Security & Input Validation Engine
 * Implements RFC 1035 / RFC 1123 domain validation, SSRF prevention,
 * and malicious payload neutralization for passive OSINT reconnaissance.
 */

// Blocked private/reserved IPv4 CIDR regexes and representations
const PRIVATE_IPV4_PATTERNS = [
  /^127\./,                         // Loopback (127.0.0.0/8)
  /^10\./,                          // Private class A (10.0.0.0/8)
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // Private class B (172.16.0.0/12)
  /^192\.168\./,                    // Private class C (192.168.0.0/16)
  /^169\.254\./,                    // Link-local / Cloud Metadata (169.254.0.0/16)
  /^0\./,                           // Broadcast / Zero network
  /^100\.(6[4-9]|[7-9][0-9]|1[0-1][0-9]|12[0-7])\./, // Carrier-grade NAT (100.64.0.0/10)
  /^192\.0\.2\./,                   // TEST-NET-1
  /^198\.51\.100\./,                // TEST-NET-2
  /^203\.0\.113\./,                 // TEST-NET-3
  /^22[4-9]\./,                     // Multicast
  /^2[3-5][0-9]\./,                 // Reserved / Multicast
];

// Blocked TLDs and hostnames often used for internal reconnaissance or cloud metadata
const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  'metadata.google.internal',
  'metadata.local',
  'instance-data',
  'instance-data.ec2.internal',
]);

const BLOCKED_INTERNAL_TLDS = [
  '.local',
  '.internal',
  '.lan',
  '.corp',
  '.home',
  '.intranet',
  '.test',
  '.invalid',
  '.localhost',
];

// Strict RFC-compliant domain regex (labels 1-63 chars, letters/numbers/hyphen, valid TLD)
const RFC_DOMAIN_REGEX =
  /^(?!-)[a-zA-Z0-9-]{1,63}(?<!-)(\.[a-zA-Z0-9-]{1,63}(?<!-))*\.[a-zA-Z]{2,63}$/;

export interface ValidationResult {
  isValid: boolean;
  sanitizedDomain?: string;
  error?: string;
  riskFlags?: string[];
}

/**
 * Sanitizes and strictly validates a target domain string to eliminate SSRF,
 * command injection, and invalid query inputs.
 */
export function validateAndSanitizeDomain(rawInput: unknown): ValidationResult {
  if (!rawInput || typeof rawInput !== 'string') {
    return {
      isValid: false,
      error: 'Domain input must be a non-empty string.',
    };
  }

  // Strip protocols, ports, trailing paths, query strings, and whitespace
  let domain = rawInput
    .trim()
    .toLowerCase()
    .replace(/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//, '') // Remove schemes like http://, https://, file://, gopher://
    .replace(/[/?#].*$/, '')                     // Remove path, query string, fragments
    .replace(/^\.+|\.+$/g, '')                   // Trim dots before checking port
    .replace(/:\d+$/, '')                        // Remove port numbers (e.g. :8080)
    .replace(/^\.+|\.+$/g, '');                  // Trim leading/trailing dots

  if (!domain) {
    return {
      isValid: false,
      error: 'Invalid target: empty domain after normalization.',
    };
  }

  // Length constraint according to RFC 1035
  if (domain.length > 253) {
    return {
      isValid: false,
      error: 'Domain length exceeds RFC maximum of 253 characters.',
    };
  }

  // Explicit check for disallowed characters (prevent shell / SQL / path traversal injections)
  if (/[^a-z0-9.-]/i.test(domain)) {
    return {
      isValid: false,
      error: 'Domain contains invalid characters. Only alphanumeric, dots, and hyphens are permitted.',
    };
  }

  // Check against exact blocked hostnames
  if (BLOCKED_HOSTNAMES.has(domain)) {
    return {
      isValid: false,
      error: `Access denied: '${domain}' is a restricted internal or cloud infrastructure hostname.`,
      riskFlags: ['RESTRICTED_INTERNAL_HOSTNAME'],
    };
  }

  // Check against internal / private TLDs
  for (const tld of BLOCKED_INTERNAL_TLDS) {
    if (domain.endsWith(tld) || domain === tld.slice(1)) {
      return {
        isValid: false,
        error: `Access denied: '${domain}' uses an internal or non-routable top-level domain.`,
        riskFlags: ['NON_ROUTABLE_TLD'],
      };
    }
  }

  // Check if input is an IPv4 address
  const isIpv4 = /^(\d{1,3}\.){3}\d{1,3}$/.test(domain);
  if (isIpv4) {
    for (const pattern of PRIVATE_IPV4_PATTERNS) {
      if (pattern.test(domain)) {
        return {
          isValid: false,
          error: `Access denied: Target IP '${domain}' belongs to a private, loopback, or non-routable address space.`,
          riskFlags: ['SSRF_PRIVATE_IP_BLOCK'],
        };
      }
    }
    // Even public IP addresses are discouraged as OSINT domain targets
    return {
      isValid: false,
      error: `Input is an IP address ('${domain}'). Internet Archaeologist requires a fully qualified domain name (FQDN).`,
    };
  }

  // Check if input looks like an IPv6 address
  if (domain.includes(':') || domain.startsWith('[') || domain === '::1') {
    return {
      isValid: false,
      error: 'IPv6 addresses are not supported as domain targets. Please enter a valid FQDN.',
      riskFlags: ['IPV6_UNSUPPORTED'],
    };
  }

  // Enforce standard FQDN format
  if (!RFC_DOMAIN_REGEX.test(domain)) {
    return {
      isValid: false,
      error: `'${domain}' is not a valid fully qualified domain name (e.g., example.com).`,
    };
  }

  return {
    isValid: true,
    sanitizedDomain: domain,
  };
}
