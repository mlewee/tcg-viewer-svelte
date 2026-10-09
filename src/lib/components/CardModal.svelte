<script lang="ts">
  import { cardPricesApi } from '#lib/api/cardPrices';
  import type { CardPrice, PriceHistoryResponse } from '#lib/types';
  import { ui } from '#lib/stores.svelte';
  import { rarityAccent } from '#lib/rarityAccent';
  import { cardTilt } from '#lib/tilt';
  import CardImage from './CardImage.svelte';
  import CardStats from './CardStats.svelte';
  import PriceChart from './PriceChart.svelte';

  let data = $state<PriceHistoryResponse | null>(null);
  let loading = $state(false);
  let error = $state<Error | null>(null);

  const open = $derived(ui.openCard);

  $effect(() => {
    const o = open;
    if (!o?.tcg || !o?.code) {
      data = null;
      return;
    }
    let cancelled = false;
    loading = true;
    error = null;
    cardPricesApi
      .history({
        tcg: o.tcg,
        card_code: o.code,
        card_id: o.card_id,
        release_code: o.release_code,
        rarity: o.rarity
      })
      .then((d) => {
        if (!cancelled) data = d;
      })
      .catch((e: unknown) => {
        if (!cancelled) error = e instanceof Error ? e : new Error(String(e));
      })
      .finally(() => {
        if (!cancelled) loading = false;
      });
    return () => {
      cancelled = true;
    };
  });

  const cardForView = $derived.by<CardPrice | null>(() => {
    const o = open;
    if (!o) return null;
    if (o.snapshot) {
      // Prefer the snapshot's identity fields so the artwork URL stays
      // stable when the history fetch resolves. Swapping image_url or
      // release_code mid-open would reset CardImage and refetch the
      // same artwork a second time.
      return {
        ...o.snapshot,
        release_code: o.snapshot.release_code || data?.release_code || o.snapshot.release_code,
        image_url: o.snapshot.image_url || data?.image_url || o.snapshot.image_url
      };
    }
    return {
      id: 0,
      tcg_slug: o.tcg,
      tcg_name: data?.tcg ?? o.tcg,
      release_code: data?.release_code ?? '—',
      name: data?.card_name ?? o.code,
      code: o.code,
      card_id: o.card_id ?? o.code,
      rarity: data?.rarity ?? '',
      price: '0',
      image_url: data?.image_url ?? '',
      image_url_canonical: data?.image_url_canonical ?? '',
      image_url_fallback: data?.image_url_fallback ?? '',
      image_source: data?.image_source ?? '',
      image_variant: data?.image_variant ?? '',
      scraped_at: data?.history?.[data.history.length - 1]?.scraped_at ?? new Date().toISOString()
    };
  });

  const accent = $derived(rarityAccent(cardForView?.rarity));

  function onBackdropKey(e: KeyboardEvent) {
    if (e.key === 'Escape' || e.key === 'Enter') ui.setOpenCard(null);
  }

  $effect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onBackdropKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onBackdropKey);
    };
  });
</script>

