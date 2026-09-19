import {
  getDefaultCodebaseAnalytics,
  BASE_LANGUAGES,
  DEFAULT_PORTFOLIO_PROJECTS,
} from '@/lib/osint/codebaseData';

describe('codebaseData & Intelligence Stats', () => {
  it('returns valid codebase analytics data with required language breakdowns', () => {
    const data = getDefaultCodebaseAnalytics();

    expect(data.languages.length).toBeGreaterThanOrEqual(8);
    expect(data.projects.length).toBe(5);
    expect(data.summary.totalLoc).toBeGreaterThan(300000);

    // Verify language percentages sum to ~100% (+/- tolerance for rounded specifications)
    const totalPercentage = BASE_LANGUAGES.reduce((acc, curr) => acc + curr.percentage, 0);
    expect(totalPercentage).toBeGreaterThanOrEqual(99);
    expect(totalPercentage).toBeLessThanOrEqual(106);

    // Verify key portfolio projects exist
    const projectNames = DEFAULT_PORTFOLIO_PROJECTS.map((p) => p.name);
    expect(projectNames).toContain('website');
    expect(projectNames).toContain('antigravity-skills');
    expect(projectNames).toContain('osint_tool');
    expect(projectNames).toContain('scroll-world');
    expect(projectNames).toContain('vehicle-osint');
  });

  it('correctly calculates runtime execution ratios', () => {
    const data = getDefaultCodebaseAnalytics();
    const { executablePercent, documentationPercent, configPercent } = data.runtimeBreakdown;

    expect(executablePercent).toBe(46);
    expect(documentationPercent).toBe(41);
    expect(configPercent).toBe(13);
  });
});
