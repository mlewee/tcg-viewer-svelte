<script lang="ts">
  import type { Release, TradingCardGame } from '#lib/types';

  let {
    tcg,
    releases,
    onSelectRelease,
    onViewAll
  }: {
    tcg: TradingCardGame;
    releases: Release[];
    onSelectRelease: (tcgSlug: string, releaseCode: string) => void;
    onViewAll: (tcgSlug: string) => void;
  } = $props();
</script>

<section class="group">
  <div class="group-head">
    <div class="group-title">
      <h3>{tcg.name}</h3>
      <span class="slug">{tcg.slug}</span>
      <span class="count">{releases.length} {releases.length === 1 ? 'release' : 'releases'}</span>
    </div>
    <button type="button" onclick={() => onViewAll(tcg.slug)}>View in Catalog →</button>
  </div>
  {#if releases.length === 0}
    <div class="none">No releases found.</div>
  {:else}
    <div class="cards">
      {#each releases as r (r.code)}
        <button type="button" class="card" onclick={() => onSelectRelease(tcg.slug, r.code)}>
          <span class="code">{r.code}</span>
          <span class="name">{r.name}</span>
        </button>
      {/each}
    </div>
  {/if}
</section>

<style>
  .group {
    background: color-mix(in srgb, var(--color-mantle) 70%, transparent);
    border: 1px solid color-mix(in srgb, var(--color-yellow) 20%, transparent);
    border-radius: 1rem;
    padding: 1rem;
  }
  @media (min-width: 640px) {
    .group {
      padding: 1.25rem;
    }
  }
  .group-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    padding-bottom: 0.75rem;
    margin-bottom: 1rem;
    border-bottom: 1px solid color-mix(in srgb, var(--color-overlay0) 30%, transparent);
  }
  .group-title {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    min-width: 0;
    flex-wrap: wrap;
  }
  h3 {
    margin: 0;
    font-family: var(--font-display);
    font-size: 1.25rem;
  }
  .slug {
    font-size: 0.7rem;
    font-family: ui-monospace, monospace;
    text-transform: uppercase;
    background: var(--color-surface0);
    color: var(--color-subtext0);
    padding: 0.15rem 0.5rem;
    border-radius: 0.4rem;
  }
  .count {
    font-size: 0.72rem;
    color: var(--color-subtext0);
  }
  .group-head button {
    font-size: 0.72rem;
    color: var(--color-peach);
    background: none;
    border: none;
    cursor: pointer;
    font-weight: 500;
    white-space: nowrap;
  }
  .group-head button:hover {
    text-decoration: underline;
  }
  .none {
    font-size: 0.72rem;
    color: var(--color-subtext0);
    padding: 1rem 0;
    font-style: italic;
  }
  .cards {
    display: grid;
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
  @media (min-width: 640px) {
    .cards {
      grid-template-columns: repeat(2, 1fr);
    }
  }
  @media (min-width: 1024px) {
    .cards {
      grid-template-columns: repeat(3, 1fr);
    }
  }
  @media (min-width: 1280px) {
    .cards {
      grid-template-columns: repeat(4, 1fr);
    }
  }
  @media (min-width: 1536px) {
    .cards {
      grid-template-columns: repeat(5, 1fr);
    }
  }
  .card {
    text-align: left;
    border-radius: 0.75rem;
    border: 1px solid color-mix(in srgb, var(--color-overlay0) 30%, transparent);
    background: color-mix(in srgb, var(--color-surface0) 45%, transparent);
    padding: 0.75rem;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    color: inherit;
  }
  .card:hover {
    border-color: color-mix(in srgb, var(--color-peach) 45%, transparent);
  }
  .code {
    font-family: ui-monospace, monospace;
    font-size: 0.8rem;
    font-weight: 700;
    color: var(--color-text);
  }
  .name {
    font-size: 0.78rem;
    color: var(--color-subtext0);
  }
</style>
