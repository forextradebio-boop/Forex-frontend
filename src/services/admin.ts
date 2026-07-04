import api from '../api/axios';

export const getDashboardMetrics = async () => {
  const res = await api.get('/api/admin/dashboard');
  return res.data;
};

export const approveDeposit = async (id: string) => {
  const res = await api.patch(`/api/admin/deposits/${id}/approve`);
  return res.data;
};

export const approveKyc = async (id: string) => {
  const res = await api.post(`/api/admin/kyc/${id}/approve`);
  return res.data;
};

export const adjustUserBalance = async (userId: string, payload: any, config?: any) => {
  // Backend exposes a generic wallet control endpoint: POST /admin/wallet
  const body = { userId, action: payload.action === 'ADD' ? 'CREDIT' : 'DEBIT', amount: Number(payload.amount) };
  const res = await api.post(`/api/admin/wallet`, body, config);
  return res.data;
};

export const setUserStatus = async (userId: string, payload: any, config?: any) => {
  // Backend exposes a generic user control endpoint: POST /admin/user
  const body = { userId, action: payload.status === 'ACTIVE' ? 'ENABLE' : 'DISABLE' };
  const res = await api.post(`/api/admin/user`, body, config);
  return res.data;
};

export const forceCloseTrade = async (posId: string, config?: any) => {
  const res = await api.post(`/api/admin/trades/force-close/${posId}`, null, config);
  return res.data;
};

export const addSymbol = async (payload: any, config?: any) => {
  const res = await api.post('/api/admin/symbols', payload, config);
  return res.data;
};

export const toggleSymbol = async (code: string, config?: any) => {
  const res = await api.post(`/api/admin/symbols/${code}/toggle`, null, config);
  return res.data;
};

export const createNews = async (payload: any, config?: any) => {
  const res = await api.post('/api/admin/news', payload, config);
  return res.data;
};

export const dispatchNotification = async (payload: any, config?: any) => {
  const res = await api.post('/api/admin/notifications', payload, config);
  return res.data;
};

export const getPaymentSettings = async () => {
  const res = await api.get('/api/payment-settings');
  return res.data;
};

export const updatePaymentSettings = async (payload: any, config?: any) => {
  const res = await api.patch('/api/payment-settings', payload, config);
  return res.data;
};
