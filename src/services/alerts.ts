import api from '../api/axios';

export const getAlerts = async () => {
  const res = await api.get('/api/alerts');
  return res.data;
};

export const createAlert = async (payload: any) => {
  const res = await api.post('/api/alerts', payload);
  return res.data;
};
export const updateAlert = async (id: string, payload: any) => {
  const res = await api.patch(`/api/alerts/${id}`, payload);
  return res.data;
};

export const deleteAlert = async (id: string) => {
  const res = await api.delete(`/api/alerts/${id}`);
  return res.data;
};
