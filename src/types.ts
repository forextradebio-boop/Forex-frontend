// Lightweight permissive types to avoid strict TypeScript errors during rapid development.
// Replace these with precise interfaces as part of a later refactor.

export const AssetCategory = {
	FOREX: 'FOREX',
	STOCKS: 'STOCKS',
	CRYPTO: 'CRYPTO',
	COMMODITIES: 'COMMODITIES',
	INDICES: 'INDICES'
} as const;
export type AssetCategory = typeof AssetCategory[keyof typeof AssetCategory];
export type SymbolData = any;
export type Candlestick = any;
export const TradeSide = { BUY: 'BUY', SELL: 'SELL' } as const;
export type TradeSide = typeof TradeSide[keyof typeof TradeSide];
export const OrderType = { MARKET: 'MARKET', LIMIT: 'LIMIT' } as const;
export type OrderType = typeof OrderType[keyof typeof OrderType];
export type OrderStatus = any;
export type Order = any;
export type Position = any;
export const KYCStatus = { UNSUBMITTED: 'UNSUBMITTED', PENDING: 'PENDING', APPROVED: 'APPROVED', REJECTED: 'REJECTED' } as const;
export type KYCStatus = typeof KYCStatus[keyof typeof KYCStatus];
export type KYCData = any;
export const TransactionStatus = { PENDING: 'PENDING', APPROVED: 'APPROVED', REJECTED: 'REJECTED' } as const;
export type TransactionStatus = typeof TransactionStatus[keyof typeof TransactionStatus];
export const TransactionType = { DEPOSIT: 'DEPOSIT', WITHDRAWAL: 'WITHDRAWAL' } as const;
export type TransactionType = typeof TransactionType[keyof typeof TransactionType];
export type WalletTransaction = any;
export type UserWallet = any;
export type UserProfile = any;
export type PriceAlert = any;
export type MarketNews = any;
export type EconomicEvent = any;
export type MarketCategory = any;
export type MarketTicker = any;
export type MarketQuote = any;
export type DashboardMetrics = any;
export type NewsItem = any;
export type UpdateProfilePayload = any;
export type Transaction = any;
export type DepositRequest = any;
export type WithdrawRequest = any;
export type KycDocument = any;
export type KycRecord = any;
export type KycSubmitPayload = any;

