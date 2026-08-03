import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPaymentSettings, updatePaymentSettings } from '../services/paymentSettings';

export const usePaymentSettings = () => {
  return useQuery({
    queryKey: ['paymentSettings'],
    queryFn: getPaymentSettings,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false,
    refetchIntervalInBackground: false,
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
