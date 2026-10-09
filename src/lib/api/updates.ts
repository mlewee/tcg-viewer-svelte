import { get } from './client';
import type { NewPriceUpdate } from '../types';

export const updatesApi = {
  // limit is forwarded as ?limit= so the user can fetch more than
  // the default 50 rows (capped at 500 by the backend).
  list: (slug: string, limit = 50) =>
    get<NewPriceUpdate[]>(`/api/updates/${encodeURIComponent(slug)}/`, { limit })
};
