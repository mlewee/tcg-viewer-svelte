<script lang="ts">
  import { scrapeStatusApi } from '#lib/api/scrapeStatus';
  import type { ScrapeStatusResponse } from '#lib/types';
  import { timeAgo, formatDateTime } from '#lib/format';
  import Spinner from './Spinner.svelte';

  let data = $state<ScrapeStatusResponse | null>(null);
  let isFetching = $state(true);
  let isError = $state(false);

  $effect(() => {
    let cancelled = false;
    isFetching = true;
    scrapeStatusApi
      .get()
      .then((d) => {
        if (!cancelled) data = d;
      })
      .catch(() => {
        if (!cancelled) isError = true;
      })
      .finally(() => {
        if (!cancelled) isFetching = false;
      });
    return () => {
      cancelled = true;
    };
  });
</script>

{#if isError}
  <div class="error">
    Failed to load scrape status. The updates feed below may still work.
  </div>
{:else if !data}
  <div class="loading"><Spinner /> Loading scrape status…</div>
{:else}
  {@const task = data.periodic_task}
  <div class="panel">
    <div class="top">
      <div>
        <div class="kicker">Scrape Schedule</div>
        {#if task}
          <div class="task">{task.name}{task.enabled ? '' : ' (paused)'}</div>
          <div class="sub">{task.schedule || '(no schedule)'} · {task.timezone || 'UTC'}</div>
        {:else}
          <div class="sub">No scheduled task registered yet.</div>
        {/if}
      </div>
      <div class="right">
        <div class="kicker">Last Run</div>
        <div class="task">{timeAgo(task?.last_run_at ?? null, 'never')}</div>
        {#if task}
          <div class="sub">{task.total_run_count} run{task.total_run_count === 1 ? '' : 's'} total</div>
        {/if}
      </div>
    </div>
    <div class="rows">
      {#if data.tcgs.length === 0}
        <div class="sub">No TCGs registered.</div>
      {/if}
      {#each data.tcgs as row (row.slug)}
        <div class="row" class:inactive={!row.is_active}>
          <div class="row-main">
            <div class="row-name">{row.name}</div>
            <div class="sub">{row.is_active ? 'active' : 'inactive'} · {row.card_count} cards</div>
          </div>
          <div class="row-side">
            <div class="task">{timeAgo(row.latest_scraped_at, 'never')}</div>
            <div class="sub">+{row.snapshots_today} today · {row.snapshots_last_hour}/h</div>
          </div>
        </div>
      {/each}
    </div>
    <div class="foot">
      <span>Server time: {formatDateTime(data.server_time)} UTC</span>
      {#if isFetching}
        <span class="refresh"><Spinner /> refreshing…</span>
      {/if}
    </div>
  </div>
{/if}

<style>
  .error {
    border-radius: 0.75rem;
    border: 1px solid color-mix(in srgb, var(--color-red) 40%, transparent);
    background: color-mix(in srgb, var(--color-red) 8%, transparent);
    padding: 1rem;
    font-size: 0.85rem;
    color: var(--color-red);
  }
  .loading {
    border-radius: 0.75rem;
    border: 1px solid color-mix(in srgb, var(--color-overlay0) 35%, transparent);
    background: color-mix(in srgb, var(--color-surface0) 45%, transparent);
    padding: 1rem;
    font-size: 0.85rem;
    color: var(--color-subtext0);
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
  }
  .panel {
    border-radius: 1rem;
    border: 1px solid color-mix(in srgb, var(--color-yellow) 20%, transparent);
    background: color-mix(in srgb, var(--color-mantle) 70%, transparent);
    backdrop-filter: blur(12px);
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  .top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 0.75rem;
    flex-wrap: wrap;
  }
  .kicker {
    font-size: 0.65rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--color-subtext0);
  }
  .task {
    font-size: 0.85rem;
    font-weight: 500;
    color: var(--color-text);
  }
  .sub {
    font-size: 0.72rem;
    color: var(--color-subtext0);
  }
  .right {
    text-align: right;
  }
  .rows {
    display: grid;
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }
  @media (min-width: 640px) {
    .rows {
      grid-template-columns: repeat(2, 1fr);
    }
  }
  .row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    border-radius: 0.5rem;
    background: color-mix(in srgb, var(--color-surface1) 40%, transparent);
  }
  .row.inactive {
    opacity: 0.6;
  }
  .row-main {
    min-width: 0;
  }
  .row-name {
    font-size: 0.85rem;
    color: var(--color-text);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .row-side {
    text-align: right;
    flex-shrink: 0;
  }
  .foot {
    font-size: 0.62rem;
    color: var(--color-overlay0);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .refresh {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
  }
</style>
