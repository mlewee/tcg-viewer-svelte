<script lang="ts">
  import type { NewPriceUpdate } from '#lib/types';
  import { formatJpyShort, formatDateTime } from '#lib/format';
  import { ui } from '#lib/stores.svelte';

  let { update, tcgSlug }: { update: NewPriceUpdate; tcgSlug?: string } = $props();

  const oldN = $derived(Number(update.old_price));
  const newN = $derived(Number(update.new_price));
  const dir = $derived(newN > oldN ? 'up' : newN < oldN ? 'down' : 'flat');

  function open() {
    const slug = tcgSlug ?? ui.selectedTcg;
    if (!slug) return;
    ui.setOpenCard({
      tcg: slug,
      code: update.code,
      card_id: update.card_id,
      rarity: update.rarity,
      release_code: update.release
    });
  }
</script>

<li>
  <button type="button" onclick={open}>
    <span class="main">
      <span class="name">{update.name}</span>
      <span class="sub">{update.code} · {update.rarity} · {update.release}</span>
    </span>
    <span class="prices">
      <span class="new {dir}">
        <span aria-hidden="true">{dir === 'up' ? '▲' : dir === 'down' ? '▼' : '▬'}</span>
        {formatJpyShort(update.new_price)}
      </span>
      <span class="old">{formatJpyShort(update.old_price)}</span>
    </span>
  </button>
  <span class="when">{formatDateTime(update.new_schedule)}</span>
</li>

<style>
  li {
    list-style: none;
  }
  button {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    background: none;
    border: none;
    cursor: pointer;
    color: inherit;
    text-align: left;
  }
  button:hover {
    background: color-mix(in srgb, var(--color-peach) 10%, transparent);
  }
  .main {
    min-width: 0;
    display: flex;
    flex-direction: column;
  }
  .name {
    font-size: 0.85rem;
    color: var(--color-text);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .sub {
    font-size: 0.72rem;
    color: var(--color-subtext0);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .prices {
    text-align: right;
    flex-shrink: 0;
  }
  .new {
    font-size: 0.85rem;
    font-weight: 600;
  }
  .new.up {
    color: var(--color-green);
  }
  .new.down {
    color: var(--color-red);
  }
  .new.flat {
    color: var(--color-subtext0);
  }
  .old {
    display: block;
    font-size: 0.72rem;
    color: var(--color-subtext0);
    text-decoration: line-through;
  }
  .when {
    display: block;
    font-size: 0.62rem;
    color: var(--color-overlay0);
    margin: -0.4rem 0 0.4rem 1rem;
  }
</style>
