<script lang="ts">
  import { onDestroy, untrack } from 'svelte';
  import { cardPricesApi } from '#lib/api/cardPrices';
  import { ApiError } from '#lib/api/client';
  import type { CardPrice } from '#lib/types';
  import CardTile from './CardTile.svelte';
  import EmptyState from './EmptyState.svelte';
  import Spinner from './Spinner.svelte';
  import { ui } from '#lib/stores.svelte';

  let { search = '' }: { search?: string } = $props();

  let cards = $state<CardPrice[]>([]);
  let page = $state(0);
  let hasNextPage = $state(false);
  let isFetching = $state(false);
  let isError = $state(false);
  // Plain (non-reactive) guards: reading/writing these never retriggers $effect.
  let filterToken = 0;
  let inFlight = false;
  let prevFilterKey: string | null = null;
  let sentinel: HTMLDivElement | null = $state(null);
  let observer: IntersectionObserver | null = null;

  const filterKey = $derived(
    `${ui.selectedTcg ?? ''}|${ui.selectedRelease ?? ''}|${ui.selectedRarity ?? ''}|${ui.selectedOrdering ?? ''}|${search}`
  );

  type FilterSnapshot = {
    tcg: string;
    release_code?: string;
    rarity?: string;
    ordering?: string;
    search?: string;
  };

  function requestPage(nextPage: number, token: number, filters: FilterSnapshot) {
    cardPricesApi
      .list({ ...filters, page: nextPage })
      .then((resp) => {
        // Stale response from a previous filter generation: drop it.
        if (untrack(() => filterToken) !== token) return;
        const baseCards = untrack(() => (nextPage === 1 ? [] : cards));
        let merged: CardPrice[];
        if (nextPage === 1) {
          merged = resp.results;
        } else {
          const seen = new Set(baseCards.map((c) => c.id));
          merged = baseCards.slice();
          for (const r of resp.results) {
            if (seen.has(r.id)) continue;
            seen.add(r.id);
            merged.push(r);
          }
        }
        cards = merged;
        page = nextPage;
        hasNextPage = Boolean(resp.next);
        isFetching = false;
      })
      .catch((err: unknown) => {
        if (untrack(() => filterToken) !== token) return;
        // 404 past the end of the result set means exhaustion, not error.
        if (err instanceof ApiError && err.status === 404) {
          hasNextPage = false;
          isFetching = false;
          isError = false;
          return;
        }
        isFetching = false;
        isError = true;
      })
      .finally(() => {
        if (untrack(() => filterToken) === token) {
          inFlight = false;
        }
      });
  }

  function fetchNextPage() {
    // Snapshot every piece of reactive state up front inside untrack so
    // calling this from inside an $effect never subscribes that effect
    // to page/cards/isFetching/hasNextPage/ui.*.
    const snap = untrack(() => ({
      tcg: ui.selectedTcg,
      release_code: ui.selectedRelease ?? undefined,
      rarity: ui.selectedRarity ?? undefined,
      ordering: ui.selectedOrdering ?? undefined,
      q: search || undefined,
      currentPage: page,
      more: hasNextPage,
      fetching: isFetching,
      busy: inFlight,
      token: filterToken
    }));
    if (!snap.tcg || snap.busy || snap.fetching) return;
    if (snap.currentPage > 0 && !snap.more) return;
    inFlight = true;
    isFetching = true;
    isError = false;
    const nextPage = snap.currentPage === 0 ? 1 : snap.currentPage + 1;
    requestPage(
      nextPage,
      snap.token,
      {
        tcg: snap.tcg,
        release_code: snap.release_code,
        rarity: snap.rarity,
        ordering: snap.ordering,
        search: snap.q
      }
    );
  }

  function resetAndLoadPage1() {
    // Caller already inside untrack: safe to read ui.* and write page state
    // without creating reactive subscriptions.
    filterToken += 1;
    const token = filterToken;
    cards = [];
    page = 0;
    hasNextPage = false;
    isError = false;
    isFetching = false;
    inFlight = false;
    const tcg = ui.selectedTcg;
    if (!tcg) return;
    inFlight = true;
    isFetching = true;
    requestPage(
      1,
      token,
      {
        tcg,
        release_code: ui.selectedRelease ?? undefined,
        rarity: ui.selectedRarity ?? undefined,
        ordering: ui.selectedOrdering ?? undefined,
        search: search || undefined
      }
    );
  }

  // Reset on filter change, then fetch page 1 exactly once per key.
  // The effect tracks ONLY filterKey; all reads/writes below are untracked
  // so resolving page 1 never re-triggers this effect.
  $effect(() => {
    const key = filterKey;
    if (key === prevFilterKey) return;
    prevFilterKey = key;
    untrack(() => resetAndLoadPage1());
  });

  // Infinite scroll. Tracks only the sentinel element and selected TCG;
  // pagination state is read untracked inside the observer callback.
  $effect(() => {
    const el = sentinel;
    const tcg = ui.selectedTcg;
    if (!el || !tcg) return;
    observer?.disconnect();
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) untrack(() => fetchNextPage());
        }
      },
      { rootMargin: '240px 0px' }
    );
    observer = obs;
    obs.observe(el);
    return () => obs.disconnect();
  });

  onDestroy(() => observer?.disconnect());

  function openCard(c: CardPrice) {
    if (!ui.selectedTcg) return;
    ui.setOpenCard({
      tcg: ui.selectedTcg,
      code: c.code,
      card_id: c.card_id,
      rarity: c.rarity,
      release_code: c.release_code,
      snapshot: c
    });
  }

  const active = $derived(Boolean(ui.selectedTcg));
