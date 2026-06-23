import api from '../api/axios';
import { MarketTicker, MarketQuote } from '../types';

export const getTickers = async (): Promise<MarketTicker[]> => {
  const res = await api.get('/market/tickers');
  return res.data;
};

export const getTicker = async (symbol: string): Promise<MarketTicker> => {
  const res = await api.get(`/market/tickers/${symbol}`);
  return res.data;
};

export const getQuote = async (symbol: string): Promise<Record<string, MarketQuote>> => {
  const res = await api.get(`/market/quotes/${symbol}`);
  return res.data;
};

// Legacy support
export const getQuotes = async (symbols: string[]) => {
  const symStr = symbols.join(',');
  const res = await api.get(`/market/quotes?symbols=${symStr}`);
  return res.data;
};

export const getForex = async (): Promise<MarketTicker[]> => {
  const res = await api.get('/market/forex');
  return res.data;
};

export const getCrypto = async (): Promise<MarketTicker[]> => {
  const res = await api.get('/market/crypto');
  return res.data;
};

export const getMetals = async (): Promise<MarketTicker[]> => {
  const res = await api.get('/market/metals');
  return res.data;
};

export const getTopGainers = async (): Promise<MarketTicker[]> => {
  const res = await api.get('/market/top-gainers');
  return res.data;
};

export const getTopLosers = async (): Promise<MarketTicker[]> => {
  const res = await api.get('/market/top-losers');
  return res.data;
};

export const getSymbols = async () => {
  const res = await api.get('/market/symbols');
  return res.data;
};

export const getChart = async (symbol: string) => {
  const res = await api.get(`/market/chart/${symbol}`);
  return res.data;
};
