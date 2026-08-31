import { WebSnapshot, SnapshotComparison, Technology } from '@/types/osint';

export function compareSnapshots(base: WebSnapshot, target: WebSnapshot): SnapshotComparison {
  const baseYear = new Date(base.timestamp).getFullYear();
  const targetYear = new Date(target.timestamp).getFullYear();
  const yearsApart = Math.abs(targetYear - baseYear);

  const sizeDiffBytes = target.contentLength - base.contentLength;
  const sizeDiffPercent = base.contentLength > 0 
    ? Math.round((Math.abs(sizeDiffBytes) / base.contentLength) * 100)
    : 0;

  const sizeDirection: 'increased' | 'decreased' | 'unchanged' = 
    sizeDiffBytes > 0 ? 'increased' : sizeDiffBytes < 0 ? 'decreased' : 'unchanged';

  const baseTechMap = new Map(base.detectedTech.map(t => [t.name, t]));
  const targetTechMap = new Map(target.detectedTech.map(t => [t.name, t]));

  const addedTech: Technology[] = [];
  const removedTech: Technology[] = [];
  const retainedTech: Technology[] = [];

  target.detectedTech.forEach(t => {
    if (!baseTechMap.has(t.name)) {
      addedTech.push(t);
    } else {
      retainedTech.push(t);
    }
  });

  base.detectedTech.forEach(t => {
    if (!targetTechMap.has(t.name)) {
      removedTech.push(t);
    }
  });

  const statusChanged = base.statusCode !== target.statusCode;
  const titleChanged = base.title !== target.title;

  let evolutionSummary = `Comparison between ${baseYear} and ${targetYear} (${yearsApart} year${yearsApart === 1 ? '' : 's'} apart): `;
  if (addedTech.length > 0 && removedTech.length > 0) {
    evolutionSummary += `Migrated from [${removedTech.map(t => t.name).join(', ')}] to [${addedTech.map(t => t.name).join(', ')}]. `;
  } else if (addedTech.length > 0) {
    evolutionSummary += `Adopted [${addedTech.map(t => t.name).join(', ')}]. `;
  } else if (removedTech.length > 0) {
    evolutionSummary += `Decommissioned [${removedTech.map(t => t.name).join(', ')}]. `;
  } else {
    evolutionSummary += `Maintained stack stability. `;
  }

  if (sizeDiffPercent >= 20) {
    evolutionSummary += `Asset footprint ${sizeDirection} by ${sizeDiffPercent}% (${(Math.abs(sizeDiffBytes) / 1024).toFixed(1)} KB shift).`;
  }

  return {
    baseSnapshot: base,
    targetSnapshot: target,
    yearsApart,
    sizeDiffBytes,
    sizeDiffPercent,
    sizeDirection,
    statusChanged,
    addedTech,
    removedTech,
    retainedTech,
    titleChanged,
    evolutionSummary
  };
}