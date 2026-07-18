import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPaymentSettings, updatePaymentSettings } from '../services/paymentSettings';

export const usePaymentSettings = () => {
  return useQuery({
    queryKey: ['paymentSettings'],
    queryFn: getPaymentSettings,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
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
