<script lang="ts">
  import { goto } from '$app/navigation';
  import { tcgsApi } from '#lib/api/tcgs';
  import { releasesApi } from '#lib/api/releases';
  import type { Release, TradingCardGame } from '#lib/types';
  import { ui } from '#lib/stores.svelte';
  import ReleaseGroup from '#lib/components/ReleaseGroup.svelte';
  import Spinner from '#lib/components/Spinner.svelte';

  let tcgs = $state<TradingCardGame[]>([]);
  let releases = $state<Release[]>([]);
  let tcgsLoading = $state(true);
  let releasesLoading = $state(true);
  let tcgsError: Error | null = $state(null);
  let releasesError: Error | null = $state(null);
  let activeTcgSlug = $state('all');
  let searchQuery = $state('');

  $effect(() => {
    let cancelled = false;
    tcgsApi
      .list()
      .then((d) => {
        if (!cancelled) tcgs = d;
      })
      .catch((e: unknown) => {
        if (!cancelled) tcgsError = e instanceof Error ? e : new Error(String(e));
      })
      .finally(() => {
        if (!cancelled) tcgsLoading = false;
      });
    releasesApi
      .list()
      .then((d) => {
        if (!cancelled) releases = d;
      })
      .catch((e: unknown) => {
        if (!cancelled) releasesError = e instanceof Error ? e : new Error(String(e));
      })
      .finally(() => {
        if (!cancelled) releasesLoading = false;
      });
    return () => {
      cancelled = true;
    };
  });

  const grouped = $derived.by(() => {
    const map = new Map<string, { tcg: TradingCardGame; releases: Release[] }>();
    // Backend is the source of truth for availability; disabled TCGs
    // are hidden from the selector.
    for (const t of tcgs) {
      if (t.is_active === false) continue;
      map.set(t.slug, { tcg: t, releases: [] });
    }
    for (const r of releases) {
      const slug = r.tcg_slug || tcgs.find((t) => String(t.id) === String(r.tcg))?.slug;
      if (slug && map.has(slug)) map.get(slug)!.releases.push(r);
    }
    return map;
  });

  const visibleTcgs = $derived(tcgs.filter((t) => t.is_active !== false));

  const filteredGroups = $derived.by(() => {
    const q = searchQuery.trim().toLowerCase();
    const result: { tcg: TradingCardGame; releases: Release[] }[] = [];
    grouped.forEach(({ tcg, releases: list }) => {
      if (activeTcgSlug !== 'all' && tcg.slug !== activeTcgSlug) return;
      const matches = q
        ? list.filter(
            (r) =>
              r.code.toLowerCase().includes(q) ||
              r.name.toLowerCase().includes(q) ||
              tcg.name.toLowerCase().includes(q)
          )
        : list;
      if (matches.length > 0 || (q === '' && activeTcgSlug === tcg.slug)) {
        result.push({ tcg, releases: matches });
      }
    });
    return result;
  });

  const loading = $derived(tcgsLoading || releasesLoading);
  const error = $derived(tcgsError || releasesError);

  function handleSelectRelease(tcgSlug: string, releaseCode: string) {
    ui.setSelectedTcg(tcgSlug);
    ui.setSelectedRelease(releaseCode);
    goto('/');
  }

  function handleViewAll(tcgSlug: string) {
    ui.setSelectedTcg(tcgSlug);
    ui.setSelectedRelease(null);
    goto('/');
  }
</script>

<div class="page">
  <h2>Releases</h2>

  {#if loading}
    <div class="loading"><Spinner /> <span>Loading releases…</span></div>
  {:else if error}
    <div class="error">Failed to load releases.</div>
  {:else}
    <div class="toolbar">
      <div class="pills">
        <button type="button" class:active={activeTcgSlug === 'all'} onclick={() => (activeTcgSlug = 'all')}>
          All Games
        </button>
        {#each visibleTcgs as t (t.slug)}
          <button type="button" class:active={activeTcgSlug === t.slug} onclick={() => (activeTcgSlug = t.slug)}>
            {t.name}
          </button>
        {/each}
      </div>
      <div class="filter">
        <input
          type="search"
          class="hud-field"
          placeholder="Filter release code or name…"
          value={searchQuery}
          oninput={(e) => (searchQuery = e.currentTarget.value)}
        />
      </div>
    </div>

    {#if filteredGroups.length === 0}
      <div class="none">No releases found matching “{searchQuery}”.</div>
    {:else}
      <div class="groups">
        {#each filteredGroups as g (g.tcg.slug)}
          <ReleaseGroup
            tcg={g.tcg}
            releases={g.releases}
            onSelectRelease={handleSelectRelease}
            onViewAll={handleViewAll}
          />
        {/each}
      </div>
    {/if}
  {/if}
</div>

<style>
  .page {
    width: 100%;
    padding: 1.25rem 0.75rem;
  }
  @media (min-width: 640px) {
    .page {
      padding: 1.25rem;
    }
  }
  @media (min-width: 1024px) {
    .page {
      padding-inline: 2rem;
    }
  }
  h2 {
    margin: 0 0 1.25rem;
    font-family: var(--font-display);
    font-size: 1.5rem;
  }
  @media (min-width: 640px) {
    h2 {
      font-size: 1.875rem;
    }
  }
  .loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    padding: 5rem 0;
    color: var(--color-subtext0);
  }
  .error {
    text-align: center;
    padding: 3rem 0;
    color: var(--color-red);
  }
  .toolbar {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin-bottom: 1.5rem;
  }
  @media (min-width: 640px) {
    .toolbar {
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
    }
  }
  .pills {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    overflow-x: auto;
    padding-bottom: 0.25rem;
  }
  .pills button {
    padding: 0.4rem 0.8rem;
    border-radius: 999px;
    font-size: 0.82rem;
    font-weight: 500;
    white-space: nowrap;
    border: 1px solid color-mix(in srgb, var(--color-overlay0) 35%, transparent);
    background: color-mix(in srgb, var(--color-surface0) 60%, transparent);
    color: var(--color-subtext0);
    cursor: pointer;
  }
  .pills button.active {
    background: var(--color-peach);
    color: var(--color-mantle);
    border-color: var(--color-peach);
  }
  .filter {
    width: 100%;
  }
  @media (min-width: 640px) {
    .filter {
      width: 16rem;
    }
  }
  .none {
    text-align: center;
    padding: 4rem 1rem;
    background: color-mix(in srgb, var(--color-mantle) 60%, transparent);
    border-radius: 1rem;
    border: 1px solid color-mix(in srgb, var(--color-yellow) 20%, transparent);
    color: var(--color-subtext0);
  }
  .groups {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }
</style>
