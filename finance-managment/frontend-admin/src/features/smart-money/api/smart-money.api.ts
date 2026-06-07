import client from '../../../shared/api/client';
import type { SmartMoneySignal, TrackedInvestor } from '../../../shared/api/types';

export const smartMoneyApi = {
  getSignals: (params?: { symbol?: string; type?: string; minConviction?: number }) =>
    client.get<{ signals: SmartMoneySignal[]; total: number }>('/smart-money/signals', { params }).then(r => r.data),

  getInvestors: () =>
    client.get<TrackedInvestor[]>('/smart-money/investors').then(r => r.data),

  getInvestor: (name: string) =>
    client.get<TrackedInvestor>(`/smart-money/investors/${encodeURIComponent(name)}`).then(r => r.data),

  getCoInvestments: (params?: { minInvestors?: number; minCapital?: number; direction?: string }) =>
    client.get('/smart-money/co-investments', { params }).then(r => r.data),

  getPortfolioImpact: (portfolioId: string) =>
    client.get(`/smart-money/portfolio-impact/${portfolioId}`).then(r => r.data),
};
