// Card image URL resolution.
//
// hocg (hololive) ground truth, verified against the official card list
// (Oct 2026) by scraping cardsearch pages for hBP01/hBP02/hPR/hSD01/
// hYS01 plus keyword lookups for promo, Yell, and reprint cards:
//
// - Normal cards: {DIR}/{CODE}_{RARITY}.png, e.g.
//   hBP01/hBP01-001_OSR.png. DIR normally matches the card-number prefix
//   (hBP01-001 -> hBP01, hPR-001 -> hPR).
// - Alt-art reprints add a `_02` suffix AFTER the rarity:
//   {DIR}/{CODE}_{RARITY}_02.png, e.g. hBP01-050_U_02.png,
//   hBP01-081_UR_02.png, hSD01-019_C_02.png. The middle pattern
//   `{CODE}_02_{RARITY}.png` was never observed on the official site
//   (0 hits across ~800 sampled files) and is intentionally not tried.
// - Numbered promo variants beyond `_02` (`_P_01`, `_P_03`, `_P_2`,
//   `_P_05` …) exist under hPR (55/438 hPR files) but the same
//   code+rarity can map to several artworks (e.g. hBP01-104 has _P,
//   _P_02…_P_07; hBP02-011 P has hWF01/_P, hPR/_P_02, hPR/_P_03).
//   Code+rarity alone cannot pick the right one, so only the two
//   common forms (`_P`, `_P_02`, covering ~93% of hPR files) are tried;
//   anything rarer falls back to the per-card yuyu-tei `front/` scan,
//   which is unambiguous per card_id.
// - Promo/parallel `P` cards live under hPR regardless of code prefix:
//   hPR/hBP08-008_P.png, hPR/hSD01-006_P.png, hPR/hBD24-001_P.png.
//   The yuyu-tei release bucket for these (promo-hbp10, promo-100 …)
//   is not an official dir and is skipped.
// - Yell `C` cards live under COMMON, not hY01:
//   COMMON/hY01-001_C.png. Yell `S`/`SY` prints live under product dirs
//   (hEB01/hY01-001_S.png, hBP09/hY01-015_SY.png, hBP06/hY01-010_SY.png)
//   that cannot be derived from the code, so they fall back to yuyu-tei.
// - Starter Yell set codes map dirs: hYS01-001_OC.png lives under hY01,
//   not hYS01.
// - One-off: hPR/hPR-002.png has no rarity suffix; tried for `P` cards
//   with an hPR code prefix (hPR-002 P has no standard `_P` file).
// - Reprints share the code across products (hBP02-011 U/S under hBP02
//   plus hEB01/..._U_02.png and hEB01/..._SR_02.png; hBP01-009_C under
//   both hBP01 and hSD08). The yuyu-tei release bucket names the product
//   being sold, so the release-derived dir is probed before the
//   code-derived dir so reprints resolve to their own product art.
// Missing files answer 403 with a tiny XML body, which the <img>
// cascade treats like any other error. The yuyu-tei full-size `front/`
// image is kept as a last resort before the placeholder; official art
// is always tried first. The backend stores only the yuyu-tei scan URL,
// so the official URL is reconstructed here; exposing it via the API
// would change the API contract and was deliberately not done.

import type { CardPrice } from './types';

export const PLACEHOLDER_IMAGE = 'https://placehold.co/300x420/313244/cdd6f4?text=No+Image';

const HOLOLIVE_CDLIST = 'https://hololive-official-cardgame.com/wp-content/images/cardlist';

function getHololiveRelease(release: string): string | null {
  if (!release) return null;
  const r = release.trim();
  if (!r) return null;
  if (r.toLowerCase() === 'hys01') return 'hY01';
  // Only yuyu-tei buckets that name a real official product dir are usable.
  // Buckets like promo-hbp10, promo-100, promo-hsd10, yell01, ohc01 have no
  // matching official dir (verified: promo P cards live under hPR, Yell C
  // under COMMON) and would only waste cascade requests, so they map to null.
  // Accepted: hBP01, hSD01, hEB01, hPR, COMMON … (case-insensitive).
  if (/^hpr$/i.test(r)) return 'hPR';
  if (/^common$/i.test(r)) return 'COMMON';
  const m = /^(h[A-Za-z]*)(\d+)$/.exec(r);
  if (!m) return null;
  return `${m[1][0].toLowerCase()}${m[1].slice(1).toUpperCase()}${m[2]}`;
}

function getYuyuTeiFrontUrl(card: CardPrice): string {
  return `https://card.yuyu-tei.jp/${card.tcg_slug}/front/${card.release_code}/${card.card_id}.jpg`;
}

