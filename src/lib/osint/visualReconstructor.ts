import { WebSnapshot, VisualReconstruction, Technology } from '@/types/osint';

/**
 * Builds visual archeological reconstructions for key historical snapshots,
 * enabling split-screen swipe comparison and authentic retro browser previews.
 */
export function reconstructVisualSnapshots(
  domain: string,
  snapshots: WebSnapshot[]
): VisualReconstruction[] {
  if (!snapshots || snapshots.length === 0) return [];

  // Pick up to 5 representative snapshots across distinct years (oldest to newest)
  const sorted = [...snapshots].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  // Group by distinct years
  const selectedSnaps: WebSnapshot[] = [];
  const seenYears = new Set<number>();

  // Always include the first/oldest snapshot
  if (sorted.length > 0) {
    selectedSnaps.push(sorted[0]);
    seenYears.add(new Date(sorted[0].timestamp).getFullYear());
  }

  // Include mid-era snapshots
  sorted.forEach(s => {
    const yr = new Date(s.timestamp).getFullYear();
    if (!seenYears.has(yr) && selectedSnaps.length < 5) {
      selectedSnaps.push(s);
      seenYears.add(yr);
    }
  });

  // Always ensure the latest snapshot is present
  const latest = sorted[sorted.length - 1];
  if (latest && !selectedSnaps.some(s => s.id === latest.id)) {
    selectedSnaps.push(latest);
  }

  return selectedSnaps.map((snap) => {
    const year = new Date(snap.timestamp).getFullYear();
    const yearStr = year.toString();

    let era = 'Genesis Era';
    let layoutStyle: VisualReconstruction['layoutStyle'] = 'early-table-based';
    let browserFrameType: VisualReconstruction['browserFrameType'] = 'win98-ie';
    let colorPalette = ['#000080', '#c0c0c0', '#ffffff', '#008080'];
    let keyElements = ['<table border="1">', '<font face="Times New Roman">', '<marquee> ticker', 'Guestbook & WebRing Links'];

    if (year <= 2005) {
      era = `Early Web (${yearStr})`;
      layoutStyle = 'early-table-based';
      browserFrameType = 'win98-ie';
      colorPalette = ['#000080', '#c0c0c0', '#ffffff', '#808080'];
      keyElements = ['0-Column Nested Tables', 'Beveled Buttons', 'GIF Banner Advertisements', 'Raw HTML Script Tags'];
    } else if (year <= 2013) {
      era = `Web 2.0 Gloss (${yearStr})`;
      layoutStyle = 'web2-skeuomorphic';
      browserFrameType = 'win7-chrome';
      colorPalette = ['#2c3e50', '#3498db', '#f1c40f', '#ecf0f1'];
      keyElements = ['Glossy Gradients & Drop Shadows', 'jQuery Slider Carousel', 'RSS / XML Feeds', 'Rounded Corner Badges'];
    } else if (year <= 2020) {
      era = `Flat & Responsive (${yearStr})`;
      layoutStyle = 'flat-responsive';
      browserFrameType = 'win7-chrome';
      colorPalette = ['#1e293b', '#3b82f6', '#10b981', '#f8fafc'];
      keyElements = ['Bootstrap Flexbox Grid', 'Full-width Hero Banner', 'Single Page Application (SPA) State', 'FontAwesome SVG Icons'];
    } else {
      era = `Modern Edge & Dark (${yearStr})`;
      layoutStyle = 'modern-dark-spa';
      browserFrameType = 'modern-dark';
      colorPalette = ['#020617', '#0f172a', '#f59e0b', '#10b981'];
      keyElements = ['Tailwind Glassmorphism UI', 'Next.js SSR Hydration', 'Dark Mode Default Theme', 'Edge Anycast Routing'];
    }

    return {
      id: `vis-${snap.id}`,
      era,
      year: yearStr,
      snapshotId: snap.id,
      timestamp: snap.timestamp,
      archiveUrl: snap.archiveUrl,
      title: snap.title || `${domain} — Historical Archive Capture (${yearStr})`,
      layoutStyle,
      browserFrameType,
      colorPalette,
      keyElements,
      detectedTechNames: (snap.detectedTech || []).map((t: Technology) => t.name),
      contentLength: snap.contentLength,
      statusCode: snap.statusCode
    };
  });
}
