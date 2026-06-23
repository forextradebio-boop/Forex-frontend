import api from '../api/axios';

export const createWithdrawal = async (payload: { amount: number }) => {
  const res = await api.post('/withdrawals', payload);
  return res.data;
};

export const getWithdrawals = async () => {
  const res = await api.get('/withdrawals');
  return res.data;
};
