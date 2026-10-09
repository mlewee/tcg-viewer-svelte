import { get } from './client';
import type { ScrapeStatusResponse } from '../types';

export const scrapeStatusApi = {
  get: () => get<ScrapeStatusResponse>('/api/scrape-status/')
};
