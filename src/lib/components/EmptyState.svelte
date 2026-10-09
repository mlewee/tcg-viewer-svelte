<script lang="ts">
  let { title, children }: { title: string; children?: import('svelte').Snippet } = $props();
</script>

<div class="empty">
  <p class="empty-title">{title}</p>
  {#if children}
    <div class="empty-body">{@render children()}</div>
  {/if}
</div>

<style>
  .empty {
    text-align: center;
    padding: 3rem 1rem;
    border-radius: 1rem;
    border: 1px solid color-mix(in srgb, var(--color-yellow) 25%, transparent);
    background: color-mix(in srgb, var(--color-mantle) 70%, transparent);
    color: var(--color-subtext0);
  }
  .empty-title {
    margin: 0 0 0.4rem;
    font-size: 1.05rem;
    font-weight: 600;
    color: var(--color-text);
  }
  .empty-body {
    font-size: 0.85rem;
  }
</style>
