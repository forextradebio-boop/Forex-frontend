import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createWithdrawal } from '../services/withdrawService';
import { WithdrawRequest } from '../types';

export const useCreateWithdrawal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: WithdrawRequest) => createWithdrawal(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
};
