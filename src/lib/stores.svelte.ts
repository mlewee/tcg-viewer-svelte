// Global client state using Svelte 5 runes. Replaces the React
// zustand uiStore/themeStore with plain module-level $state.

import type { OpenCard } from './types';
import { saveReleaseForTcg, saveSelectedTcg } from './preferences';

const THEME_KEY = 'tcg-theme';

function readInitialTheme(): 'mocha' | 'latte' {
  if (typeof window === 'undefined') return 'mocha';
  try {
    const raw = window.localStorage.getItem(THEME_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { state?: { theme?: string }; theme?: string };
      const t = parsed?.state?.theme ?? parsed?.theme ?? (raw === '"latte"' ? 'latte' : null);
      if (t === 'latte' || t === 'mocha') return t;
    }
  } catch {
    // ignore
  }
  return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'latte' : 'mocha';
}

function applyThemeDom(theme: 'mocha' | 'latte') {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-theme', theme);
}

class UiStore {
  selectedTcg: string | null = $state(null);
  selectedRelease: string | null = $state(null);
  selectedRarity: string | null = $state(null);
  selectedOrdering: string | null = $state(null);
  openCard: OpenCard | null = $state(null);

  setSelectedTcg(slug: string | null) {
    this.selectedTcg = slug;
    // Filter reset semantics: changing the TCG clears the dependent
    // filters and closes any open modal.
    this.selectedRelease = null;
    this.selectedRarity = null;
    this.selectedOrdering = null;
    this.openCard = null;
    // Persist the TCG preference (cleared when null). The per-TCG
    // release is restored separately on page load, never here, so a
    // manual TCG switch always starts at "All releases".
    saveSelectedTcg(slug);
  }
  setSelectedRelease(code: string | null) {
    this.selectedRelease = code;
    // Persist the release against the current TCG (browser-only,
    // guarded inside the preferences module).
    const tcg = this.selectedTcg;
    if (tcg) saveReleaseForTcg(tcg, code);
  }
  /** Restore a previously saved release without re-saving it. Used
   *  on page load after the TCG is restored, so the catalog sees a
   *  single combined filter change. */
  restoreSelectedRelease(code: string | null) {
    this.selectedRelease = code;
  }
  setSelectedRarity(rarity: string | null) {
    this.selectedRarity = rarity;
  }
  setSelectedOrdering(ordering: string | null) {
    this.selectedOrdering = ordering;
  }
  setOpenCard(card: OpenCard | null) {
    this.openCard = card;
  }
}

class ThemeStore {
  theme: 'mocha' | 'latte' = $state('mocha');
  private hydrated = false;

  hydrate() {
    if (this.hydrated || typeof window === 'undefined') return;
    this.hydrated = true;
    this.theme = readInitialTheme();
    applyThemeDom(this.theme);
  }

  toggle() {
    this.theme = this.theme === 'mocha' ? 'latte' : 'mocha';
    applyThemeDom(this.theme);
    try {
      window.localStorage.setItem(THEME_KEY, JSON.stringify({ state: { theme: this.theme } }));
    } catch {
      // ignore
    }
  }
}

export const ui = new UiStore();
export const theme = new ThemeStore();
