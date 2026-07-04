import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPaymentSettings, updatePaymentSettings } from '../services/paymentSettings';

export const usePaymentSettings = () => {
  return useQuery({
    queryKey: ['paymentSettings'],
    queryFn: getPaymentSettings,
    staleTime: 1000 * 60 * 5,
  });
};

export const useUpdatePaymentSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updatePaymentSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paymentSettings'] });
    },
  });
};
