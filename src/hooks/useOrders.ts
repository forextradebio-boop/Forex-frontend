import { useQuery } from '@tanstack/react-query';
import { getOrders } from '../services/orderService';

export const useOrders = () => {
  return useQuery({
    queryKey: ['orders'],
    queryFn: getOrders,
    refetchInterval: 5000, // Poll every 5s for executed orders
  });
};
