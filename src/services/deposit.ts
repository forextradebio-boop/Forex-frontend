import api from '../api/axios';

export const getDeposits = async () => {
  const res = await api.get('/api/deposits');
  return res.data;
};

export const createDeposit = async (payload: any) => {
  const res = await api.post('/api/deposits', payload);
  return res.data;
};
