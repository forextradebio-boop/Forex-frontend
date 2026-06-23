import { useQuery } from '@tanstack/react-query';
import { getWallet } from '../services/walletService';

export const useWallet = () => {
  return useQuery({
    queryKey: ['wallet'],
    queryFn: getWallet,
    refetchInterval: 1000, // Live poll every 1 second
  });
};
