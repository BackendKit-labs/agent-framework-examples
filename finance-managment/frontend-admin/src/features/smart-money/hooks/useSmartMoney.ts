import { useQuery } from '@tanstack/react-query';
import { smartMoneyApi } from '../api/smart-money.api';

export function useSmartMoneySignals(symbol?: string) {
  return useQuery({
    queryKey: ['smart-money', 'signals', symbol || 'all'],
    queryFn: () => smartMoneyApi.getSignals({ symbol: symbol || undefined }),
    refetchInterval: 300_000,
    enabled: true,
  });
}

export function useTrackedInvestors() {
  return useQuery({
    queryKey: ['smart-money', 'investors'],
    queryFn: smartMoneyApi.getInvestors,
    staleTime: 600_000, // 10 minutes
  });
}

export function useCoInvestments() {
  return useQuery({
    queryKey: ['smart-money', 'co-investments'],
    queryFn: () => smartMoneyApi.getCoInvestments({ minInvestors: 3 }),
    refetchInterval: 300_000,
  });
}
