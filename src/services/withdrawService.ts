import api from '../api/axios';
import { WithdrawRequest } from '../types';

export const createWithdrawal = async (data: WithdrawRequest) => {
  const res = await api.post('/withdrawals', data);
  return res.data;
};
