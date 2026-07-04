import { useQuery } from '@tanstack/react-query';
import * as marketService from '../services/market';

const REFETCH_INTERVAL = 3000; // 3 seconds

export const useTickers = () => {
  return useQuery({
    queryKey: ['market', 'tickers'],
    queryFn: marketService.getTickers,
    refetchInterval: REFETCH_INTERVAL,
  });
};

export const useTicker = (symbol: string) => {
  return useQuery({
    queryKey: ['market', 'ticker', symbol],
    queryFn: () => marketService.getTicker(symbol),
    refetchInterval: REFETCH_INTERVAL,
    enabled: !!symbol,
  });
};

export const useForex = () => {
  return useQuery({
    queryKey: ['market', 'forex'],
    queryFn: marketService.getForex,
    refetchInterval: REFETCH_INTERVAL,
  });
};

export const useCrypto = () => {
  return useQuery({
    queryKey: ['market', 'crypto'],
    queryFn: marketService.getCrypto,
    refetchInterval: REFETCH_INTERVAL,
  });
};

export const useMetals = () => {
  return useQuery({
    queryKey: ['market', 'metals'],
    queryFn: marketService.getMetals,
    refetchInterval: REFETCH_INTERVAL,
  });
};

export const useTopGainers = () => {
  return useQuery({
    queryKey: ['market', 'top-gainers'],
    queryFn: marketService.getTopGainers,
    refetchInterval: REFETCH_INTERVAL,
  });
};

export const useTopLosers = () => {
  return useQuery({
    queryKey: ['market', 'top-losers'],
    queryFn: marketService.getTopLosers,
    refetchInterval: REFETCH_INTERVAL,
  });
};

export const useQuotes = (symbol: string) => {
  return useQuery({
    queryKey: ['market', 'quotes', symbol],
    queryFn: () => marketService.getQuote(symbol),
    refetchInterval: REFETCH_INTERVAL,
    enabled: !!symbol,
  });
};
