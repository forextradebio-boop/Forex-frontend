import api from '../api/axios';

export const getKyc = async () => {
  const res = await api.get('/kyc');
  return res.data;
};

export const submitKyc = async (payload: any) => {
  const res = await api.post('/kyc', payload);
  return res.data;
};
