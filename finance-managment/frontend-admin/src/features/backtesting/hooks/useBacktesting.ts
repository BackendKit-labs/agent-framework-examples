import { useMutation, useQuery } from '@tanstack/react-query';
import { backtestingApi } from '../api/backtesting.api';

export function useRunBacktest() {
  return useMutation({
    mutationFn: backtestingApi.runBacktest,
  });
}

export function useStrategies() {
  return useQuery({
    queryKey: ['backtesting', 'strategies'],
    queryFn: backtestingApi.getStrategies,
  });
}
