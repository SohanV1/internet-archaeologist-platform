import { fetchHistoricalSnapshots } from '@/lib/osint/history';

describe('fetchHistoricalSnapshots & Key Collision Fix', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('generates unique collision-free IDs for all snapshots (Bug Fix Verification)', async () => {
    // Mock fetch returning CDX rows including pre-2018 and modern years
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        ['timestamp', 'original', 'mimetype', 'statuscode', 'length'],
        ['20150101120000', 'example.com', 'text/html', '200', '1000'], // pre-2018 branch
        ['20150101120000', 'example.com', 'text/html', '200', '1000'], // duplicate timestamp test
        ['20160101', 'example.com', 'text/html', '200', '800'], // 8-char timestamp (defaults hour/min/sec)
        ['2017010112', 'example.com', 'text/html', '200', '900'], // 10-char timestamp (defaults min/sec)
        ['20210515150000', 'example.com', 'text/html', '200', '1500'],
        ['20230820180000', 'example.com', 'text/html', '200', '2000'],
      ],
    });

    const snapshots = await fetchHistoricalSnapshots('example.com');
    expect(snapshots.length).toBeGreaterThan(0);

    // Verify all IDs are completely unique
    const idSet = new Set(snapshots.map((s) => s.id));
    expect(idSet.size).toBe(snapshots.length);

    // Verify ID format contains domain and is non-empty
    snapshots.forEach((s) => {
      expect(s.id).toMatch(/^snap-example-com-/);
      expect(s.timestamp).toBeDefined();
    });

    // Check pre-2018 legacy tech detection
    const legacySnap = snapshots.find((s) => s.timestamp.startsWith('2015'));
    expect(legacySnap).toBeDefined();
    expect(legacySnap?.detectedTech.some((t) => t.name.includes('jQuery'))).toBe(true);
  });

  it('generates fallback snapshots with unique IDs when archive fetch fails', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

    const snapshots = await fetchHistoricalSnapshots('fallback.test');
    expect(snapshots.length).toBe(4);

    const idSet = new Set(snapshots.map((s) => s.id));
    expect(idSet.size).toBe(4);

    snapshots.forEach((s) => {
      expect(s.id).toContain('snap-fallback-test-');
    });

    // Verify chronological order
    for (let i = 1; i < snapshots.length; i++) {
      const prev = new Date(snapshots[i - 1].timestamp).getTime();
      const curr = new Date(snapshots[i].timestamp).getTime();
      expect(curr).toBeGreaterThanOrEqual(prev);
    }
  });
});
