import { useQuery } from '@tanstack/react-query';
import { getLatestNews, getForexNews, getSymbolNews, searchNews } from '../services/news';

export const useNews = () => {
  return useQuery({
    queryKey: ['news', 'latest'],
    queryFn: getLatestNews,
    refetchInterval: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
};

export const useForexNews = (enabled = true) => {
  return useQuery({
    queryKey: ['news', 'forex'],
    queryFn: getForexNews,
    enabled,
    refetchInterval: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
};

export const useSymbolNews = (symbol: string, enabled = true) => {
  return useQuery({
    queryKey: ['news', 'symbol', symbol],
    queryFn: () => getSymbolNews(symbol),
    enabled: !!symbol && enabled,
    refetchInterval: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
};

export const useSearchNews = (query: string) => {
  return useQuery({
    queryKey: ['news', 'search', query],
    queryFn: () => searchNews(query),
    enabled: query.trim().length > 2,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 1,
  });
};
