<script lang="ts">
  import type { CardPrice } from '#lib/types';
  import { formatJpy, timeAgo } from '#lib/format';

  let {
    card,
    fallbackPrice,
    scrapedAt,
    releaseName
  }: {
    card: CardPrice;
    fallbackPrice?: string;
    scrapedAt?: string | null;
    releaseName?: string | null;
  } = $props();

  const price = $derived(formatJpy(fallbackPrice ?? card.price));
  const freshness = $derived(timeAgo(scrapedAt ?? card.scraped_at));
  const pills = $derived([
    { label: 'Current Price', value: price, hint: freshness, cls: 'peach' },
    { label: 'Code', value: card.code || '—', hint: releaseName ?? card.release_code ?? '—', cls: '' },
    { label: 'Rarity', value: card.rarity || '—', hint: card.tcg_name, cls: '' }
  ]);
</script>

<div class="stats">
  {#each pills as pill}
    <div class="pill">
      <p class="label">{pill.label}</p>
      <p class="value {pill.cls}">{pill.value}</p>
      {#if pill.hint}
        <p class="hint">{pill.hint}</p>
      {/if}
    </div>
  {/each}
</div>

<style>
  .stats {
    margin-top: 1.25rem;
    display: grid;
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
  @media (min-width: 640px) {
    .stats {
      grid-template-columns: repeat(3, 1fr);
    }
  }
  .pill {
    border-radius: 1rem;
    border: 1px solid color-mix(in srgb, var(--color-overlay0) 35%, transparent);
    background: color-mix(in srgb, var(--color-base) 55%, transparent);
    padding: 0.75rem;
  }
  .label {
    margin: 0;
    font-size: 0.62rem;
    text-transform: uppercase;
    letter-spacing: 0.18em;
    color: var(--color-subtext0);
  }
  .value {
    margin: 0.25rem 0 0;
    font-size: 1.1rem;
    font-weight: 700;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--color-text);
  }
  .value.peach {
    color: var(--color-peach);
  }
  .hint {
    margin: 0.15rem 0 0;
    font-size: 0.65rem;
    color: var(--color-subtext0);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
