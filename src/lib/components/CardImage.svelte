<script lang="ts">
  import { untrack } from 'svelte';
  import type { CardPrice } from '#lib/types';
  import { getCardImageUrls, PLACEHOLDER_IMAGE, isCardImageDead, markCardImageDead } from '#lib/cardImage';

  let { card, urls, eager = false }: { card: CardPrice; urls?: string[]; eager?: boolean } = $props();

  const list = $derived(urls ?? getCardImageUrls(card));
  let urlIndex = $state(0);
  let loaded = $state(false);
  // Last src that fully loaded. When the card identity changes but the
  // resolved src is identical (grid tile -> modal for the same card),
  // keep the image visible instead of flashing the shimmer.
  let loadedSrc: string | null = $state(null);
  let imgEl: HTMLImageElement | null = $state(null);
  // Plain (non-reactive) guard: reading/writing this never retriggers
  // $effect. The cascade must reset exactly once per card identity;
  // unconditional writes here previously re-fired the whole URL cascade
  // every time a fallback image loaded (flicker + duplicate requests).
  let lastKey: string | null = null;

  function identityKey(): string {
    return [
      card.id,
      card.tcg_slug,
      card.code,
      card.release_code,
      card.card_id,
      card.image_url,
      urls ? urls.join('|') : ''
    ].join('~');
  }

  // Reset the cascade whenever the card identity changes. All state
  // writes are untracked and guarded by lastKey, so successful loads
  // (which write loadedSrc) never retrigger this effect.
  $effect(() => {
    const key = identityKey();
    if (key === lastKey) return;
    lastKey = key;
    untrack(() => {
      const urlsNow = urls ?? getCardImageUrls(card);
      let i = 0;
      while (i < urlsNow.length - 1 && isCardImageDead(urlsNow[i])) i += 1;
      urlIndex = i;
      // Only blank the image when the new src differs from what already
      // decoded; same-URL transitions (grid -> modal) stay instant.
      if (urlsNow[i] !== loadedSrc) loaded = false;
    });
  });

  const src = $derived(list[Math.min(urlIndex, list.length - 1)]);

  // A cached image may already be complete before `onload` fires for the
  // new element (grid tile warmed the same URL). Sync immediately so the
  // modal never shows a blank shimmer for an already-decoded image.
  // Loaded state is read untracked: this effect subscribes only to the
  // element and src, so its own writes can never loop.
  $effect(() => {
    const el = imgEl;
    const s = src;
    if (!el) return;
    const st = untrack(() => ({ loaded, loadedSrc }));
    if (st.loaded) return;
    if (s === st.loadedSrc) {
      loaded = true;
      return;
    }
    if (el.complete && el.naturalWidth > 0) {
      loaded = true;
      loadedSrc = s;
    }
  });
</script>

<div class="wrap">
  {#if !loaded}
    <div class="card-image-shimmer absolute-fill" aria-hidden="true"></div>
  {/if}
  <img
    bind:this={imgEl}
    {src}
    alt={card.name}
    decoding="async"
    loading={eager ? 'eager' : 'lazy'}
    fetchpriority={eager ? 'high' : 'auto'}
    draggable="false"
    class:visible={loaded}
    onload={() => {
      loaded = true;
      loadedSrc = src;
    }}
    onerror={(e) => {
      // Mark the URL that actually failed (currentSrc), not whatever src
      // happens to be derived at handler time.
      markCardImageDead((e.currentTarget as HTMLImageElement).currentSrc || src);
      if (urlIndex < list.length - 1) {
        let next = urlIndex + 1;
        while (next < list.length - 1 && isCardImageDead(list[next])) next += 1;
        urlIndex = next;
      } else {
        loaded = true;
      }
    }}
  />
  {#if src === PLACEHOLDER_IMAGE}
    <div class="placeholder-dim" aria-hidden="true"></div>
  {/if}
</div>

<style>
  .wrap {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: var(--color-surface0);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .absolute-fill {
    position: absolute;
    inset: 0;
  }
  img {
    position: relative;
    width: 100%;
    height: 100%;
    object-fit: contain;
    opacity: 0;
    transition: opacity 0.28s ease-out;
  }
  img.visible {
    opacity: 1;
  }
  .placeholder-dim {
    position: absolute;
    inset: 0;
    background: rgb(0 0 0 / 0.3);
    pointer-events: none;
  }
</style>
