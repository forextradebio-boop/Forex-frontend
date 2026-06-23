import api from '../api/axios';

export interface WalletData {
  _id: string;
  userId: string;
  balance: number;
  equity: number;
  margin: number;
  freeMargin: number;
  pnl: number;
}

export const getWallet = async (): Promise<WalletData> => {
  const res = await api.get('/wallet');
  return res.data;
};
