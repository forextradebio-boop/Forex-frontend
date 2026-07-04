import api from '../api/axios';
import { Transaction } from '../types';

export const getTransactions = async (): Promise<Transaction[]> => {
  const res = await api.get('/api/transactions');
  return res.data;
};
