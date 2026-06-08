import client from '../../../shared/api/client';
import type { Question, RiskProfileResult, UserRiskProfile, RebalancingAnalysis } from '../../../shared/api/types';

export const riskProfileApi = {
  getQuestionnaire: () =>
    client.get<Question[]>('/risk-profile/questionnaire').then(r => r.data),

  getModelPortfolios: () =>
    client.get<Record<string, Record<string, number>>>('/risk-profile/model-portfolios').then(r => r.data),

  assess: (answers: Record<string, string>) =>
    client.post<RiskProfileResult>('/risk-profile/assess', { answers }).then(r => r.data),

  getProfile: () =>
    client.get<UserRiskProfile | null>('/risk-profile').then(r => r.data),

  applyToPortfolio: (walletId: string, portfolioId: string, allocations: Record<string, number>, tolerance?: number) =>
    client.post(`/wallets/${walletId}/portfolios/${portfolioId}/rebalancing/target`, { allocations, tolerance }).then(r => r.data),

  getRebalancing: (walletId: string, portfolioId: string) =>
    client.get<RebalancingAnalysis>(`/wallets/${walletId}/portfolios/${portfolioId}/rebalancing`).then(r => r.data),
};
