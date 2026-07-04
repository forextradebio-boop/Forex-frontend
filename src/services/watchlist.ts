import api from '../api/axios';

export const getWatchlist = async () => {
  const res = await api.get('/api/watchlist');
  return res.data;
};

export const updateWatchlist = async (symbols: string[]) => {
  const res = await api.put('/api/watchlist', { symbols });
  return res.data;
};
