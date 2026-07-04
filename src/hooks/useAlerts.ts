import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAlerts, createAlert, deleteAlert } from '../services/alerts';
import { PriceAlert } from '../types';

export const useAlerts = () => {
  return useQuery<PriceAlert[]>({
    queryKey: ['alerts'],
    queryFn: getAlerts,
    refetchInterval: 5000,
  });
};

export const useCreateAlert = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createAlert,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });
};

export const useDeleteAlert = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteAlert,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });
};
