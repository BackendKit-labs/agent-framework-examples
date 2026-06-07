import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { walletApi } from '../api/wallet.api';

export function useWallets() {
  return useQuery({
    queryKey: ['wallets'],
    queryFn: walletApi.findAll,
  });
}

export function useWallet(id: string) {
  return useQuery({
    queryKey: ['wallets', id],
    queryFn: () => walletApi.findOne(id),
    enabled: !!id,
  });
}

export function useCreateWallet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: walletApi.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['wallets'] }),
  });
}

export function useDeleteWallet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => walletApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['wallets'] }),
  });
}
