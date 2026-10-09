<script lang="ts">
  import { untrack } from 'svelte';
  import { tcgsApi } from '#lib/api/tcgs';
  import { isTcgEnabled, maybeRestoreTcgSelection } from '#lib/tcgSelection';
  import { ui, theme } from '#lib/stores.svelte';
  import type { TradingCardGame } from '#lib/types';

  let tcgs = $state<TradingCardGame[]>([]);

  // Backend is the source of truth for availability; disabled TCGs
  // are not selectable through the UI.
  const enabledTcgs = $derived(tcgs.filter(isTcgEnabled));

  $effect(() => {
    let cancelled = false;
    tcgsApi
      .list()
      .then((d) => {
        if (cancelled) return;
        tcgs = d;
        // One-time restore of the saved TCG/release preference.
        // Untracked so this fetch effect never subscribes to ui state.
        untrack(() => maybeRestoreTcgSelection(d));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  });

  // If the selected TCG becomes unavailable after the list loads
  // (e.g. disabled between visits), fall back. Tracks only the slug
  // and the TCG list; writes only when the selection is invalid, so
  // a valid selection never re-triggers this effect.
  $effect(() => {
    const slug = ui.selectedTcg;
    const list = tcgs;
    if (list.length === 0 || !slug) return;
    const ok = list.some((t) => t.slug === slug && isTcgEnabled(t));
    if (!ok) {
      const fallback = list.find(isTcgEnabled)?.slug ?? null;
      untrack(() => ui.setSelectedTcg(fallback));
    }
  });

  // Ensure the persisted theme is applied once on the client.
  $effect(() => {
    theme.hydrate();
  });
</script>

<header class="topbar">
  <div class="inner">
    <a href="/" class="brand">
      <h1>TCG Viewer</h1>
    </a>
    <nav class="tcg-strip" aria-label="TCG selector">
      {#each enabledTcgs as t (t.slug)}
        <button
          type="button"
          class:active={ui.selectedTcg === t.slug}
          onclick={() => ui.setSelectedTcg(t.slug)}
        >
          {t.name}
        </button>
      {/each}
    </nav>
    <div class="spacer"></div>
    <button
      type="button"
      class="theme-btn"
      aria-label={theme.theme === 'latte' ? 'Switch to dark theme' : 'Switch to light theme'}
      title={theme.theme === 'latte' ? 'Switch to Mocha (dark)' : 'Switch to Latte (light)'}
      onclick={() => theme.toggle()}
    >
      {#if theme.theme === 'latte'}
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z" />
        </svg>
      {:else}
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path
            d="M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0-5a1 1 0 0 1 1 1v2a1 1 0 1 1-2 0V3a1 1 0 0 1 1-1zm0 18a1 1 0 0 1 1 1v2a1 1 0 1 1-2 0v-2a1 1 0 0 1 1-1zM4.22 4.22a1 1 0 0 1 1.41 0l1.42 1.42a1 1 0 0 1-1.41 1.41L4.22 5.64a1 1 0 0 1 0-1.42zM16.95 16.95a1 1 0 0 1 1.41 0l1.42 1.42a1 1 0 1 1-1.41 1.41l-1.42-1.42a1 1 0 0 1 0-1.41zM2 12a1 1 0 0 1 1-1h2a1 1 0 1 1 0 2H3a1 1 0 0 1-1-1zm18 0a1 1 0 0 1 1-1h2a1 1 0 1 1 0 2h-2a1 1 0 0 1-1-1zM4.22 19.78a1 1 0 0 1 0-1.41l1.42-1.42a1 1 0 1 1 1.41 1.41l-1.42 1.42a1 1 0 0 1-1.41 0zM16.95 7.05a1 1 0 0 1 0-1.41l1.42-1.42a1 1 0 1 1 1.41 1.41l-1.42 1.42a1 1 0 0 1-1.41 0z"
          />
        </svg>
      {/if}
    </button>
  </div>
</header>

<style>
  .topbar {
    background: color-mix(in srgb, var(--color-mantle) 85%, transparent);
    backdrop-filter: blur(16px);
    border-bottom: 1px solid color-mix(in srgb, var(--color-yellow) 20%, transparent);
  }
  .inner {
    width: 100%;
    padding: 0.75rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  @media (min-width: 640px) {
    .inner {
      padding-inline: 1.25rem;
    }
  }
  @media (min-width: 1024px) {
    .inner {
      padding-inline: 2rem;
    }
  }
  .brand {
    text-decoration: none;
    color: inherit;
  }
  h1 {
    margin: 0;
    font-family: var(--font-display);
    font-size: 1.25rem;
    font-weight: 600;
    letter-spacing: -0.01em;
    white-space: nowrap;
  }
  @media (min-width: 640px) {
    h1 {
      font-size: 1.5rem;
    }
  }
  .tcg-strip {
    display: none;
    align-items: center;
    gap: 0.4rem;
    margin-left: 1rem;
    overflow-x: auto;
  }
  @media (min-width: 768px) {
    .tcg-strip {
      display: flex;
    }
  }
  .tcg-strip button {
    padding: 0.4rem 0.8rem;
    border-radius: 999px;
    font-size: 0.82rem;
    font-weight: 500;
    white-space: nowrap;
    border: 1px solid color-mix(in srgb, var(--color-overlay0) 35%, transparent);
    background: color-mix(in srgb, var(--color-surface0) 55%, transparent);
    color: var(--color-subtext1);
    cursor: pointer;
  }
  .tcg-strip button.active {
    background: var(--color-peach);
    color: var(--color-mantle);
    border-color: var(--color-peach);
  }
  .spacer {
    margin-left: auto;
  }
  .theme-btn {
    padding: 0.5rem;
    border-radius: 0.75rem;
    border: none;
    background: none;
    color: var(--color-subtext1);
    cursor: pointer;
  }
  .theme-btn:hover {
    color: var(--color-peach);
    background: color-mix(in srgb, var(--color-surface0) 70%, transparent);
  }
  .theme-btn svg {
    width: 1.25rem;
    height: 1.25rem;
    display: block;
  }
</style>
