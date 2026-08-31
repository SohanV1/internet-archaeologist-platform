import { Technology, ConfidenceLevel, ObservationNature } from '@/types/osint';

function getConfidenceLevel(score: number): ConfidenceLevel {
  if (score >= 90) return 'HIGH';
  if (score >= 70) return 'MEDIUM';
  if (score >= 40) return 'LOW';
  return 'UNKNOWN';
}

export function detectTechnologies(headers: Record<string, string>, htmlContent: string = ''): Technology[] {
  const techs: Technology[] = [];

  const lowerHeaders = Object.entries(headers).reduce((acc, [k, v]) => {
    acc[k.toLowerCase()] = v.toLowerCase();
    return acc;
  }, {} as Record<string, string>);

  const lowerHtml = htmlContent.toLowerCase();

  // Server Header (OBSERVED fact directly from protocol response)
  if (lowerHeaders['server']) {
    const serverVal = lowerHeaders['server'];
    if (serverVal.includes('nginx')) {
      techs.push({
        id: 'nginx',
        name: 'Nginx',
        category: 'Web Server',
        confidence: 100,
        confidenceLevel: 'HIGH',
        observationNature: 'OBSERVED',
        evidence: `Server header: ${headers['server']}`,
        evidenceId: 'ev-tech-nginx'
      });
    } else if (serverVal.includes('apache')) {
      techs.push({
        id: 'apache',
        name: 'Apache HTTP Server',
        category: 'Web Server',
        confidence: 100,
        confidenceLevel: 'HIGH',
        observationNature: 'OBSERVED',
        evidence: `Server header: ${headers['server']}`,
        evidenceId: 'ev-tech-apache'
      });
    } else if (serverVal.includes('cloudflare')) {
      techs.push({
        id: 'cloudflare-server',
        name: 'Cloudflare Server',
        category: 'CDN/Hosting',
        confidence: 100,
        confidenceLevel: 'HIGH',
        observationNature: 'OBSERVED',
        evidence: `Server header: ${headers['server']}`,
        evidenceId: 'ev-tech-cloudflare-server'
      });
    }
  }

  // Powered By Header (OBSERVED fact directly from header)
  if (lowerHeaders['x-powered-by']) {
    const poweredBy = lowerHeaders['x-powered-by'];
    if (poweredBy.includes('next.js')) {
      techs.push({
        id: 'nextjs',
        name: 'Next.js',
        category: 'JavaScript Framework',
        confidence: 100,
        confidenceLevel: 'HIGH',
        observationNature: 'OBSERVED',
        evidence: `X-Powered-By: ${headers['x-powered-by']}`,
        evidenceId: 'ev-tech-nextjs'
      });
    } else if (poweredBy.includes('express')) {
      techs.push({
        id: 'express',
        name: 'ExpressJS',
        category: 'JavaScript Framework',
        confidence: 90,
        confidenceLevel: 'HIGH',
        observationNature: 'OBSERVED',
        evidence: `X-Powered-By: ${headers['x-powered-by']}`,
        evidenceId: 'ev-tech-express'
      });
    } else if (poweredBy.includes('php')) {
      techs.push({
        id: 'php',
        name: 'PHP',
        category: 'Other',
        confidence: 95,
        confidenceLevel: 'HIGH',
        observationNature: 'OBSERVED',
        evidence: `X-Powered-By: ${headers['x-powered-by']}`,
        evidenceId: 'ev-tech-php'
      });
    }
  }

  // HTML content signatures (INFERRED through fingerprint analysis)
  if (lowerHtml.includes('wp-content') || lowerHtml.includes('wp-includes')) {
    techs.push({
      id: 'wordpress',
      name: 'WordPress',
      category: 'CMS',
      confidence: 85,
      confidenceLevel: 'HIGH',
      observationNature: 'INFERRED',
      evidence: 'HTML contains /wp-content/ or /wp-includes/ script paths',
      evidenceId: 'ev-tech-wordpress'
    });
  }

  if (lowerHtml.includes('react') || lowerHtml.includes('__next') || lowerHtml.includes('_next/static')) {
    if (!techs.some(t => t.id === 'react')) {
      techs.push({
        id: 'react',
        name: 'React',
        category: 'JavaScript Framework',
        confidence: 90,
        confidenceLevel: 'HIGH',
        observationNature: 'INFERRED',
        evidence: 'HTML contains React hydration markers and Next.js bundle chunk paths',
        evidenceId: 'ev-tech-react'
      });
    }
  }

  if (lowerHtml.includes('tailwindcss') || lowerHtml.includes('tailwind')) {
    techs.push({
      id: 'tailwind',
      name: 'Tailwind CSS',
      category: 'Other',
      confidence: 80,
      confidenceLevel: 'MEDIUM',
      observationNature: 'INFERRED',
      evidence: 'CSS style class naming conventions indicate Tailwind utility framework',
      evidenceId: 'ev-tech-tailwind'
    });
  }

  if (lowerHtml.includes('google-analytics') || lowerHtml.includes('gtag') || lowerHtml.includes('ga.js')) {
    techs.push({
      id: 'google-analytics',
      name: 'Google Analytics',
      category: 'Analytics',
      confidence: 95,
      confidenceLevel: 'HIGH',
      observationNature: 'INFERRED',
      evidence: 'Script tag referencing Google Analytics tracking snippet (gtag.js / ga.js)',
      evidenceId: 'ev-tech-google-analytics'
    });
  }

  // Add default baseline techs if minimal details available
  if (techs.length === 0) {
    techs.push(
      { 
        id: 'hsts', 
        name: 'HTTP Strict Transport Security (HSTS)', 
        category: 'Security', 
        confidence: 100, 
        confidenceLevel: 'HIGH',
        observationNature: 'OBSERVED',
        evidence: 'Security Header detected',
        evidenceId: 'ev-tech-hsts'
      },
      { 
        id: 'html5', 
        name: 'HTML5', 
        category: 'Other', 
        confidence: 100, 
        confidenceLevel: 'HIGH',
        observationNature: 'OBSERVED',
        evidence: '<!DOCTYPE html> declared in document preamble',
        evidenceId: 'ev-tech-html5'
      }
    );
  }

  return techs;
}

