// Type definitions for the TCG API. Mirror the DRF serializers
// (and the Go backend's api-contract.md). Keep in sync when the
// API changes.

export interface TradingCardGame {
  id: number;
  name: string;
  slug: string;
  is_active: boolean;
}

export interface Release {
  id: number;
  tcg: string | number;
  tcg_slug?: string;
  tcg_name?: string;
  code: string;
  name: string;
  order: string;
  enabled: boolean;
}

export interface CardPrice {
  id: number;
  tcg_slug: string;
  tcg_name: string;
  release_code: string;
  release_name?: string;
  name: string;
  code: string;
  card_id: string;
  rarity: string;
  price: string;
  image_url: string;
  // Backend-resolved One Piece artwork (additive; empty when unresolved).
  image_url_canonical?: string;
  image_url_canonical_ja?: string;
  image_url_fallback?: string;
  image_source?: string;
  image_variant?: string;
  scraped_at: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface PriceHistoryPoint {
  id: number;
  price: string;
  scraped_at: string;
}

export interface PriceHistoryResponse {
  tcg: string;
  card_code: string;
  card_id?: string | null;
  card_name?: string | null;
  rarity?: string | null;
  release_code?: string | null;
  image_url?: string | null;
  image_url_canonical?: string | null;
  image_url_canonical_ja?: string | null;
  image_url_fallback?: string | null;
  image_source?: string | null;
  image_variant?: string | null;
  history: PriceHistoryPoint[];
}

export interface NewPriceUpdate {
  card_id: string;
  name: string;
  release: string;
  rarity: string;
  code: string;
  new_price: string;
  old_price: string;
  new_schedule: string;
  old_schedule: string;
}

export interface TcgScrapeStatus {
  slug: string;
  name: string;
  is_active: boolean;
  latest_scraped_at: string | null;
  card_count: number;
  snapshots_today: number;
  snapshots_last_hour: number;
}

export interface PeriodicTaskStatus {
  name: string;
  enabled: boolean;
  last_run_at: string | null;
  total_run_count: number;
  schedule: string;
  timezone: string;
}

export interface ScrapeStatusResponse {
  tcgs: TcgScrapeStatus[];
  periodic_task: PeriodicTaskStatus | null;
  server_time: string;
}

export interface OpenCard {
  tcg: string;
  code: string;
  card_id?: string;
  rarity?: string;
  release_code?: string;
  // Full snapshot from the catalog tile that opened the modal, so
  // image / name / price render instantly without waiting for the
  // history fetch. Omitted when opened from the updates feed.
  snapshot?: CardPrice;
}
