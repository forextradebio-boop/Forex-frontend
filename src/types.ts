/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum AssetCategory {
  FOREX = "FOREX",
  STOCKS = "STOCKS",
  CRYPTO = "CRYPTO",
  COMMODITIES = "COMMODITIES",
  INDICES = "INDICES"
}

export interface SymbolData {
  symbol: string;
  name: string;
  category: AssetCategory;
  price: number;
  openPrice: number;
  high: number;
  low: number;
  volume: number;
  bid: number;
  ask: number;
  leverageLimit: number;
  isActive: boolean;
  spread: number; // in pips/cents
  priceHistory: Candlestick[];
}

export interface Candlestick {
  time: string; // ISO string or short time string
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export enum TradeSide {
  BUY = "BUY",
  SELL = "SELL"
}

export enum OrderType {
  MARKET = "MARKET",
  LIMIT = "LIMIT"
}

export enum OrderStatus {
  PENDING = "PENDING",
  FILLED = "FILLED",
  CANCELLED = "CANCELLED"
}

export interface Order {
  id: string;
  userId: string;
  symbol: string;
  side: TradeSide;
  type: OrderType;
  limitPrice?: number;
  size: number; // lot size or token unit
  leverage: number;
  margin: number;
  slPrice?: number;
  tpPrice?: number;
  status: OrderStatus;
  timestamp: number;
}

export interface Position {
  id: string;
  userId: string;
  symbol: string;
  side: TradeSide;
  entryPrice: number;
  currentPrice: number;
  size: number;
  leverage: number;
  margin: number;
  slPrice?: number;
  tpPrice?: number;
  pnl: number;
  timestamp: number;
}

export enum KYCStatus {
  UNSUBMITTED = "UNSUBMITTED",
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED"
}

export interface KYCData {
  id: string;
  userId: string;
  documentType: "AADHAAR" | "PAN" | "PASSPORT";
  documentNumber: string;
  fullName: string;
  dob: string;
  frontImageBase64?: string;
  backImageBase64?: string;
  status: KYCStatus;
  submittedAt: number;
  verifiedAt?: number;
  adminNotes?: string;
}

export enum TransactionStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED"
}

export enum TransactionType {
  DEPOSIT = "DEPOSIT",
  WITHDRAWAL = "WITHDRAWAL"
}

export interface WalletTransaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  method: "UPI" | "BANK" | "CRYPTO";
  details: string; // UPI ID, bank account details, or crypto address
  status: TransactionStatus;
  timestamp: number;
  screenshotBase64?: string;
  utrNumber?: string;
  adminNotes?: string;
}

export interface UserWallet {
  balance: number;
  equity: number;
  margin: number;
  freeMargin: number;
  pnl: number;
}

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  is2FAEnabled: boolean;
  status: "ACTIVE" | "SUSPENDED" | "BANNED";
  kycStatus: KYCStatus;
  createdAt: number;
  role: "USER" | "ADMIN";
}

export interface PriceAlert {
  id: string;
  userId: string;
  symbol: string;
  targetPrice: number;
  isAbove: boolean; // true if alert triggers when price goes ABOVE, false for BELOW
  type: "PRICE" | "TRADE" | "NEWS";
  message: string;
  status: "ACTIVE" | "TRIGGERED";
  createdAt: number;
}

export interface MarketNews {
  id: string;
  title: string;
  summary: string;
  content: string;
  category: "crypto" | "forex" | "stocks" | "global";
  publishedAt: number;
  source: string;
}

export interface EconomicEvent {
  id: string;
  country: string;
  event: string;
  impact: "High" | "Medium" | "Low";
  date: string;
}

export type MarketCategory = 'FOREX' | 'CRYPTO' | 'STOCKS' | 'METALS';

export interface MarketTicker {
  symbol: string;
  bid: number;
  ask: number;
  spread: number;
  price: number;
  change: number;
  changePercent: number;
  category: MarketCategory;
}

export interface MarketQuote {
  price: number;
  high: number;
  low: number;
  open: number;
  volume: number;
}

export interface DashboardMetrics {
  totalUsers: number;
  onlineUsers: number;
  activeTraders: number;
  todayDeposits: number;
  todayWithdrawals: number;
  tradingVolume24h: number;
  revenueHistory: { date: string; revenue: number }[];
  tradingVolumeHistory: { date: string; volume: number }[];
}

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  publishedAt: string;
}

export interface UserProfile {
  _id: string;
  name: string;
  email: string;
  phone: string;
  country: string;
  avatar: string;
  createdAt: string;
}

export interface UpdateProfilePayload {
  name?: string;
  phone?: string;
  country?: string;
  avatar?: string;
}

export interface Transaction {
  id: string;
  type: 'DEPOSIT' | 'WITHDRAW' | 'TRADE';
  amount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  description: string;
  createdAt: string;
}

export interface DepositRequest {
  amount: number;
  utr: string;
  screenshot?: string;
}

export interface WithdrawRequest {
  amount: number;
}

export interface KycDocument {
  type: string;
  url: string;
}

export interface KycRecord {
  _id: string;
  userId: string;
  documentType: string;
  documentNumber: string;
  fullName: string;
  dob: string;
  documents: KycDocument[];
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'NOT_SUBMITTED';
  rejectionReason?: string;
  createdAt: string;
}

export interface KycSubmitPayload {
  documentType: string;
  documentNumber: string;
  fullName: string;
  dob: string;
  documents: KycDocument[];
}

export interface Order {
  _id: string;
  userId: string;
  symbol: string;
  type: 'BUY' | 'SELL' | 'LIMIT_BUY' | 'LIMIT_SELL' | 'STOP_BUY' | 'STOP_SELL';
  volume: number;
  price?: number;
  targetPrice: number;
  status: 'PENDING' | 'EXECUTED' | 'CANCELLED';
  createdAt: string;
}

export interface PriceAlert {
  _id: string;
  userId: string;
  symbol: string;
  condition: 'ABOVE' | 'BELOW';
  targetPrice: number;
  status: 'ACTIVE' | 'TRIGGERED' | 'DISABLED';
  createdAt: string;
}
