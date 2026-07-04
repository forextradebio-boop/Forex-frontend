import api from '../api/axios';

export const getPositions = async () => {
  const res = await api.get('/api/trading/positions');
  return res.data;
};

export const getClosedPositions = async () => {
  const candidates = ['/api/trading/closed-positions', '/api/trading/positions/closed'];
  for (const url of candidates) {
    try {
      const res = await api.get(url);
      console.debug('[trading] closed positions url', url, 'status', res.status);
      return res.data;
    } catch (err: any) {
      console.warn('[trading] closed positions failed', url, err?.response?.status);
      if (err?.response?.status === 404) continue;
      throw err;
    }
  }
  throw new Error('Closed positions endpoint not found');
};

export const getOrders = async () => {
  const res = await api.get('/api/trading/orders');
  return res.data;
};

export const createPosition = async (payload: any) => {
  const res = await api.post('/api/trading/positions', payload);
  return res.data;
};

export const createOrder = async (payload: any) => {
  const res = await api.post('/api/trading/orders', payload);
  return res.data;
};

export const closePosition = async (id: string) => {
  const res = await api.post(`/api/trading/positions/${id}/close`);
  return res.data;
};

export const cancelOrder = async (id: string) => {
  const res = await api.post(`/api/trading/orders/${id}/cancel`);
  return res.data;
};
