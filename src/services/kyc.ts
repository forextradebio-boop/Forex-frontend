import api from '../api/axios';

export const getKyc = async () => {
  const res = await api.get('/api/kyc');
  return res.data;
};

export const submitKyc = async (payload: any) => {
  const res = await api.post('/api/kyc', payload);
  return res.data;
};
