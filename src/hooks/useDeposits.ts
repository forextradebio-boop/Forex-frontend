import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createDeposit } from '../services/deposit';
import { DepositRequest } from '../types';

export const useCreateDeposit = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: DepositRequest) => createDeposit(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
};
