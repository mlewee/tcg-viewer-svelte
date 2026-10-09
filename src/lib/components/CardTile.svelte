<script lang="ts">
  import type { CardPrice } from '#lib/types';
  import { formatJpyShort } from '#lib/format';
  import { rarityAccent } from '#lib/rarityAccent';
  import { cardTilt } from '#lib/tilt';
  import { preloadCard } from '#lib/cardImage';
  import CardImage from './CardImage.svelte';

  let { card, onclick }: { card: CardPrice; onclick: (card: CardPrice) => void } = $props();
  const accent = $derived(rarityAccent(card.rarity));

  // Targeted intent preload: warming the primary URL on hover/focus means
  // the modal <img> (same URL) usually hits the HTTP cache. Deduped inside
  // preloadCard; never preloads the whole catalog up front.
  function warm() {
    preloadCard(card);
  }
</script>

<button
  type="button"
  class="tile tilt card-sleeve {accent.rim} {accent.glow}"
  use:cardTilt
  onclick={() => onclick(card)}
  onpointerenter={warm}
  onfocus={warm}
>
  <span class="art">
    <CardImage {card} />
    <span class="card-foil" aria-hidden="true"></span>
    <span class="fade card-caption-fade" aria-hidden="true"></span>
    <span class="rarity {accent.badge}">{card.rarity || '—'}</span>
    <span class="caption">
      <span class="code">{card.code}</span>
      <span class="name">{card.name}</span>
      <span class="price">{formatJpyShort(card.price)}</span>
    </span>
  </span>
</button>

<style>
  .tile {
    width: 100%;
    text-align: left;
    border-radius: 1.05rem;
    overflow: hidden;
    border: 1px solid;
    background: var(--color-mantle);
    padding: 0;
    cursor: pointer;
    color: inherit;
  }
  .art {
    position: relative;
    display: block;
    width: 100%;
    aspect-ratio: 63 / 88;
    overflow: hidden;
    isolation: isolate;
  }
  .fade {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }
  .rarity {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    font-size: 0.62rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    padding: 0.15rem 0.4rem;
    border-radius: 0.4rem;
    border: 1px solid;
    backdrop-filter: blur(4px);
  }
  .caption {
    position: absolute;
    inset-inline: 0;
    bottom: 0;
    padding: 0.65rem 0.7rem;
    display: flex;
    flex-direction: column;
  }
  .code {
    font-size: 0.62rem;
    color: var(--color-subtext0);
    text-transform: uppercase;
    letter-spacing: 0.16em;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  :global(html[data-theme='mocha']) .code {
    color: #a6adc8;
  }
  .name {
    font-family: var(--font-display);
    font-size: 0.9rem;
    color: #fff;
    line-height: 1.25;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  :global(html[data-theme='latte']) .name {
    color: var(--color-text);
  }
  .price {
    margin-top: 0.25rem;
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--color-peach);
    font-variant-numeric: tabular-nums;
  }
  .accent-gold {
    border-color: color-mix(in srgb, var(--color-yellow) 70%, transparent);
  }
  .accent-peach {
    border-color: color-mix(in srgb, var(--color-peach) 60%, transparent);
  }
  .accent-sapphire {
    border-color: color-mix(in srgb, var(--color-sapphire) 55%, transparent);
  }
  .accent-plain {
    border-color: color-mix(in srgb, var(--color-overlay0) 50%, transparent);
  }
  .glow-gold {
    box-shadow: 0 0 24px color-mix(in srgb, var(--color-yellow) 35%, transparent);
  }
  .glow-peach {
    box-shadow: 0 0 22px color-mix(in srgb, var(--color-peach) 30%, transparent);
  }
  .glow-sapphire {
    box-shadow: 0 0 18px color-mix(in srgb, var(--color-sapphire) 25%, transparent);
  }
  .badge-gold {
    background: color-mix(in srgb, var(--color-yellow) 20%, transparent);
    color: var(--color-yellow);
    border-color: color-mix(in srgb, var(--color-yellow) 40%, transparent);
  }
  :global(html[data-theme='latte']) .badge-gold {
    color: var(--color-yellow);
  }
  .badge-peach {
    background: color-mix(in srgb, var(--color-peach) 20%, transparent);
    color: var(--color-peach);
    border-color: color-mix(in srgb, var(--color-peach) 40%, transparent);
  }
  .badge-sapphire {
    background: color-mix(in srgb, var(--color-sapphire) 15%, transparent);
    color: var(--color-sapphire);
    border-color: color-mix(in srgb, var(--color-sapphire) 35%, transparent);
  }
  .badge-plain {
    background: color-mix(in srgb, var(--color-surface1) 80%, transparent);
    color: var(--color-subtext1);
    border-color: color-mix(in srgb, var(--color-overlay0) 40%, transparent);
  }
</style>
