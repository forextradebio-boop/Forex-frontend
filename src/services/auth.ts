import api from '../api/axios';

export interface RegisterPayload {
  username: string;
  password: string;
  confirmPassword: string;
}

export interface LoginPayload {
  username: string;
  password: string;
}

export const register = async (payload: RegisterPayload) => {
  // Backend only needs username and password (confirmPassword is for frontend validation)
  const res = await api.post('/api/auth/register', {
    username: payload.username,
    password: payload.password
  });
  return res.data;
};

export const login = async (payload: LoginPayload) => {
  const res = await api.post('/api/auth/login', payload);
  return res.data;
};

export const forgotPasswordStart = async (username: string) => {
  const res = await api.post('/api/auth/forgot/start', { username });
  return res.data;
};

export const forgotPasswordGenerateOTP = async (username: string) => {
  const res = await api.post('/api/auth/forgot/generate-otp', { username });
  return res.data;
};

export const forgotPasswordReset = async (username: string, otp: string, newPassword: string) => {
  const res = await api.post('/api/auth/forgot/reset', { username, otp, newPassword });
  return res.data;
};
