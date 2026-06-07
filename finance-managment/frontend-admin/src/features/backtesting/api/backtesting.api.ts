import client from '../../../shared/api/client';
import type { BacktestResult } from '../../../shared/api/types';

export const backtestingApi = {
  runBacktest: (params: {
    strategy: string;
    symbol: string;
    initialCapital: number;
    from?: string;
    to?: string;
  }) => client.post<BacktestResult>('/backtesting/run', params).then(r => r.data),

  getStrategies: () =>
    client.get<{ strategies: Array<{ id: string; name: string; description: string }> }>('/backtesting/strategies').then(r => r.data),
};
