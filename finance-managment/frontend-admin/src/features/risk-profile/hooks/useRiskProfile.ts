import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { riskProfileApi } from '../api/risk-profile.api';

export function useQuestionnaire() {
  return useQuery({ queryKey: ['risk-questionnaire'], queryFn: riskProfileApi.getQuestionnaire });
}

export function useRiskProfile() {
  return useQuery({ queryKey: ['risk-profile'], queryFn: riskProfileApi.getProfile });
}

export function useAssessRisk() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: riskProfileApi.assess,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['risk-profile'] }),
  });
}

export function useApplyToPortfolio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ walletId, portfolioId, allocations, tolerance }: {
      walletId: string; portfolioId: string;
      allocations: Record<string, number>; tolerance?: number;
    }) => riskProfileApi.applyToPortfolio(walletId, portfolioId, allocations, tolerance),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['wallets', vars.walletId] });
      qc.invalidateQueries({ queryKey: ['rebalancing', vars.portfolioId] });
    },
  });
}

export function useRebalancing(walletId: string, portfolioId: string, enabled = true) {
  return useQuery({
    queryKey: ['rebalancing', portfolioId],
    queryFn: () => riskProfileApi.getRebalancing(walletId, portfolioId),
    enabled: enabled && !!walletId && !!portfolioId,
    retry: false,
  });
}
