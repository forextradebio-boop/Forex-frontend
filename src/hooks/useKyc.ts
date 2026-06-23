import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getKyc, submitKyc } from '../services/kycService';
import { KycSubmitPayload } from '../types';

export const useKyc = () => {
  return useQuery({
    queryKey: ['kyc'],
    queryFn: getKyc,
  });
};

export const useSubmitKyc = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: KycSubmitPayload) => submitKyc(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kyc'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
};