function getHololiveImageUrls(card: CardPrice): string[] {
  const { code, rarity } = card;
  const urls: string[] = [];
  const push = (u: string) => {
    if (!urls.includes(u)) urls.push(u);
  };
  // Release bucket first so reprints resolve to their own product art
  // (heb01/hBP02-011_U_02.png over hBP02/hBP02-011_U.png); the release
  // mapper already returns null for non-product buckets (promo-*, yell01)
  // so no garbage dirs are probed.
  const fromRelease = getHololiveRelease(card.release_code);
  const fromCode = hololiveDirFromCode(code);
  if (fromRelease) {
    push(`${HOLOLIVE_CDLIST}/${fromRelease}/${code}_${rarity}.png`);
    push(`${HOLOLIVE_CDLIST}/${fromRelease}/${code}_${rarity}_02.png`);
  }
  if (fromCode && fromCode !== fromRelease) {
    push(`${HOLOLIVE_CDLIST}/${fromCode}/${code}_${rarity}.png`);
  }
  // Promo/parallel P prints live under hPR regardless of code prefix
  // (hPR/hBP08-008_P.png, hPR/hBD24-001_P.png); 382/438 hPR files.
  if (rarity === 'P') push(`${HOLOLIVE_CDLIST}/hPR/${code}_${rarity}.png`);
  // Yell C prints live under COMMON (COMMON/hY01-001_C.png). Yell codes
  // are hY<digit>-… (hY01-001); the starter set hYS01-… is excluded.
  if (/^hY\d/i.test((code ?? '').trim())) push(`${HOLOLIVE_CDLIST}/COMMON/${code}_${rarity}.png`);
  if (fromCode && fromCode !== fromRelease) {
    push(`${HOLOLIVE_CDLIST}/${fromCode}/${code}_${rarity}_02.png`);
  }
  // Second P artwork slot (27 hPR files, e.g. hPR/hBP02-011_P_02.png).
  // Numbered variants beyond this (_P_03 … _P_07, _P_1/_P_2) exist but the
  // same code+rarity maps to several artworks, so code+rarity cannot pick
  // the right one; those rows fall through to the per-card yuyu-tei scan.
  if (rarity === 'P') push(`${HOLOLIVE_CDLIST}/hPR/${code}_${rarity}_02.png`);
  // One-off: hPR/hPR-002.png carries no rarity suffix.
  if (rarity === 'P' && /^hPR-/i.test((code ?? '').trim())) {
    push(`${HOLOLIVE_CDLIST}/hPR/${code}.png`);
  }
  urls.push(getYuyuTeiFrontUrl(card));
  urls.push(PLACEHOLDER_IMAGE);
  return urls;
}

/** Image dir derived from the card number prefix: hBP01-001 -> hBP01,
 *  hPR-001 -> hPR. The starter Yell set is the one exception: hYS01-001
 *  lives under hY01 (verified: hY01/hYS01-001_OC.png). */
function hololiveDirFromCode(code: string): string | null {
  const m = /^([A-Za-z]+\d+)/.exec((code ?? '').trim());
  if (!m) return null;
  const p = m[1];
  if (/^hYS\d+$/i.test(p)) return 'hY01';
  return `${p[0].toLowerCase()}${p.slice(1).toUpperCase()}`;
}

/** Backend-driven image resolution for One Piece cards. The backend is
 *  authoritative for Bandai image resolution — the frontend never constructs
 *  Bandai URLs, probes variants, or duplicates backend logic. Cascades:
 *  image_url_canonical -> image_url_fallback -> legacy image_url -> placeholder.
 *  Empty/null backend fields are skipped, so unresolved cards (e.g.
 *  ST01-0060) never produce fake Bandai URLs. */
function getOnePieceImageUrls(card: CardPrice): string[] {
  const urls: string[] = [];
  const push = (u: string | null | undefined) => {
    if (u && u.trim()) urls.push(u);
  };
  push(card.image_url_canonical);
  push(card.image_url_fallback);
  push(card.image_url);
  urls.push(PLACEHOLDER_IMAGE);
  return urls;
}

function getDefaultImageUrls(card: CardPrice): string[] {
  const fromFields = getYuyuTeiFrontUrl(card);
  const urls: string[] = [fromFields];
  if (card.image_url && card.image_url.includes('card.yuyu-tei.jp')) {
    const upgraded = card.image_url.replace(/\/[^/]+\/(?=[^/]+\/[^/?#]+\.jpg)/i, '/front/');
    if (upgraded !== fromFields && !urls.includes(upgraded)) urls.push(upgraded);
    if (card.image_url !== fromFields && card.image_url !== upgraded && !urls.includes(card.image_url)) {
      urls.push(card.image_url);
    }
  } else if (card.image_url && !urls.includes(card.image_url)) {
    urls.push(card.image_url);
  }
  urls.push(PLACEHOLDER_IMAGE);
  return urls;
}

export function getCardImageUrls(card: CardPrice): string[] {
  if (card.tcg_slug === 'hocg') return getHololiveImageUrls(card);
  if (card.tcg_slug === 'opc') return getOnePieceImageUrls(card);
  return getDefaultImageUrls(card);
}

/** First URL in the cascade: the image the grid tile requests first.
/// The modal resolves to the same primary URL for the same card, so a
/// browser-cached tile makes the modal feel instant. */
export function getCardPrimaryUrl(card: CardPrice): string {
  return getCardImageUrls(card)[0];
}

const warmed = new Set<string>();

/** Session memory of artwork URLs that already failed to load (404,
 *  hotlink-blocked, CORB-blocked HTML error pages, …). Lets remounts and
 *  the grid->modal transition skip straight past known-bad cascade steps
 *  instead of re-requesting them. Never applied to the placeholder. */
const dead = new Set<string>();

export function isCardImageDead(url: string): boolean {
  return dead.has(url);
}

export function markCardImageDead(url: string): void {
  if (!url || url === PLACEHOLDER_IMAGE) return;
  dead.add(url);
}

/** Targeted preloading for hover/focus intent. Deduped per URL, safe to
 *  call repeatedly and safe under SSR (no-op without a DOM Image). Does
 *  not fetch blindly on page load; callers decide when intent is real. */
export function preloadCardImage(url: string): void {
  if (!url || warmed.has(url) || dead.has(url)) return;
  if (url === PLACEHOLDER_IMAGE) return;
  if (typeof Image === 'undefined') return;
  warmed.add(url);
  const img = new Image();
  // Async/decode hints are not applicable to `new Image()`; the point is
  // warming the HTTP cache so a later <img src> hits memory/disk cache.
  img.decoding = 'async';
  img.src = url;
}

export function preloadCard(card: CardPrice): void {
  try {
    preloadCardImage(getCardPrimaryUrl(card));
  } catch {
    // ignore
  }
}
