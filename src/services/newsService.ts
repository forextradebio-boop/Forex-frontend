import api from '../api/axios';
import { NewsItem } from '../types';

export const getNews = async (): Promise<{ news: NewsItem[] }> => {
  const res = await api.get('/news');
  return res.data;
};
