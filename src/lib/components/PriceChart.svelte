<script lang="ts">
  import type { PriceHistoryPoint } from '#lib/types';
  import { formatDay, formatDateTime, formatJpyShort } from '#lib/format';

  let { history }: { history: PriceHistoryPoint[] } = $props();

  const data = $derived(
    history.map((h) => ({ scraped_at: h.scraped_at, price: Number(h.price) }))
  );

  const change = $derived.by(() => {
    if (data.length < 2) return null;
    const first = data[0].price;
    const last = data[data.length - 1].price;
    if (!Number.isFinite(first) || !Number.isFinite(last) || first === 0) return null;
    const delta = last - first;
    return { delta, pct: (delta / first) * 100, dir: delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat' };
  });

  // Latest-step change: last price vs the previous snapshot. Drives the
  // compact near-value indicator (arrow + delta + pct) and the persistent
  // end-dot color. Null when there is no previous point to compare.
  const latestChange = $derived.by(() => {
    if (data.length < 2) return null;
    const prev = data[data.length - 2].price;
    const last = data[data.length - 1].price;
    if (!Number.isFinite(prev) || !Number.isFinite(last) || prev === 0) return null;
    const delta = last - prev;
    if (delta === 0) return { delta: 0, pct: 0, dir: 'flat' as const };
    return { delta, pct: (delta / prev) * 100, dir: delta > 0 ? ('up' as const) : ('down' as const) };
  });

  // SVG geometry.
  const W = 600;
  const H = 220;
  const PAD = { l: 56, r: 12, t: 12, b: 28 };

  const bounds = $derived.by(() => {
    if (data.length === 0) return null;
    const prices = data.map((d) => d.price).filter((n) => Number.isFinite(n));
    if (prices.length === 0) return null;
    let min = Math.min(...prices);
    let max = Math.max(...prices);
    if (min === max) {
      min = min * 0.95 || min - 1;
      max = max * 1.05 || max + 1;
    } else {
      const span = max - min;
      min -= span * 0.1;
      max += span * 0.1;
    }
    const times = data.map((d) => Date.parse(d.scraped_at));
    const t0 = Math.min(...times);
    const t1 = Math.max(...times);
    return { min, max, t0, t1: t1 === t0 ? t0 + 1 : t1 };
  });

  interface Pt {
    x: number;
    y: number;
  }

  // Pixel positions of the valid samples. The smoothing below passes
  // through every one of these, so the curve never distorts the history.
  const pts = $derived.by<Pt[]>(() => {
    const b = bounds;
    if (!b) return [];
    const out: Pt[] = [];
    for (const d of data) {
      const t = Date.parse(d.scraped_at);
      if (!Number.isFinite(t) || !Number.isFinite(d.price)) continue;
      out.push({
        x: PAD.l + ((t - b.t0) / (b.t1 - b.t0)) * (W - PAD.l - PAD.r),
        y: PAD.t + (1 - (d.price - b.min) / (b.max - b.min)) * (H - PAD.t - PAD.b)
      });
    }
    return out;
  });

  // Steffen monotone cubic spline — same algorithm as recharts' `type="monotone"`.
  // Computes per-point slopes that preserve monotonicity so the curve never
  // overshoots at sharp transitions. Flat where the trend changes direction.
  function smoothLine(p: Pt[]): string {
    if (p.length === 0) return '';
    if (p.length === 1) return `M${p[0].x.toFixed(1)},${p[0].y.toFixed(1)}`;

    const n = p.length;
    // Secant slopes (dy/dx) for each interval
    const s: number[] = [];
    for (let i = 0; i < n - 1; i++) {
      const dx = p[i + 1].x - p[i].x;
      s.push(dx !== 0 ? (p[i + 1].y - p[i].y) / dx : 0);
    }

    // Steffen point slopes
    const m: number[] = new Array(n);
    if (n === 2) {
      m[0] = m[1] = s[0];
    } else {
      m[0] = s[0];
      m[n - 1] = s[n - 2];
      for (let i = 1; i < n - 1; i++) {
        m[i] = s[i - 1] * s[i] <= 0 ? 0 : 2 / (1 / s[i - 1] + 1 / s[i]);
      }
    }

    // Cubic Bezier segments from Hermite form
    let d = `M${p[0].x.toFixed(1)},${p[0].y.toFixed(1)}`;
    for (let i = 0; i < n - 1; i++) {
      const dt = (p[i + 1].x - p[i].x) / 3;
      const c1x = p[i].x + dt;
      const c1y = p[i].y + m[i] * dt;
      const c2x = p[i + 1].x - dt;
      const c2y = p[i + 1].y - m[i + 1] * dt;
      d += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p[i + 1].x.toFixed(1)},${p[i + 1].y.toFixed(1)}`;
    }
    return d;
  }

  const path = $derived.by(() => smoothLine(pts));

  const area = $derived.by(() => (path ? `${path} L${(W - PAD.r).toFixed(1)},${H - PAD.b} L${PAD.l},${H - PAD.b} Z` : ''));

  const yTicks = $derived.by(() => {
    const b = bounds;
    if (!b) return [];
    return [0, 0.5, 1].map((f) => {
      const v = b.min + f * (b.max - b.min);
      const y = PAD.t + (1 - f) * (H - PAD.t - PAD.b);
      return { v, y };
    });
  });

  const xTicks = $derived.by(() => {
    const b = bounds;
    if (!b || data.length === 0) return [];
    // Recharts-style: pick evenly-spaced time positions across the range,
    // snap each to the nearest actual data point, deduplicate by date.
    const minGap = 80;
    const availW = W - PAD.l - PAD.r;
    const maxTicks = Math.max(2, Math.floor(availW / minGap));
    const tRange = b.t1 - b.t0;
    const step = tRange / Math.max(1, maxTicks - 1);
    const used = new Set<string>();
    const out: Array<{ label: string; x: number }> = [];
    for (let seg = 0; seg < maxTicks; seg++) {
      const target = b.t0 + seg * step;
      // Find data point closest to this time division.
      let best = 0;
      let bestDist = Infinity;
      for (let i = 0; i < data.length; i++) {
        const t = Date.parse(data[i].scraped_at);
        const d = Math.abs(t - target);
        if (d < bestDist) { bestDist = d; best = i; }
      }
      const label = formatDay(data[best].scraped_at);
      if (used.has(label)) continue;
      used.add(label);
      out.push({
        label,
        x: PAD.l + ((Date.parse(data[best].scraped_at) - b.t0) / tRange) * availW
      });
    }
    return out;
  });

  // Persistent marker for the latest sample, colored by the latest step
  // so the current value reads at a glance even without hovering.
  const endDot = $derived.by(() => {
    if (pts.length === 0) return null;
    const p = pts[pts.length - 1];
    return { ...p, dir: latestChange?.dir ?? 'flat' };
  });

  let hover = $state<{ i: number; x: number; y: number } | null>(null);

  function pointXY(i: number): { x: number; y: number } | null {
    const b = bounds;
    if (!b) return null;
    const t = Date.parse(data[i].scraped_at);
    if (!Number.isFinite(t)) return null;
    return {
      x: PAD.l + ((t - b.t0) / (b.t1 - b.t0)) * (W - PAD.l - PAD.r),
      y: PAD.t + (1 - (data[i].price - b.min) / (b.max - b.min)) * (H - PAD.t - PAD.b)
    };
  }

  function onMove(e: MouseEvent) {
    const svg = e.currentTarget as SVGSVGElement;
    const rect = svg.getBoundingClientRect();
    const sx = ((e.clientX - rect.left) / rect.width) * W;
    let best = -1;
    let bestDist = Infinity;
    for (let i = 0; i < data.length; i++) {
      const p = pointXY(i);
      if (!p) continue;
      const d = Math.abs(p.x - sx);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    }
    if (best < 0) {
      hover = null;
      return;
    }
    const p = pointXY(best);
    hover = p ? { i: best, x: p.x, y: p.y } : null;
  }
</script>

{#if data.length === 0}
  <div class="empty">No price history yet.</div>
{:else}
  {@const chartKey = `${data.length}:${data[0]?.scraped_at ?? ''}:${data[data.length - 1]?.scraped_at ?? ''}:${data[data.length - 1]?.price ?? ''}`}
  {#key chartKey}
  <div class="chart chart-enter">
    <div class="chart-head">
      <span class="badges">
        {#if change}
          {@const c = change}
          <span class="badge chart-badge-enter {c.dir}" title="Overall change across this history">
            {c.dir === 'up' ? '▲' : c.dir === 'down' ? '▼' : '▬'}
            {c.dir === 'up' ? '+' : ''}{formatJpyShort(c.delta)} ({c.dir === 'up'
              ? '+'
              : ''}{c.pct.toFixed(1)}%)
          </span>
        {/if}
        {#if latestChange}
          {@const l = latestChange}
          <span class="badge latest chart-badge-enter {l.dir}" title="Latest change vs previous snapshot">
            {l.dir === 'up' ? '▲' : l.dir === 'down' ? '▼' : '▬'}
            {#if l.dir === 'flat'}
              No change
            {:else}
              {l.dir === 'up' ? '+' : ''}{formatJpyShort(l.delta)} ({l.dir === 'up'
                ? '+'
                : ''}{l.pct.toFixed(1)}%)
            {/if}
            <span class="latest-tag">latest</span>
          </span>
        {/if}
      </span>
      <span class="meta">
        {data.length} snapshot{data.length === 1 ? '' : 's'} ·
        Latest: <strong>{formatJpyShort(data[data.length - 1].price)}</strong>
        {#if latestChange}
          {@const l = latestChange}
          <span class="latest-arrow {l.dir}" aria-hidden="true"
            >{l.dir === 'up' ? '▲' : l.dir === 'down' ? '▼' : '▬'}</span
          >
        {/if}
      </span>
    </div>
    <div class="svg-wrap">
      <svg
        viewBox="0 0 {W} {H}"
        role="img"
        aria-label="Price history chart"
        onmousemove={onMove}
        onmouseleave={() => (hover = null)}
      >
        {#each yTicks as t}
          <line x1={PAD.l} x2={W - PAD.r} y1={t.y} y2={t.y} class="grid" />
          <text x={PAD.l - 6} y={t.y + 4} text-anchor="end" class="tick">¥{Math.round(t.v).toLocaleString('en-US')}</text>
        {/each}
        {#each xTicks as t}
          <text x={t.x} y={H - 8} text-anchor="middle" class="tick">{t.label}</text>
        {/each}
        {#if area}
          <path d={area} class="area chart-area-fade" />
        {/if}
        {#if path}
          <path d={path} class="line chart-line-draw" pathLength="1" fill="none" />
        {/if}
        {#if endDot && !hover}
          <g class="end-dot {endDot.dir}">
            <circle cx={endDot.x} cy={endDot.y} r="8" class="halo" />
            <circle cx={endDot.x} cy={endDot.y} r="4" class="core" />
          </g>
        {/if}
        {#if hover}
          {@const d = data[hover.i]}
          <line x1={hover.x} x2={hover.x} y1={PAD.t} y2={H - PAD.b} class="cursor" />
          <circle cx={hover.x} cy={hover.y} r="4" class="dot" />
        {/if}
      </svg>
      {#if hover}
        {@const d = data[hover.i]}
        <div class="tooltip chart-tooltip-enter">
          <div class="tooltip-price">{formatJpyShort(d.price)}</div>
          <div class="tooltip-date">{formatDateTime(d.scraped_at)}</div>
        </div>
      {/if}
    </div>
  </div>
  {/key}
{/if}

<style>
  .empty {
    text-align: center;
    padding: 2rem 0;
    color: var(--color-subtext0);
    font-size: 0.85rem;
  }
  .chart {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
  }
  .chart-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    flex-wrap: wrap;
    margin-bottom: 0.5rem;
    flex-shrink: 0;
  }
  .badges {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    flex-wrap: wrap;
  }
  .badge {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.15rem 0.55rem;
    font-size: 0.72rem;
    font-weight: 600;
    border-radius: 999px;
    border: 1px solid;
  }
  .badge.up {
    background: color-mix(in srgb, var(--color-green) 15%, transparent);
    color: var(--color-green);
    border-color: color-mix(in srgb, var(--color-green) 30%, transparent);
  }
  .badge.down {
    background: color-mix(in srgb, var(--color-red) 15%, transparent);
    color: var(--color-red);
    border-color: color-mix(in srgb, var(--color-red) 30%, transparent);
  }
  .badge.flat {
    background: var(--color-surface0);
    color: var(--color-subtext0);
    border-color: var(--color-overlay0);
  }
  .badge.latest {
    font-variant-numeric: tabular-nums;
  }
  .latest-tag {
    font-size: 0.6rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    opacity: 0.75;
  }
  .meta {
    font-size: 0.72rem;
    color: var(--color-subtext0);
  }
  .meta strong {
    color: var(--color-text);
  }
  .latest-arrow {
    margin-left: 0.15rem;
    font-size: 0.65rem;
  }
  .latest-arrow.up {
    color: var(--color-green);
  }
  .latest-arrow.down {
    color: var(--color-red);
  }
  .latest-arrow.flat {
    color: var(--color-subtext0);
  }
  .svg-wrap {
    position: relative;
    flex: 1;
    min-height: 0;
  }
  svg {
    width: 100%;
    height: 100%;
    display: block;
  }
  .grid {
    stroke: var(--color-overlay0);
    stroke-opacity: 0.35;
    stroke-dasharray: 3 3;
  }
  .tick {
    font-size: 11px;
    fill: var(--color-subtext0);
  }
  .line {
    stroke: var(--color-mauve);
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .area {
    fill: var(--color-mauve);
    opacity: 0.15;
  }
  .cursor {
    stroke: var(--color-overlay1);
    stroke-width: 1;
  }
  .dot {
    fill: var(--color-mauve);
    stroke: var(--color-base);
    stroke-width: 2;
  }
  .end-dot .halo {
    opacity: 0.25;
  }
  .end-dot .core {
    stroke: var(--color-base);
    stroke-width: 2;
  }
  .end-dot.up .halo,
  .end-dot.up .core {
    fill: var(--color-green);
  }
  .end-dot.down .halo,
  .end-dot.down .core {
    fill: var(--color-red);
  }
  .end-dot.flat .halo,
  .end-dot.flat .core {
    fill: var(--color-mauve);
  }
  .tooltip {
    position: absolute;
    top: 0.25rem;
    right: 0.25rem;
    background: var(--color-surface0);
    border: 1px solid var(--color-overlay0);
    border-radius: 0.4rem;
    padding: 0.3rem 0.55rem;
    font-size: 0.72rem;
    pointer-events: none;
  }
  .tooltip-price {
    font-weight: 700;
    color: var(--color-text);
  }
  .tooltip-date {
    color: var(--color-subtext0);
  }
</style>
