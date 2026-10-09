import { get } from './client';
import type { CardPrice, PaginatedResponse, PriceHistoryResponse } from '../types';

export const cardPricesApi = {
  list: (
    params: {
      tcg?: string;
      release_code?: string;
      rarity?: string;
      ordering?: string;
      search?: string;
      page?: number;
      latest?: boolean;
    } = {}
  ) => get<PaginatedResponse<CardPrice>>('/api/card-prices/', params),

  history: (params: {
    tcg: string;
    card_code: string;
    card_id?: string;
    release_code?: string;
    rarity?: string;
  }) => get<PriceHistoryResponse>('/api/card-prices/history/', params),

  releaseCodes: (tcg: string) =>
    get<string[]>('/api/card-prices/release-codes/', { tcg })
};
