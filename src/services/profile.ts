import api from '../api/axios';
import { UserProfile, UpdateProfilePayload } from '../types';

export const getProfile = async (): Promise<UserProfile> => {
  const res = await api.get('/api/profile');
  return res.data;
};

export const updateProfile = async (data: UpdateProfilePayload): Promise<UserProfile> => {
  const res = await api.put('/api/profile', data);
  return res.data;
};
