import { useQuery } from '@tanstack/react-query';
import * as marketService from '../services/market';

const REFETCH_INTERVAL = false; // Disable aggressive polling to prevent API freeze

export const useTickers = () => {
  return useQuery({
    queryKey: ['market', 'tickers'],
    queryFn: marketService.getTickers,
  });
};

export const useTicker = (symbol: string) => {
  return useQuery({
    queryKey: ['market', 'ticker', symbol],
    queryFn: () => marketService.getTicker(symbol),
    enabled: !!symbol,
  });
};

export const useForex = () => {
  return useQuery({
    queryKey: ['market', 'forex'],
    queryFn: marketService.getForex,
  });
};

export const useCrypto = () => {
  return useQuery({
    queryKey: ['market', 'crypto'],
    queryFn: marketService.getCrypto,
  });
};

export const useMetals = () => {
  return useQuery({
    queryKey: ['market', 'metals'],
    queryFn: marketService.getMetals,
  });
};

export const useTopGainers = () => {
  return useQuery({
    queryKey: ['market', 'top-gainers'],
    queryFn: marketService.getTopGainers,
  });
};

export const useTopLosers = () => {
  return useQuery({
    queryKey: ['market', 'top-losers'],
    queryFn: marketService.getTopLosers,
  });
};

export const useQuotes = (symbol: string) => {
  return useQuery({
    queryKey: ['market', 'quotes', symbol],
    queryFn: () => marketService.getQuote(symbol),
    enabled: !!symbol,
  });
};
