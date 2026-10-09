<script lang="ts">
  import FilterPanel from '#lib/components/FilterPanel.svelte';
  import CardGrid from '#lib/components/CardGrid.svelte';
  import { ui } from '#lib/stores.svelte';

  let searchInput = $state('');
  let debouncedSearch = $state('');
  let timer: ReturnType<typeof setTimeout> | null = null;

  function onSearchChange(v: string) {
    searchInput = v;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      debouncedSearch = v;
    }, 300);
  }

  // Clear the search box when the TCG changes (matches React behavior).
  let lastTcg: string | null = null;
  $effect(() => {
    const t = ui.selectedTcg;
    if (t !== lastTcg) {
      lastTcg = t;
      searchInput = '';
      debouncedSearch = '';
      if (timer) clearTimeout(timer);
    }
  });
</script>

<div class="catalog">
  <FilterPanel search={searchInput} {onSearchChange} />
  <div class="grid-wrap page-enter">
    <CardGrid search={debouncedSearch} />
  </div>
</div>

<style>
  .catalog {
    width: 100%;
    padding: 1rem 0.75rem;
  }
  @media (min-width: 640px) {
    .catalog {
      padding: 1.25rem;
    }
  }
  @media (min-width: 1024px) {
    .catalog {
      padding-inline: 2rem;
    }
  }
  .grid-wrap {
    margin-top: 1rem;
  }
  @media (min-width: 640px) {
    .grid-wrap {
      margin-top: 1.25rem;
    }
  }
</style>
