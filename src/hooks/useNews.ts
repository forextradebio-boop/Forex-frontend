import { useQuery } from '@tanstack/react-query';
import { getNews } from '../services/newsService';

export const useNews = () => {
  return useQuery({
    queryKey: ['news'],
    queryFn: getNews,
    refetchInterval: 60000, // refresh every minute
  });
};
