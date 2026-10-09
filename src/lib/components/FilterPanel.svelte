<script lang="ts">
  import { untrack } from 'svelte';
  import { tcgsApi } from '#lib/api/tcgs';
  import { releasesApi } from '#lib/api/releases';
  import { getRaritiesForTcg } from '#lib/rarities';
  import { isTcgEnabled } from '#lib/tcgSelection';
  import { ui } from '#lib/stores.svelte';
  import type { Release, TradingCardGame } from '#lib/types';

  let { search, onSearchChange }: { search: string; onSearchChange: (v: string) => void } = $props();

  let tcgs = $state<TradingCardGame[]>([]);
  let tcgsLoading = $state(true);
  let releases = $state<Release[]>([]);

  // Backend is the source of truth for availability: only is_active
  // TCGs are selectable. The Header owns the one-time saved-preference
  // restore globally; this panel only lists the enabled options.
  const enabledTcgs = $derived(tcgs.filter(isTcgEnabled));

  $effect(() => {
    let cancelled = false;
    tcgsLoading = true;
    tcgsApi
      .list()
      .then((d) => {
        if (!cancelled) tcgs = d;
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) tcgsLoading = false;
      });
    return () => {
      cancelled = true;
    };
  });

  $effect(() => {
    const slug = ui.selectedTcg;
    // Never request releases for a known-disabled TCG. The enabled
    // list is read untracked so this effect tracks only the slug and
    // does not refetch when the TCG list itself arrives.
    const knownDisabled = untrack(() =>
      slug ? tcgs.some((t) => t.slug === slug && !isTcgEnabled(t)) : false
    );
    if (!slug || knownDisabled) {
      releases = [];
      return;
    }
    let cancelled = false;
    releasesApi
      .listByTcg(slug)
      .then((d) => {
        if (cancelled) return;
        releases = d;
        // Validate an optimistically restored release: if the saved
        // code is gone (deleted release), fall back gracefully to the
        // first available release. A null selection is the normal
        // default (All releases) and needs no change.
        const current = untrack(() => ui.selectedRelease);
        if (current && !d.some((r) => r.code === current)) {
          untrack(() => ui.setSelectedRelease(d.length > 0 ? d[0].code : null));
        }
      })
      .catch(() => {
        if (!cancelled) releases = [];
      });
    return () => {
      cancelled = true;
    };
  });

  const rarities = $derived(getRaritiesForTcg(ui.selectedTcg));

  function formatRelease(r: Release): string {
    if (!r.name || r.name === r.code) return r.code;
    return `${r.code} — ${r.name}`;
  }
</script>

<aside class="panel" aria-label="Filters">
  <div class="fields">
    <div>
      <label for="tcg-select">TCG</label>
      <select
        id="tcg-select"
        class="hud-field"
        value={ui.selectedTcg ?? ''}
        disabled={tcgsLoading}
        onchange={(e) => ui.setSelectedTcg(e.currentTarget.value || null)}
      >
        <option value="">— Select a TCG —</option>
        {#each enabledTcgs as t (t.slug)}
          <option value={t.slug}>{t.name}</option>
        {/each}
      </select>
    </div>
    <div>
      <label for="release-select">Release</label>
      <select
        id="release-select"
        class="hud-field mono"
        value={ui.selectedRelease ?? ''}
        disabled={!ui.selectedTcg || releases.length === 0}
        onchange={(e) => ui.setSelectedRelease(e.currentTarget.value || null)}
      >
        <option value="">All releases</option>
        {#each releases as r (r.code)}
          <option value={r.code}>{formatRelease(r)}</option>
        {/each}
      </select>
    </div>
    <div>
      <label for="rarity-select">Rarity</label>
      <select
        id="rarity-select"
        class="hud-field mono"
        value={ui.selectedRarity ?? ''}
        disabled={!ui.selectedTcg || rarities.length === 0}
        onchange={(e) => ui.setSelectedRarity(e.currentTarget.value || null)}
      >
        <option value="">All rarities</option>
        {#each rarities as opt (opt.value)}
          <option value={opt.value}>{opt.label}</option>
        {/each}
      </select>
    </div>
    <div>
      <label for="sort-select">Sort</label>
      <select
        id="sort-select"
        class="hud-field"
        value={ui.selectedOrdering ?? ''}
        disabled={!ui.selectedTcg}
        onchange={(e) => ui.setSelectedOrdering(e.currentTarget.value || null)}
      >
        <option value="">Default (Latest)</option>
        <option value="-price">Price: High to Low</option>
        <option value="price">Price: Low to High</option>
      </select>
    </div>
    <div class="search-cell">
      <label for="card-search">Search</label>
      <input
        id="card-search"
        type="search"
        class="hud-field"
        placeholder="Search card name or code…"
        aria-label="Search"
        value={search}
        oninput={(e) => onSearchChange(e.currentTarget.value)}
      />
    </div>
  </div>
</aside>

<style>
  .panel {
    border-radius: 1rem;
    border: 1px solid color-mix(in srgb, var(--color-yellow) 20%, transparent);
    background: color-mix(in srgb, var(--color-mantle) 70%, transparent);
    backdrop-filter: blur(12px);
    padding: 0.75rem;
  }
  @media (min-width: 640px) {
    .panel {
      padding: 1rem;
    }
  }
  .fields {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
  }
  @media (min-width: 1024px) {
    .fields {
      grid-template-columns: repeat(5, 1fr);
    }
  }
  label {
    display: block;
    font-size: 0.62rem;
    text-transform: uppercase;
    letter-spacing: 0.18em;
    color: var(--color-subtext0);
    margin-bottom: 0.35rem;
  }
  .mono {
    font-family: ui-monospace, monospace;
  }
  .search-cell {
    grid-column: span 2;
  }
  @media (min-width: 1024px) {
    .search-cell {
      grid-column: span 1;
    }
  }
</style>
