import client from '../../../shared/api/client';
import type { FusedSignal } from '../../../shared/api/types';

export const fusionApi = {
  getPortfolioFusion: (portfolioId: string) =>
    client.get<{ signals: FusedSignal[]; summary: any }>(`/fusion/portfolio/${portfolioId}`).then(r => r.data),

  getAssetFusion: (symbol: string, portfolioId?: string) =>
    client.get<FusedSignal>(`/fusion/asset/${symbol}`, { params: { portfolioId } }).then(r => r.data),

  getProfiles: () =>
    client.get<{ profiles: Array<{ id: string; name: string; weights: Record<string, number> }> }>('/fusion/profiles').then(r => r.data),

  updateWeights: (weights: Record<string, number>) =>
    client.patch('/fusion/weights', weights),
};
