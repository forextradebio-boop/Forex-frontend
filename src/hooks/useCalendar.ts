import { useQuery } from '@tanstack/react-query';
import { getEconomicCalendar } from '../services/calendar';

export const useEconomicCalendar = () => {
  return useQuery({
    queryKey: ['economic-calendar'],
    queryFn: getEconomicCalendar,
    refetchInterval: 60000, // Refresh every 1 minute
  });
};
