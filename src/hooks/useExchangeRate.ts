import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';

export function useExchangeRate() {
  return useQuery({
    queryKey: ['exchangeRate'],
    queryFn: async () => {
      const response = await api.get('/api/exchange-rates/current');
      if (response.data && response.data.rate) {
        return response.data.rate;
      }
      return { currentRate: response.data.currentRate || 85 };
    }
  });
}
