<script lang="ts">
  import { updatesApi } from '#lib/api/updates';
  import { ApiError } from '#lib/api/client';
  import type { NewPriceUpdate } from '#lib/types';
  import { UPDATES_DEFAULT_LIMIT, UPDATES_MAX_LIMIT, UPDATES_PAGE_STEP } from '#lib/format';
  import { ui } from '#lib/stores.svelte';
  import ScrapeStatusHeader from '#lib/components/ScrapeStatusHeader.svelte';
  import UpdateRow from '#lib/components/UpdateRow.svelte';
  import EmptyState from '#lib/components/EmptyState.svelte';
  import Spinner from '#lib/components/Spinner.svelte';

  let limit = $state(UPDATES_DEFAULT_LIMIT);
  let updates = $state<NewPriceUpdate[]>([]);
  let isFetching = $state(false);
  let isError = $state(false);
  let exhausted = $state(false);
  let token = 0;

  // Reset when the TCG changes.
  $effect(() => {
    void ui.selectedTcg;
    token += 1;
    limit = UPDATES_DEFAULT_LIMIT;
    updates = [];
    exhausted = false;
    isError = false;
  });

  // Fetch when slug or limit changes.
  $effect(() => {
    const slug = ui.selectedTcg;
    const lim = limit;
    if (!slug) {
      updates = [];
      return;
    }
    token += 1;
    const my = token;
    isFetching = true;
    isError = false;
    updatesApi
      .list(slug, lim)
      .then((data) => {
        if (token !== my) return;
        updates = data;
        if (data.length < lim) exhausted = true;
      })
      .catch((err: unknown) => {
        if (token !== my) return;
        // 404 means more rows were requested than exist: end of list.
        if (err instanceof ApiError && err.status === 404) {
          exhausted = true;
          isError = false;
          return;
        }
        isError = true;
      })
      .finally(() => {
        if (token !== my) return;
        isFetching = false;
      });
  });

  const hasMore = $derived(!exhausted && limit < UPDATES_MAX_LIMIT);

  function loadMore() {
    if (limit >= UPDATES_MAX_LIMIT) return;
    limit = Math.min(limit + UPDATES_PAGE_STEP, UPDATES_MAX_LIMIT);
  }
</script>

<div class="page">
  <h2>Recent updates</h2>
  <div class="stack">
    <ScrapeStatusHeader />

    {#if !ui.selectedTcg}
      <EmptyState title="Pick a TCG">
        Use the picker in the header to load recent price changes.
      </EmptyState>
    {:else if isError}
      <div class="error">Failed to load updates.</div>
    {:else if updates.length === 0 && !isFetching}
      <EmptyState title="No price changes">
        The most recent scrape did not detect any new prices for this TCG. Check back after the
        next hourly pull.
      </EmptyState>
    {/if}

    {#if ui.selectedTcg && updates.length > 0}
      <ul class="feed">
        {#each updates as u, i (`${u.card_id}-${u.code}-${i}`)}
          <UpdateRow update={u} tcgSlug={ui.selectedTcg} />
        {/each}
      </ul>
      <div class="more">
        {#if hasMore}
          <button type="button" onclick={loadMore} disabled={isFetching}>
            {#if isFetching}
              <span class="loading"><Spinner /> Loading…</span>
            {:else}
              Load more
            {/if}
          </button>
        {/if}
        <span class="count">
          Showing {updates.length}{limit >= UPDATES_MAX_LIMIT ? ` (max ${UPDATES_MAX_LIMIT})` : ''}
        </span>
      </div>
    {/if}
  </div>
</div>

<style>
  .page {
    width: 100%;
    padding: 1.25rem 0.75rem 1rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  @media (min-width: 640px) {
    .page {
      padding-inline: 1.25rem;
    }
  }
  @media (min-width: 1024px) {
    .page {
      padding-inline: 2rem;
    }
  }
  h2 {
    margin: 0;
    font-family: var(--font-display);
    font-size: 1.5rem;
  }
  @media (min-width: 640px) {
    h2 {
      font-size: 1.875rem;
    }
  }
  .stack {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  .error {
    text-align: center;
    padding: 3rem 0;
    color: var(--color-red);
  }
  .feed {
    margin: 0;
    padding: 0;
    border-radius: 1rem;
    overflow: hidden;
    border: 1px solid color-mix(in srgb, var(--color-yellow) 20%, transparent);
    background: color-mix(in srgb, var(--color-mantle) 70%, transparent);
    backdrop-filter: blur(12px);
  }
  .feed :global(li + li) {
    border-top: 1px solid color-mix(in srgb, var(--color-overlay0) 30%, transparent);
  }
  .more {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
  }
  .more button {
    padding: 0.5rem 1rem;
    border-radius: 999px;
    border: none;
    background: var(--color-peach);
    color: var(--color-mantle);
    font-weight: 500;
    font-size: 0.85rem;
    cursor: pointer;
  }
  .more button:disabled {
    opacity: 0.5;
  }
  .loading {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
  }
  .count {
    font-size: 0.72rem;
    color: var(--color-subtext0);
  }
</style>
