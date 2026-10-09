// Pointer-tracking 3D tilt for card elements. Svelte action version
// of the old React useCardTilt hook, reimplemented without dependencies.
//
// Mouse-only; touch devices keep the flat appearance (taps open the
// modal instead). Direct DOM writes only, no reactive state, so hover
// never triggers Svelte effects or API requests. Listeners are cleaned
// up when the element unmounts. Honors prefers-reduced-motion.

export interface TiltOptions {
  intensityX?: number;
  intensityY?: number;
  lift?: number;
  /** Update --foil-x/--foil-y from the pointer so the holographic
   *  sweep follows the cursor. Defaults to true. */
  foil?: boolean;
}

export function cardTilt(node: HTMLElement, options: TiltOptions = {}) {
  let { intensityX = 14, intensityY = 16, lift = 8, foil = true } = options;
  let raf = 0;
  let targetX = 0;
  let targetY = 0;
  let targetLift = 0;
  let destroyed = false;

  const reduceMotion =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function apply() {
    raf = 0;
    if (destroyed) return;
    node.style.setProperty('--rx', `${targetX.toFixed(2)}deg`);
    node.style.setProperty('--ry', `${targetY.toFixed(2)}deg`);
    node.style.setProperty('--lift', `${targetLift.toFixed(1)}px`);
    node.classList.toggle('is-tilted', targetX !== 0 || targetY !== 0);
  }

  function schedule() {
    if (raf || reduceMotion) return;
    raf = window.requestAnimationFrame(apply);
  }

  function onPointerMove(e: PointerEvent) {
    if (e.pointerType !== 'mouse' || reduceMotion) return;
    const rect = node.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    targetX = (py - 0.5) * -intensityX;
    targetY = (px - 0.5) * intensityY;
    targetLift = -lift;
    if (foil) {
      node.style.setProperty('--foil-x', `${(px * 100).toFixed(1)}%`);
      node.style.setProperty('--foil-y', `${(py * 100).toFixed(1)}%`);
    }
    schedule();
  }

  function onPointerLeave() {
    targetX = 0;
    targetY = 0;
    targetLift = 0;
    if (foil) {
      node.style.removeProperty('--foil-x');
      node.style.removeProperty('--foil-y');
    }
    if (reduceMotion) {
      node.style.removeProperty('--rx');
      node.style.removeProperty('--ry');
      node.style.removeProperty('--lift');
      node.classList.remove('is-tilted');
      return;
    }
    schedule();
  }

  function onOptions(next: TiltOptions) {
    intensityX = next.intensityX ?? 14;
    intensityY = next.intensityY ?? 16;
    lift = next.lift ?? 8;
    foil = next.foil ?? true;
  }

  if (!reduceMotion) {
    node.addEventListener('pointermove', onPointerMove);
    node.addEventListener('pointerleave', onPointerLeave);
    node.addEventListener('pointercancel', onPointerLeave);
  }

  return {
    update(next: TiltOptions) {
      onOptions(next ?? {});
    },
    destroy() {
      destroyed = true;
      if (raf) cancelAnimationFrame(raf);
      node.removeEventListener('pointermove', onPointerMove);
      node.removeEventListener('pointerleave', onPointerLeave);
      node.removeEventListener('pointercancel', onPointerLeave);
    }
  };
}
