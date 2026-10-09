// Persistent local user preference for the selected TCG and the
// per-TCG selected release. Browser-only (localStorage); all access
// is guarded so SSR/prerender never touches window.

const TCG_KEY = 'tcg-viewer:selected-tcg';

function releaseKey(tcgSlug: string): string {
  return `tcg-viewer:release:${tcgSlug}`;
}

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function readString(key: string): string | null {
  if (!canUseStorage()) return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const v = raw.trim();
    return v === '' ? null : v;
  } catch {
    return null;
  }
}

function writeString(key: string, value: string | null): void {
  if (!canUseStorage()) return;
  try {
    if (value === null || value.trim() === '') {
      window.localStorage.removeItem(key);
    } else {
      window.localStorage.setItem(key, value.trim());
    }
  } catch {
    // Storage full / private mode: preferences are best-effort.
  }
}

/** Last selected TCG slug, or null when nothing valid was saved. */
export function loadSelectedTcg(): string | null {
  return readString(TCG_KEY);
}

/** Persist the TCG selection. Null clears the saved preference. */
export function saveSelectedTcg(slug: string | null): void {
  writeString(TCG_KEY, slug);
}

/** Last selected release code for a TCG, or null (meaning "All"). */
export function loadReleaseForTcg(tcgSlug: string): string | null {
  if (!tcgSlug.trim()) return null;
  return readString(releaseKey(tcgSlug));
}

/** Persist the release selection for a TCG. Null clears it (All). */
export function saveReleaseForTcg(tcgSlug: string, code: string | null): void {
  if (!tcgSlug.trim()) return;
  writeString(releaseKey(tcgSlug), code);
}
