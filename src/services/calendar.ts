import api from '../api/axios';
import { EconomicEvent } from '../types';

export const getEconomicCalendar = async (): Promise<{ calendar: EconomicEvent[] }> => {
  const res = await api.get('/api/economic-calendar');
  return res.data;
};
