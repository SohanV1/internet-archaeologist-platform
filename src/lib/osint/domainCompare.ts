import { Investigation, DomainComparisonResult, Technology } from '@/types/osint';

export function compareInvestigations(invA: Investigation, invB: Investigation): DomainComparisonResult {
  const techNamesA = new Set(invA.technologies.map(t => t.name));
  const techNamesB = new Set(invB.technologies.map(t => t.name));

  const sharedTech: Technology[] = [];
  const exclusiveTechA: Technology[] = [];
  const exclusiveTechB: Technology[] = [];

  invA.technologies.forEach(t => {
    if (techNamesB.has(t.name)) {
      sharedTech.push(t);
    } else {
      exclusiveTechA.push(t);
    }
  });

  invB.technologies.forEach(t => {
    if (!techNamesA.has(t.name)) {
      exclusiveTechB.push(t);
    }
  });

  const yearsA = invA.summary?.totalYearsActive || 5;
  const yearsB = invB.summary?.totalYearsActive || 5;
  const subCountA = invA.subdomains?.length || 0;
  const subCountB = invB.subdomains?.length || 0;

  let summaryNarrative = `Competitive & Architectural Analysis between ${invA.domain} and ${invB.domain}: `;
  if (sharedTech.length > 0) {
    summaryNarrative += `Both domains share foundational stack signatures including [${sharedTech.map(t => t.name).join(', ')}]. `;
  } else {
    summaryNarrative += `Both targets operate on distinct, non-overlapping architectural stacks. `;
  }

  if (subCountA > subCountB) {
    summaryNarrative += `${invA.domain} presents a broader attack surface with ${subCountA} subdomains vs ${subCountB} on ${invB.domain}. `;
  } else if (subCountB > subCountA) {
    summaryNarrative += `${invB.domain} presents a larger subdomain ecosystem with ${subCountB} subdomains vs ${subCountA} on ${invA.domain}. `;
  }

  return {
    domainA: invA.domain,
    domainB: invB.domain,
    yearsA,
    yearsB,
    sharedTech,
    exclusiveTechA,
    exclusiveTechB,
    subdomainsCountA: subCountA,
    subdomainsCountB: subCountB,
    securityRatingA: invA.summary?.securityRating || 'Moderate',
    securityRatingB: invB.summary?.securityRating || 'Moderate',
    summaryNarrative
  };
}