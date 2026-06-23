import api from '../api/axios';

export const getDashboardMetrics = async () => {
  const res = await api.get('/admin/dashboard');
  return res.data;
};

export const approveDeposit = async (id: string) => {
  const res = await api.post(`/admin/deposits/${id}/approve`);
  return res.data;
};

export const approveKyc = async (id: string) => {
  const res = await api.post(`/admin/kyc/${id}/approve`);
  return res.data;
};
