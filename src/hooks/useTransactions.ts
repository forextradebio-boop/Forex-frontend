import { useQuery } from '@tanstack/react-query';
import { getTransactions } from '../services/transactionService';

export const useTransactions = () => {
  return useQuery({
    queryKey: ['transactions'],
    queryFn: getTransactions,
    refetchInterval: 5000,
  });
};
