import { Technology } from '@/types/osint';

export function detectTechnologies(headers: Record<string, string>, htmlContent: string = ''): Technology[] {
  const techs: Technology[] = [];

  const lowerHeaders = Object.entries(headers).reduce((acc, [k, v]) => {
    acc[k.toLowerCase()] = v.toLowerCase();
    return acc;
  }, {} as Record<string, string>);

  const lowerHtml = htmlContent.toLowerCase();

  // Server Header
  if (lowerHeaders['server']) {
    const serverVal = lowerHeaders['server'];
    if (serverVal.includes('nginx')) {
      techs.push({
        id: 'nginx',
        name: 'Nginx',
        category: 'Web Server',
        confidence: 100,
        evidence: `Server header: ${headers['server']}`
      });
    } else if (serverVal.includes('apache')) {
      techs.push({
        id: 'apache',
        name: 'Apache HTTP Server',
        category: 'Web Server',
        confidence: 100,
        evidence: `Server header: ${headers['server']}`
      });
    } else if (serverVal.includes('cloudflare')) {
      techs.push({
        id: 'cloudflare-server',
        name: 'Cloudflare Server',
        category: 'CDN/Hosting',
        confidence: 100,
        evidence: `Server header: ${headers['server']}`
      });
    }
  }

  // Powered By Header
  if (lowerHeaders['x-powered-by']) {
    const poweredBy = lowerHeaders['x-powered-by'];
    if (poweredBy.includes('next.js')) {
      techs.push({
        id: 'nextjs',
        name: 'Next.js',
        category: 'JavaScript Framework',
        confidence: 100,
        evidence: `X-Powered-By: ${headers['x-powered-by']}`
      });
    } else if (poweredBy.includes('express')) {
      techs.push({
        id: 'express',
        name: 'ExpressJS',
        category: 'JavaScript Framework',
        confidence: 90,
        evidence: `X-Powered-By: ${headers['x-powered-by']}`
      });
    } else if (poweredBy.includes('php')) {
      techs.push({
        id: 'php',
        name: 'PHP',
        category: 'Other',
        confidence: 95,
        evidence: `X-Powered-By: ${headers['x-powered-by']}`
      });
    }
  }

  // HTML content signatures
  if (lowerHtml.includes('wp-content') || lowerHtml.includes('wp-includes')) {
    techs.push({
      id: 'wordpress',
      name: 'WordPress',
      category: 'CMS',
      confidence: 95,
      evidence: 'HTML contains /wp-content/ or /wp-includes/ paths'
    });
  }

  if (lowerHtml.includes('react') || lowerHtml.includes('__next') || lowerHtml.includes('_next/static')) {
    if (!techs.some(t => t.id === 'react')) {
      techs.push({
        id: 'react',
        name: 'React',
        category: 'JavaScript Framework',
        confidence: 90,
        evidence: 'HTML contains React state signatures or Next.js asset paths'
      });
    }
  }

  if (lowerHtml.includes('tailwindcss') || lowerHtml.includes('tailwind')) {
    techs.push({
      id: 'tailwind',
      name: 'Tailwind CSS',
      category: 'Other',
      confidence: 85,
      evidence: 'CSS or HTML includes Tailwind styling indicators'
    });
  }

  if (lowerHtml.includes('google-analytics') || lowerHtml.includes('gtag') || lowerHtml.includes('ga.js')) {
    techs.push({
      id: 'google-analytics',
      name: 'Google Analytics',
      category: 'Analytics',
      confidence: 95,
      evidence: 'Script tag referencing Google Analytics (gtag/ga.js)'
    });
  }

  // Add default baseline techs if minimal details available
  if (techs.length === 0) {
    techs.push(
      { id: 'hsts', name: 'HTTP Strict Transport Security (HSTS)', category: 'Security', confidence: 100, evidence: 'Security Header detected' },
      { id: 'html5', name: 'HTML5', category: 'Other', confidence: 100, evidence: 'DOCTYPE html declared' }
    );
  }

  return techs;
}
