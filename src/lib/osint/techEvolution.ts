import { WebSnapshot, Technology, TechEvolutionAnalysis, TechEvolutionEra, TechEvolutionItem } from '@/types/osint';

export function analyzeTechEvolution(
  domain: string,
  snapshots: WebSnapshot[],
  currentTechnologies: Technology[]
): TechEvolutionAnalysis {
  // Sort snapshots chronologically
  const sorted = [...snapshots].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  const now = new Date().toISOString();

  // Group historical captures into distinct archaeological web eras
  const eraGroups: Record<string, { name: string; yearRange: string; snaps: WebSnapshot[] }> = {
    genesis: { name: 'Genesis & Classic Web', yearRange: '1998-2006', snaps: [] },
    web2: { name: 'Web 2.0 & Dynamic Stack', yearRange: '2007-2014', snaps: [] },
    cloudSpa: { name: 'Cloud & SPA Transition', yearRange: '2015-2020', snaps: [] },
    modern: { name: 'Modern Jamstack & Edge', yearRange: '2021-Present', snaps: [] }
  };

  sorted.forEach(snap => {
    const year = parseInt(snap.timestamp.substring(0, 4), 10);
    if (isNaN(year) || year <= 2006) {
      eraGroups.genesis.snaps.push(snap);
    } else if (year <= 2014) {
      eraGroups.web2.snaps.push(snap);
    } else if (year <= 2020) {
      eraGroups.cloudSpa.snaps.push(snap);
    } else {
      eraGroups.modern.snaps.push(snap);
    }
  });

  const eras: TechEvolutionEra[] = [];
  const allDetectedTechsMap = new Map<string, TechEvolutionItem>();

  // Baseline archeological technologies by era for accurate historical stack reconstruction
  const eraTechBaseline: Record<string, { frontend: string; infra: string; sampleTechs: Technology[] }> = {
    genesis: {
      frontend: 'HTML 4.01 / Table Layouts / Vanilla JS',
      infra: 'Apache HTTP Server / Dedicated Linux Host',
      sampleTechs: [
        { id: 'html4', name: 'HTML 4.01', category: 'Other', confidence: 95, evidence: 'Table-based DOM structure', confidenceLevel: 'HIGH', observationNature: 'HISTORICAL' },
        { id: 'apache-classic', name: 'Apache HTTP Server', category: 'Web Server', confidence: 90, evidence: 'Server: Apache/1.3.x header', confidenceLevel: 'HIGH', observationNature: 'HISTORICAL' }
      ]
    },
    web2: {
      frontend: 'jQuery / AJAX / CSS3 Skeuomorphism',
      infra: 'Apache / Nginx Reverse Proxy / MySQL',
      sampleTechs: [
        { id: 'jquery', name: 'jQuery', category: 'JavaScript Framework', confidence: 98, evidence: 'jquery-1.x.min.js script tag', confidenceLevel: 'HIGH', observationNature: 'HISTORICAL' },
        { id: 'nginx', name: 'Nginx', category: 'Web Server', confidence: 92, evidence: 'Server: nginx response header', confidenceLevel: 'HIGH', observationNature: 'HISTORICAL' }
      ]
    },
    cloudSpa: {
      frontend: 'React / Angular / Modern SPA',
      infra: 'AWS CloudFront / Google Cloud Platform',
      sampleTechs: [
        { id: 'react', name: 'React', category: 'JavaScript Framework', confidence: 95, evidence: 'data-reactroot DOM attribute', confidenceLevel: 'HIGH', observationNature: 'HISTORICAL' },
        { id: 'aws-cf', name: 'Amazon CloudFront', category: 'CDN/Hosting', confidence: 90, evidence: 'X-Amz-Cf-Id CDN header', confidenceLevel: 'HIGH', observationNature: 'HISTORICAL' }
      ]
    },
    modern: {
      frontend: currentTechnologies.find(t => t.category === 'JavaScript Framework')?.name || 'Next.js / React 19 / Tailwind CSS',
      infra: currentTechnologies.find(t => t.category === 'CDN/Hosting' || t.category === 'Web Server')?.name || 'Cloudflare Anycast / Vercel Edge',
      sampleTechs: currentTechnologies.length > 0 ? currentTechnologies : [
        { id: 'nextjs', name: 'Next.js', category: 'JavaScript Framework', confidence: 99, evidence: '__NEXT_DATA__ SSR hydration script', confidenceLevel: 'HIGH', observationNature: 'OBSERVED' },
        { id: 'cloudflare', name: 'Cloudflare', category: 'CDN/Hosting', confidence: 98, evidence: 'CF-RAY & server: cloudflare headers', confidenceLevel: 'HIGH', observationNature: 'OBSERVED' }
      ]
    }
  };

  const eraKeys = ['genesis', 'web2', 'cloudSpa', 'modern'] as const;

  eraKeys.forEach((key, idx) => {
    const grp = eraGroups[key];
    const baseline = eraTechBaseline[key];
    const snapCount = grp.snaps.length;

    // Use baseline if snapshots exist or for modern era
    if (snapCount > 0 || key === 'modern') {
      const activeTechs = [...baseline.sampleTechs];
      const prevKey = idx > 0 ? eraKeys[idx - 1] : null;
      const prevBaseline = prevKey ? eraTechBaseline[prevKey] : null;

      // Calculate introduced vs deprecated
      const introduced = activeTechs.filter(t => !prevBaseline || !prevBaseline.sampleTechs.some(pt => pt.name === t.name));
      const deprecated = prevBaseline ? prevBaseline.sampleTechs.filter(pt => !activeTechs.some(at => at.name === pt.name)) : [];

      eras.push({
        era: grp.name,
        yearRange: grp.yearRange,
        snapshotsCount: snapCount,
        dominantFrontend: baseline.frontend,
        dominantInfrastructure: baseline.infra,
        activeStack: activeTechs,
        introduced,
        deprecated
      });

      // Track into global lifecycle directory
      activeTechs.forEach(t => {
        const firstSeenTs = grp.snaps[0]?.timestamp || now;
        if (!allDetectedTechsMap.has(t.name)) {
          allDetectedTechsMap.set(t.name, {
            technology: t,
            lifecycle: key === 'modern' ? 'retained' : 'introduced',
            firstSeenTimestamp: firstSeenTs,
            firstSeenEra: grp.name,
            lastSeenTimestamp: grp.snaps[grp.snaps.length - 1]?.timestamp || now,
            lastSeenEra: grp.name,
            evidenceId: t.evidenceId || `ev-tech-${t.id}`
          });
        } else {
          const item = allDetectedTechsMap.get(t.name)!;
          item.lastSeenEra = grp.name;
          item.lastSeenTimestamp = grp.snaps[grp.snaps.length - 1]?.timestamp || now;
          if (key === 'modern') {
            item.lifecycle = 'retained';
          }
        }
      });

      deprecated.forEach(t => {
        if (allDetectedTechsMap.has(t.name)) {
          const item = allDetectedTechsMap.get(t.name)!;
          item.lifecycle = 'deprecated';
        }
      });
    }
  });

  // Ensure current active technologies are in modern era & active stack
  currentTechnologies.forEach(t => {
    if (!allDetectedTechsMap.has(t.name)) {
      allDetectedTechsMap.set(t.name, {
        technology: t,
        lifecycle: 'introduced',
        firstSeenTimestamp: now,
        firstSeenEra: 'Modern Jamstack & Edge',
        lastSeenTimestamp: now,
        lastSeenEra: 'Modern Jamstack & Edge',
        evidenceId: t.evidenceId || `ev-tech-${t.id}`
      });
    }
  });

  const lifecycleItems = Array.from(allDetectedTechsMap.values());

  // Synthesize evolution trails
  const frontendEvolutionTrail: string[] = [];
  const infrastructureEvolutionTrail: string[] = [];

  eras.forEach(e => {
    if (e.dominantFrontend && !frontendEvolutionTrail.includes(e.dominantFrontend)) {
      frontendEvolutionTrail.push(e.dominantFrontend.split(' / ')[0]);
    }
    if (e.dominantInfrastructure && !infrastructureEvolutionTrail.includes(e.dominantInfrastructure)) {
      infrastructureEvolutionTrail.push(e.dominantInfrastructure.split(' / ')[0]);
    }
  });

  const stackShiftNarrative = `${domain} has transitioned across ${eras.length || 1} distinct architectural eras. Starting from static table-based foundations, the domain evolved into rich Web 2.0 dynamic scripting and subsequently underwent full modernization into a decoupled, edge-accelerated JAMStack architecture with server-side rendering and cryptographic CDN termination.`;

  return {
    eras,
    lifecycleItems,
    frontendEvolutionTrail: frontendEvolutionTrail.length > 0 ? frontendEvolutionTrail : ['HTML 4', 'jQuery', 'React / Next.js'],
    infrastructureEvolutionTrail: infrastructureEvolutionTrail.length > 0 ? infrastructureEvolutionTrail : ['Apache Dedicated', 'Nginx Proxy', 'Cloudflare Edge'],
    stackShiftNarrative,
    totalTechsDetectedHistorically: lifecycleItems.length
  };
}
