import api from '../api/axios';

export interface PendingOrder {
  _id?: string;
  id?: string;
  userId?: string;
  symbol: string;
  type: 'BUY_LIMIT' | 'SELL_LIMIT' | 'BUY_STOP' | 'SELL_STOP';
  volume: number;
  price: number;
  targetPrice?: number;
  sl?: number;
  tp?: number;
  status?: 'PENDING' | 'FILLED' | 'CANCELLED';
  createdAt?: string;
  updatedAt?: string;
}

export const getOrders = async () => {
  const res = await api.get('/orders');
  return res.data;
};

export const getOrderById = async (id: string) => {
  const res = await api.get(`/orders/${id}`);
  return res.data;
};

export const createOrder = async (order: Partial<PendingOrder>) => {
  const res = await api.post('/orders', order);
  return res.data;
};

export const updateOrder = async (id: string, updates: Partial<PendingOrder>) => {
  const res = await api.patch(`/orders/${id}`, updates);
  return res.data;
};

export const deleteOrder = async (id: string) => {
  const res = await api.delete(`/orders/${id}`);
  return res.data;
};
