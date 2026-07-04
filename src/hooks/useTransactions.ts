import { useQuery } from '@tanstack/react-query';
import { getTransactions } from '../services/transaction';

export const useTransactions = () => {
  return useQuery({
    queryKey: ['transactions'],
    queryFn: getTransactions,
    refetchInterval: 5000,
  });
};
