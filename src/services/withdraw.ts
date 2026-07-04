import api from '../api/axios';
import { WithdrawRequest } from '../types';

export const createWithdrawal = async (payload: WithdrawRequest) => {
  const res = await api.post('/api/withdrawals', payload);
  return res.data;
};

export const getWithdrawals = async () => {
  const res = await api.get('/api/withdrawals');
  return res.data;
};
