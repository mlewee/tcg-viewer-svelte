<script lang="ts">
  import { page } from '$app/state';

  const SECTIONS = [
    { id: 'catalog', label: 'Catalog', href: '/', icon: '🃏' },
    { id: 'releases', label: 'Releases', href: '/releases', icon: '📦' },
    { id: 'updates', label: 'Updates', href: '/updates', icon: '🔔' },
    { id: 'about', label: 'About', href: '/about', icon: 'ℹ️' }
  ];

  const current = $derived.by(() => {
    const p = page.url.pathname;
    if (p.startsWith('/releases')) return 'releases';
    if (p.startsWith('/updates')) return 'updates';
    if (p.startsWith('/about')) return 'about';
    return 'catalog';
  });
</script>

<div class="desktop-tabs">
  <div class="tabs-inner">
    {#each SECTIONS as s (s.id)}
      <a href={s.href} class:active={current === s.id} aria-current={current === s.id ? 'page' : undefined}>
        {s.label}
        {#if current === s.id}
          <span class="underline" aria-hidden="true"></span>
        {/if}
      </a>
    {/each}
  </div>
</div>

<nav class="mobile-tabs" aria-label="Section">
  <ul>
    {#each SECTIONS as s (s.id)}
      <li>
        <a href={s.href} class:active={current === s.id} aria-current={current === s.id ? 'page' : undefined}>
          <span aria-hidden="true" class="icon">{s.icon}</span>
          <span>{s.label}</span>
        </a>
      </li>
    {/each}
  </ul>
</nav>

<style>
  .desktop-tabs {
    display: none;
    border-bottom: 1px solid color-mix(in srgb, var(--color-overlay0) 30%, transparent);
    background: color-mix(in srgb, var(--color-mantle) 75%, transparent);
    backdrop-filter: blur(16px);
  }
  @media (min-width: 768px) {
    .desktop-tabs {
      display: block;
    }
  }
  .tabs-inner {
    width: 100%;
    padding-inline: 0.75rem;
    display: flex;
    gap: 0.25rem;
  }
  @media (min-width: 640px) {
    .tabs-inner {
      padding-inline: 1.25rem;
    }
  }
  @media (min-width: 1024px) {
    .tabs-inner {
      padding-inline: 2rem;
    }
  }
  .desktop-tabs a {
    position: relative;
    padding: 0.65rem 1rem;
    font-size: 0.85rem;
    font-weight: 500;
    text-decoration: none;
    color: var(--color-subtext0);
  }
  .desktop-tabs a.active {
    color: var(--color-peach);
  }
  .underline {
    position: absolute;
    left: 0.5rem;
    right: 0.5rem;
    bottom: -1px;
    height: 2px;
    border-radius: 999px;
    background: var(--color-peach);
  }
  .mobile-tabs {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 20;
    background: color-mix(in srgb, var(--color-mantle) 95%, transparent);
    backdrop-filter: blur(16px);
    border-top: 1px solid color-mix(in srgb, var(--color-peach) 25%, transparent);
    padding-bottom: var(--safe-bottom);
  }
  @media (min-width: 768px) {
    .mobile-tabs {
      display: none;
    }
  }
  ul {
    margin: 0;
    padding: 0;
    list-style: none;
    display: grid;
    grid-template-columns: repeat(4, 1fr);
  }
  .mobile-tabs a {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.15rem;
    width: 100%;
    padding: 0.5rem 0;
    font-size: 0.7rem;
    text-decoration: none;
    color: var(--color-subtext0);
  }
  .mobile-tabs a.active {
    color: var(--color-peach);
  }
  .icon {
    font-size: 1.1rem;
  }
</style>
