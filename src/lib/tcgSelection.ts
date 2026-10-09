// Shared TCG availability + restore logic. The backend is the source
// of truth for availability via each TCG's is_active flag; there is no
// hard-coded frontend list. Called once globally from the Header (which
// mounts on every route) after the TCG list arrives.

import { loadReleaseForTcg, loadSelectedTcg, saveSelectedTcg } from './preferences';
import { ui } from './stores.svelte';
import type { TradingCardGame } from './types';

/** Backend-driven availability check. Missing flags default to visible
 *  so an older backend that only returns active TCGs keeps working. */
export function isTcgEnabled(t: TradingCardGame): boolean {
  return t.is_active !== false;
}

let restoreDone = false;

/** One-time restore on page load: saved TCG wins when still
 *  available/enabled, otherwise fall back gracefully. Runs idempotently
 *  (first caller wins) so parallel TCG fetches don't double-apply.
 *  Must be called from inside untrack (reads ui state without
 *  subscribing the caller's effect). */
export function maybeRestoreTcgSelection(list: TradingCardGame[]): void {
  if (restoreDone) return;
  restoreDone = true;
  const enabled = new Set(list.filter(isTcgEnabled).map((t) => t.slug));
  const saved = loadSelectedTcg();
  const current = ui.selectedTcg;
  if (saved && enabled.has(saved)) {
    // Saved preference wins. Restore the saved release synchronously
    // too so the catalog sees a single combined filter change (one
    // page-1 load, not two).
    if (current !== saved) ui.setSelectedTcg(saved);
    const savedRelease = loadReleaseForTcg(saved);
    if (savedRelease) ui.restoreSelectedRelease(savedRelease);
    return;
  }
  if (saved && !enabled.has(saved)) {
    // Saved TCG is gone (deleted) or disabled: drop the stale
    // preference so we don't keep retrying it, and fall back to the
    // first enabled TCG when nothing else is selected.
    saveSelectedTcg(null);
    if (!current) {
      const fallback = list.find(isTcgEnabled)?.slug ?? null;
      if (fallback) ui.setSelectedTcg(fallback);
      return;
    }
  }
  if (current && !enabled.has(current)) {
    // Currently selected TCG became unavailable: fall back to the
    // first enabled TCG, or to no selection when none exist.
    const fallback = list.find(isTcgEnabled)?.slug ?? null;
    ui.setSelectedTcg(fallback);
  }
  // Otherwise: no saved preference, or saved was stale and nothing is
  // selected. Keep the normal default behavior (no selection).
}
