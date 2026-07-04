import api from '../api/axios';

export const getWallet = async () => {
  const res = await api.get('/api/wallet');
  console.log("Wallet API Response", res.data);
  return res.data;
};
