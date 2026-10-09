<script lang="ts">
  const CHANGELOG: {
    version: string;
    date: string;
    tag?: string;
    changes: { type: string; items: string[] }[];
  }[] = [
    {
      version: '0.1.0',
      date: '2026-10-04',
      tag: 'SvelteKit',
      changes: [
        {
          type: 'Added',
          items: [
            'SvelteKit + Svelte 5 runes rewrite of the tcg-viewer React frontend.',
            'Real routes for catalog, releases, updates and about (with #hash redirects).',
            'Dependency-free SVG price history chart.',
            'Static build output for Cloudflare Pages plus a Docker/nginx image for VPS use.'
          ]
        }
      ]
    }
  ];
</script>

<div class="about">
  <div class="hero">
    <div class="title-row">
      <h2>About TCG Viewer</h2>
      <span class="version">v0.1.0</span>
    </div>
    <p>
      A mobile-friendly viewer for the TCG API. Browse trading card catalogs, inspect historical
      price trends, and stay notified on latest price movements.
    </p>
  </div>

  <div class="section">
    <h3>Data Source</h3>
    <p class="small">
      Card prices and metadata are scraped from
      <a href="https://yuyu-tei.net" target="_blank" rel="noopener noreferrer">yuyu-tei.net</a>
      on an automated hourly schedule. The viewer operates in read-only mode for fast and reliable access.
    </p>
  </div>

  <div class="section">
    <h3>Image &amp; Data Credits</h3>
    <ul class="credits">
      <li>
        Prices, metadata and fallback card scans:
        <a href="https://yuyu-tei.net" target="_blank" rel="noopener noreferrer">yuyu-tei.net</a>
        (<a href="https://card.yuyu-tei.jp" target="_blank" rel="noopener noreferrer">card.yuyu-tei.jp</a>)
      </li>
      <li>
        hololive artwork:
        <a
          href="https://hololive-official-cardgame.com"
          target="_blank"
          rel="noopener noreferrer">hololive Official Card Game</a
        >
        card list
      </li>
      <li>
        One Piece artwork:
        <a
          href="https://en.onepiece-cardgame.com"
          target="_blank"
          rel="noopener noreferrer">Bandai (EN card list)</a
        >
        /
        <a
          href="https://www.onepiece-cardgame.com"
          target="_blank"
          rel="noopener noreferrer">Bandai (JA card list)</a
        >, with fallback images from
        <a href="https://limitlesstcg.com" target="_blank" rel="noopener noreferrer">Limitless TCG</a>
      </li>
    </ul>
    <p class="small muted">
      Unofficial fan viewer. All card images, names and game data belong to their respective owners
      (Bandai, hololive production / COVER Corp., yuyu-tei and others). No affiliation or endorsement
      is implied.
    </p>
  </div>

  <div class="section">
    <div class="changelog-head">
      <h3>Frontend Changelog</h3>
      <span class="semver">Semantic Versioning</span>
    </div>
    <div class="entries">
      {#each CHANGELOG as entry (entry.version)}
        <div class="entry">
          <div class="entry-head">
            <div class="entry-id">
              <span class="mono bold">v{entry.version}</span>
              {#if entry.tag}
                <span class="tag">{entry.tag}</span>
              {/if}
            </div>
            <time class="mono">{entry.date}</time>
          </div>
          {#each entry.changes as group (group.type)}
            <div class="group">
              <span class="pill {group.type}">{group.type}</span>
              <ul>
                {#each group.items as item (item)}
                  <li>{item}</li>
                {/each}
              </ul>
            </div>
          {/each}
        </div>
      {/each}
    </div>
  </div>

  <div class="section">
    <h3>Tech Stack</h3>
    <p class="small">Built with SvelteKit, Svelte 5, TypeScript and plain CSS.</p>
  </div>
</div>

<style>
  .about {
    max-width: 48rem;
    margin: 0 auto;
    padding: 2rem 1rem;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    color: var(--color-subtext1);
  }
  .hero {
    border-bottom: 1px solid color-mix(in srgb, var(--color-overlay0) 35%, transparent);
    padding-bottom: 1rem;
  }
  .title-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  h2 {
    margin: 0;
    font-family: var(--font-display);
    font-size: 1.875rem;
    color: var(--color-text);
  }
  .version {
    padding: 0.15rem 0.6rem;
    font-size: 0.72rem;
    font-weight: 600;
    border-radius: 999px;
    background: color-mix(in srgb, var(--color-peach) 20%, transparent);
    color: var(--color-peach);
    border: 1px solid color-mix(in srgb, var(--color-peach) 35%, transparent);
  }
  h3 {
    margin: 0 0 0.5rem;
    font-size: 1.1rem;
    color: var(--color-text);
  }
  .small {
    font-size: 0.85rem;
    margin: 0;
  }
  .small.muted {
    margin-top: 0.5rem;
    color: var(--color-subtext0);
    font-size: 0.78rem;
    line-height: 1.5;
  }
  .credits {
    font-size: 0.85rem;
    margin: 0;
  }
  a {
    color: var(--color-peach);
    font-weight: 500;
  }
  .changelog-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .semver {
    font-size: 0.72rem;
    color: var(--color-subtext0);
  }
  .entries {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  .entry {
    padding: 1rem;
    border-radius: 1rem;
    background: color-mix(in srgb, var(--color-mantle) 70%, transparent);
    border: 1px solid color-mix(in srgb, var(--color-yellow) 20%, transparent);
  }
  .entry-head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    border-bottom: 1px solid color-mix(in srgb, var(--color-overlay0) 25%, transparent);
    padding-bottom: 0.5rem;
    margin-bottom: 0.75rem;
  }
  .entry-id {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .mono {
    font-family: ui-monospace, monospace;
  }
  .bold {
    font-weight: 700;
    color: var(--color-text);
  }
  time {
    font-size: 0.72rem;
    color: var(--color-subtext0);
  }
  .tag {
    padding: 0.1rem 0.5rem;
    font-size: 0.72rem;
    border-radius: 0.3rem;
    background: color-mix(in srgb, var(--color-blue) 15%, transparent);
    color: var(--color-blue);
    font-weight: 500;
  }
  .group {
    font-size: 0.85rem;
  }
  .pill {
    font-size: 0.7rem;
    font-weight: 600;
    padding: 0.1rem 0.4rem;
    border-radius: 0.3rem;
  }
  .pill.Added {
    background: color-mix(in srgb, var(--color-green) 15%, transparent);
    color: var(--color-green);
  }
  .pill.Changed {
    background: color-mix(in srgb, var(--color-yellow) 15%, transparent);
    color: var(--color-yellow);
  }
  .pill.Fixed,
  .pill.Removed {
    background: color-mix(in srgb, var(--color-red) 15%, transparent);
    color: var(--color-red);
  }
  ul {
    padding-left: 1.25rem;
    margin: 0.4rem 0 0;
  }
  li {
    line-height: 1.6;
  }
</style>