{#if open && cardForView}
  <div
    class="backdrop modal-backdrop-enter"
    role="dialog"
    aria-modal="true"
    tabindex="-1"
    onclick={() => ui.setOpenCard(null)}
    onkeydown={onBackdropKey}
  >
    <!-- svelte-ignore a11y_no_static_element_interactions, a11y_click_events_have_key_events: propagation-stop wrapper -->
    <div class="modal modal-panel-enter" onclick={(e) => e.stopPropagation()}>
      <div class="art-side">
        <div
          class="tilt-wrap tilt card-sleeve"
          use:cardTilt={{ intensityX: 12, intensityY: 14, lift: 10 }}
          onpointerenter={(e) => {
            // The mount sweep (.lit) uses a fill-forwards animation that
            // would override the tilt-driven --foil-x/--foil-y. Drop it on
            // first mouse contact so the foil follows the pointer; touch
            // keeps the sweep as its primary foil surface.
            if (e.pointerType === 'mouse') {
              e.currentTarget.querySelector('.card-foil')?.classList.remove('lit');
            }
          }}
        >
          <div class="art modal-art-enter {accent.rim} {accent.glow}">
            <CardImage card={cardForView} eager />
            <span class="card-foil lit" aria-hidden="true"></span>
          </div>
        </div>
      </div>
      <div class="detail">
        <div class="head modal-detail-enter">
          <div class="titles">
            <div class="code">{cardForView.code}</div>
            <h2>{cardForView.name}</h2>
            {#if cardForView.release_code}
              <div class="release">{cardForView.release_code}</div>
            {/if}
          </div>
          <button type="button" class="close" aria-label="Close" onclick={() => ui.setOpenCard(null)}>
            ×
          </button>
        </div>
        <div class="chart-box modal-chart-enter">
          <div class="chart-head">
            <h3>Market Price History</h3>
          </div>
          <div class="chart-body">
            {#if loading}
              <div class="center muted">Loading history…</div>
            {:else if error}
              <div class="center error">Failed to load history.</div>
            {:else if data}
              <PriceChart history={data.history} />
            {/if}
          </div>
        </div>
        <CardStats
          card={cardForView}
          scrapedAt={data?.history?.[data.history.length - 1]?.scraped_at ?? null}
          releaseName={cardForView.release_code}
        />
      </div>
    </div>
  </div>
{/if}

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    z-index: 50;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    background: color-mix(in srgb, var(--color-base) 75%, transparent);
    backdrop-filter: blur(8px);
  }
  @media (min-width: 640px) {
    .backdrop {
      align-items: center;
      padding: 1rem;
    }
  }
  .modal {
    width: 100%;
    max-width: 68rem;
    max-height: 96dvh;
    overflow-y: auto;
    border-radius: 1.5rem 1.5rem 0 0;
    border: 1px solid color-mix(in srgb, var(--color-yellow) 25%, transparent);
    background: color-mix(in srgb, var(--color-mantle) 92%, transparent);
    display: grid;
    grid-template-columns: 1fr;
  }
  @media (min-width: 640px) {
    .modal {
      border-radius: 1.5rem;
    }
  }
  @media (min-width: 768px) {
    .modal {
      grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.2fr);
    }
  }
  .art-side {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1.25rem;
    background: color-mix(in srgb, var(--color-base) 40%, transparent);
  }  @media (min-width: 640px) {
    .art-side {
      padding: 2rem;
    }
  }
  .tilt-wrap {
    width: min(100%, 320px);
  }
  @media (min-width: 640px) {
    .tilt-wrap {
      width: min(100%, 380px);
    }
  }
  .art {
    position: relative;
    width: 100%;
    aspect-ratio: 63 / 88;
    border-radius: 1.2rem;
    overflow: hidden;
    border: 1px solid;
    background: var(--color-mantle);
  }
  .detail {
    padding: 1.25rem;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }
  @media (min-width: 640px) {
    .detail {
      padding: 1.75rem;
    }
  }
  .head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 1.25rem;
  }
  .titles {
    min-width: 0;
  }
  .code {
    font-size: 0.62rem;
    color: var(--color-peach);
    text-transform: uppercase;
    letter-spacing: 0.22em;
  }
  h2 {
    margin: 0;
    font-family: var(--font-display);
    font-size: 1.5rem;
    line-height: 1.2;
  }
  @media (min-width: 640px) {
    h2 {
      font-size: 1.875rem;
    }
  }
  .release {
    font-size: 0.72rem;
    color: var(--color-subtext0);
    margin-top: 0.25rem;
  }
  .close {
    font-size: 1.875rem;
    line-height: 1;
    padding: 0.25rem;
    color: var(--color-subtext0);
    background: none;
    border: none;
    border-radius: 999px;
    cursor: pointer;
  }
  .close:hover {
    color: var(--color-text);
  }
  .chart-box {
    flex: 1;
    min-height: 14rem;
    border-radius: 1rem;
    border: 1px solid color-mix(in srgb, var(--color-overlay0) 35%, transparent);
    background: color-mix(in srgb, var(--color-base) 55%, transparent);
    padding: 0.75rem;
  }
  @media (min-width: 640px) {
    .chart-box {
      padding: 1rem;
    }
  }
  .chart-head h3 {
    margin: 0 0 0.5rem;
    font-size: 0.62rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.2em;
    color: var(--color-subtext0);
  }
  .chart-body {
    height: 14rem;
  }
  @media (min-width: 640px) {
    .chart-body {
      height: 16rem;
    }
  }
  .center {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.85rem;
  }
  .muted {
    color: var(--color-subtext0);
  }
  .error {
    color: var(--color-red);
  }
</style>