</script>

{#if active && cards.length === 0 && isFetching}
  <div class="grid">
    {#each Array(16) as _, i}
      <div class="shimmer" aria-hidden="true"></div>
    {/each}
  </div>
{:else if active && cards.length === 0 && isError}
  <EmptyState title="The table went quiet">
    Failed to load cards. Try another filter or refresh.
  </EmptyState>
{:else if active && cards.length === 0}
  <EmptyState title="No cards in this spread">No cards match your filters.</EmptyState>
{:else if !active}
  <EmptyState title="Draw a game">Pick a TCG to deal the catalog onto the table.</EmptyState>
{:else}
  <div class="grid">
    {#each cards as c, i (c.id)}
      <div class="deal-cell deal" style="--deal-delay: {Math.min(i, 15) * 30}ms">
        <CardTile card={c} onclick={openCard} />
      </div>
    {/each}
  </div>
  <div class="sentinel" bind:this={sentinel} aria-hidden="true">
    {#if isFetching && cards.length > 0}
      <span class="more"><Spinner /> Dealing more…</span>
    {:else if !hasNextPage && !isFetching && cards.length > 0}
      <span class="end">— end of the deck —</span>
    {/if}
  </div>
{/if}

<style>
  .grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.65rem;
    /* Depth for the deal-in rotateX. */
    perspective: 1400px;
  }
  @media (min-width: 640px) {
    .grid {
      grid-template-columns: repeat(3, 1fr);
      gap: 0.75rem;
    }
  }
  @media (min-width: 768px) {
    .grid {
      grid-template-columns: repeat(4, 1fr);
    }
  }
  @media (min-width: 1024px) {
    .grid {
      grid-template-columns: repeat(5, 1fr);
      gap: 1rem;
    }
  }
  @media (min-width: 1280px) {
    .grid {
      grid-template-columns: repeat(6, 1fr);
    }
  }
  @media (min-width: 1536px) {
    .grid {
      grid-template-columns: repeat(8, 1fr);
    }
  }
  .shimmer {
    aspect-ratio: 63 / 88;
    border-radius: 1.05rem;
    background: linear-gradient(
      100deg,
      var(--color-surface0) 30%,
      var(--color-surface1) 50%,
      var(--color-surface0) 70%
    );
    background-size: 200% 100%;
    animation: shimmer 1.4s linear infinite;
  }
  .deal-cell {
    height: 100%;
  }
  @keyframes shimmer {
    from {
      background-position: 200% 0;
    }
    to {
      background-position: -200% 0;
    }
  }
  .sentinel {
    height: 2.5rem;
    margin-top: 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.72rem;
    color: var(--color-subtext0);
  }
  .more {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
  }
  .end {
    letter-spacing: 0.2em;
    text-transform: uppercase;
    font-size: 0.62rem;
  }
</style>
