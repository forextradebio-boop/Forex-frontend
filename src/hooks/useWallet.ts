import { useQuery } from '@tanstack/react-query';
import { getWallet } from '../services/wallet';

export const useWallet = () => {
  return useQuery({
    queryKey: ['wallet'],
    queryFn: getWallet,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    staleTime: 1000 * 60, // keep wallet fresh for one minute unless manually refetched
  });
};
