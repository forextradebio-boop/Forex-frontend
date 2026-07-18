import api from '../api/axios';

export const getPaymentSettings = async () => {
  const res = await api.get('/payment-settings');
  return res.data;
};

export const updatePaymentSettings = async (payload: any) => {
  const res = await api.patch('/payment-settings', payload);
  return res.data;
};
