import { get } from './client';
import type { Release } from '../types';

export const releasesApi = {
  list: () => get<Release[]>('/api/releases/'),
  listByTcg: (slug: string) => get<Release[]>(`/api/releases/${encodeURIComponent(slug)}/`)
};
