import api from '../api/axios';
import { Order } from '../types';

export const getOrders = async (): Promise<Order[]> => {
  const res = await api.get('/orders');
  return res.data;
};
