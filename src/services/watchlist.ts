import api from '../api/axios';

export const getWatchlist = async () => {
  const res = await api.get('/watchlist');
  return res.data;
};

export const updateWatchlist = async (symbols: string[]) => {
  const res = await api.put('/watchlist', { symbols });
  return res.data;
};
