<script lang="ts">
  import '../app.css';
  import Header from '#lib/components/Header.svelte';
  import Nav from '#lib/components/Nav.svelte';
  import CardModal from '#lib/components/CardModal.svelte';
  import { theme } from '#lib/stores.svelte';

  let { children } = $props<{ children: import('svelte').Snippet }>();

  // Hash compatibility shim: old React client used #catalog,
  // #releases, #updates, #about. Redirect them to real routes once.
  $effect(() => {
    if (typeof window === 'undefined') return;
    const apply = () => {
      const h = window.location.hash.replace(/^#/, '');
      if (h === 'catalog' || h === 'releases' || h === 'updates' || h === 'about') {
        const target = h === 'catalog' ? '/' : `/${h}`;
        if (window.location.pathname !== target) window.location.replace(target + window.location.search);
        else history.replaceState(null, '', target + window.location.search);
      }
    };
    apply();
    window.addEventListener('hashchange', apply);
    return () => window.removeEventListener('hashchange', apply);
  });

  $effect(() => {
    theme.hydrate();
  });
</script>

<Header />
<Nav />
<main class="page">
  {@render children()}
</main>
<CardModal />

<style>
  .page {
    padding-bottom: 5rem;
  }
  @media (min-width: 768px) {
    .page {
      padding-bottom: 2rem;
    }
  }
</style>
