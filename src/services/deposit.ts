import api from '../api/axios';

export const getDeposits = async () => {
  const res = await api.get('/deposits');
  return res.data;
};

export const createDeposit = async (payload: any) => {
  const res = await api.post('/deposits', payload);
  return res.data;
};
