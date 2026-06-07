import { useQuery, useMutation } from '@tanstack/react-query';
import { fusionApi } from '../api/fusion.api';

export function usePortfolioFusion(portfolioId: string) {
  return useQuery({
    queryKey: ['fusion', portfolioId],
    queryFn: () => fusionApi.getPortfolioFusion(portfolioId),
    enabled: !!portfolioId,
    refetchInterval: 60_000, // Refresh every minute
  });
}

export function useAssetFusion(symbol: string, portfolioId?: string) {
  return useQuery({
    queryKey: ['fusion', 'asset', symbol],
    queryFn: () => fusionApi.getAssetFusion(symbol, portfolioId),
    enabled: !!symbol,
  });
}

export function useFusionProfiles() {
  return useQuery({
    queryKey: ['fusion', 'profiles'],
    queryFn: fusionApi.getProfiles,
  });
}

export function useUpdateWeights() {
  return useMutation({
    mutationFn: fusionApi.updateWeights,
  });
}
