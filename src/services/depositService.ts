import api from '../api/axios';
import { DepositRequest } from '../types';

export const createDeposit = async (data: DepositRequest) => {
  const res = await api.post('/deposits', data);
  return res.data;
};
