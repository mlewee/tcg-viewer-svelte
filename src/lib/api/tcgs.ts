import { get } from './client';
import type { TradingCardGame } from '../types';

export const tcgsApi = {
  list: () => get<TradingCardGame[]>('/api/tcgs/')
};
