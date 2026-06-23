import api from '../api/axios';
import { KycRecord, KycSubmitPayload } from '../types';

export const getKyc = async (): Promise<KycRecord | null> => {
  const res = await api.get('/kyc');
  return res.data;
};

export const submitKyc = async (data: KycSubmitPayload): Promise<KycRecord> => {
  const res = await api.post('/kyc', data);
  return res.data;
};
