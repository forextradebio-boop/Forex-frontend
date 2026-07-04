import api from '../api/axios';
import { NewsItem } from '../types';

export const getLatestNews = async (): Promise<{ news: NewsItem[] }> => {
  const res = await api.get('/api/news');
  return res.data;
};

export const getForexNews = async (): Promise<{ news: NewsItem[] }> => {
  const res = await api.get('/api/news/forex');
  return res.data;
};

export const getSymbolNews = async (symbol: string): Promise<{ news: NewsItem[] }> => {
  const res = await api.get(`/api/news/${encodeURIComponent(symbol)}`);
  return res.data;
};

export const searchNews = async (q: string): Promise<{ news: NewsItem[] }> => {
  const res = await api.get('/api/news/search', { params: { q } });
  return res.data;
};

export const getArticle = async (uuid: string): Promise<{ article: NewsItem | null }> => {
  const res = await api.get(`/api/news/article/${encodeURIComponent(uuid)}`);
  return res.data;
};

export const getSimilarNews = async (uuid: string): Promise<{ news: NewsItem[] }> => {
  const res = await api.get(`/api/news/article/${encodeURIComponent(uuid)}/similar`);
  return res.data;
};

export const getNewsSources = async (): Promise<{ sources: any[] }> => {
  const res = await api.get('/api/news/sources');
  return res.data;
};
