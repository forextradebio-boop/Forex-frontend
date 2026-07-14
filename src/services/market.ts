import api from '../api/axios';
import { MarketTicker, MarketQuote } from '../types';

export const getTickers = async (): Promise<MarketTicker[]> => {
  const res = await api.get('/api/market/tickers');
  return res.data;
};

export const getTicker = async (symbol: string): Promise<MarketTicker> => {
  const res = await api.get(`/api/market/tickers/${symbol}`);
  return res.data;
};

export const getQuote = async (symbol: string): Promise<Record<string, MarketQuote>> => {
  const res = await api.get(`/api/market/quotes/${symbol}`);
  return res.data;
};

export const getWatch = async (): Promise<MarketTicker[]> => {
  const res = await api.get('/api/market/watch');
  return res.data;
};

export const getSymbolDetail = async (symbol: string): Promise<MarketTicker> => {
  const res = await api.get(`/api/market/symbol/${symbol}`);
  return res.data;
};

// Legacy support
export const getQuotes = async (symbols: string[]) => {
  const symStr = symbols.join(',');
  const res = await api.get(`/api/market/quotes?symbols=${symStr}`);
  return res.data;
};

export const getForex = async (): Promise<MarketTicker[]> => {
  const res = await api.get('/api/market/forex');
  return res.data;
};

export const getCrypto = async (): Promise<MarketTicker[]> => {
  const res = await api.get('/api/market/crypto');
  return res.data;
};

export const getMetals = async (): Promise<MarketTicker[]> => {
  const res = await api.get('/api/market/metals');
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

export const getCrudeOil = async () => {
  try {
    const res = await api.get('/api/market/crude-oil');
    return res.data;
  } catch (error) {
    console.error('Error fetching crude oil data:', error);
    throw error;
  }
};

export const getCrudeOilChart = async (symbol: string = 'CL=F', interval: string = '1d', range: string = 'ytd') => {
  try {
    const res = await api.get(`/api/market/crude-oil-chart`, {
      params: { symbol, interval, range }
    });
    return res.data;
  } catch (error) {
    console.error('Error fetching crude oil chart:', error);
    throw error;
  }
};

export const placeOrder = async (orderData: {
  symbol: string;
  type: 'BUY' | 'SELL';
  volume: number;
  openPrice?: number;
  sl?: number;
  tp?: number;
}) => {
  try {
    const res = await api.post('/api/trading/positions', {
      symbol: orderData.symbol,
      type: orderData.type,
      volume: orderData.volume,
      openPrice: orderData.openPrice,
      sl: orderData.sl,
      tp: orderData.tp
    });
    return res.data;
  } catch (error) {
    console.error('Error placing order:', error);
    throw error;
  }
};
