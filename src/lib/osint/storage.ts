import { Investigation } from '@/types/osint';

const STORAGE_KEY = 'internet_archaeologist_investigations';

export function getSavedInvestigations(): Investigation[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveInvestigation(investigation: Investigation): void {
  if (typeof window === 'undefined') return;
  try {
    const list = getSavedInvestigations();
    const existingIndex = list.findIndex(i => i.id === investigation.id || i.domain === investigation.domain);
    if (existingIndex >= 0) {
      list[existingIndex] = investigation;
    } else {
      list.unshift(investigation);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }
}

export function deleteInvestigation(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    const list = getSavedInvestigations().filter(i => i.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }
}
