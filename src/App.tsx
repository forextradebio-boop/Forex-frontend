import React, { useState, useEffect, Suspense, lazy } from "react";
import { useAuth } from "./contexts/AuthContext";
import { useSocket } from "./contexts/SocketContext";
import { useMarketStream } from "./hooks/useMarketStream";
import * as marketService from "./services/market";
import * as walletService from "./services/wallet";
import * as tradingService from "./services/trading";
import * as transactionService from "./services/transaction";
import { UserWallet, Position } from "./types";
import { useMarket } from "./contexts/MarketContext";

// Lazy load the massive dashboard to optimize initial bundle size
const ProTradingDashboard = lazy(() => import("./components/ProTradingDashboard"));

export default function App() {
  const { user: userProfile, loading: authLoading } = useAuth();
  const { socket } = useSocket();
  const { marketEnabled } = useMarket();

  // Live updates states
  const [walletMetrics, setWalletMetrics] = useState<UserWallet>({ balance: 0, equity: 0, margin: 0, freeMargin: 0, pnl: 0 });
  const [activePositions, setActivePositions] = useState<Position[]>([]);
  const [closedHistory, setClosedHistory] = useState<any[]>([]);

  // Listen for targeted wallet/pnl socket events
  useEffect(() => {
    if (!socket) return;

    const handlePnl = (positions: any[]) => {
      setActivePositions(prev => {
        if (prev.length > 0 && positions.length < prev.length) {
          // A position was closed, fetch history in the background
          setTimeout(fetchClientPortfolioStats, 500);
        }
        return positions.map((p: any) => ({
          id: p._id,
          symbol: p.symbol,
          side: p.type,
          size: p.volume,
          entryPrice: p.openPrice,
          currentPrice: p.currentPrice,
          pnl: p.pnl,
          slPrice: p.sl,
          tpPrice: p.tp,
          timestamp: p.createdAt
        }));
      });
    };

    const handleWallet = (wallet: any) => {
      setWalletMetrics(wallet);
    };

    const handleTransaction = () => {
      fetchClientPortfolioStats();
    };

    socket.on("pnl", handlePnl);
    socket.on("wallet", handleWallet);
    socket.on("transaction", handleTransaction);

    return () => {
      socket.off("pnl", handlePnl);
      socket.off("wallet", handleWallet);
      socket.off("transaction", handleTransaction);
    };
  }, [socket]);

  const fetchClientPortfolioStats = async () => {
    if (!userProfile) return;
    try {
      const [walletData, posData, closedPositions, transactions] = await Promise.all([
        walletService.getWallet(),
        tradingService.getPositions(),
        tradingService.getClosedPositions(),
        transactionService.getTransactions()
      ]);

      if (walletData) {
        setWalletMetrics(walletData);
      }

      if (posData) {
        setActivePositions(posData.map((p: any) => ({
          id: p._id,
          symbol: p.symbol,
          side: p.type,
          size: p.volume,
          entryPrice: p.openPrice,
          currentPrice: p.currentPrice,
          pnl: p.pnl,
          slPrice: p.sl,
          tpPrice: p.tp,
          timestamp: p.createdAt
        })));
      }

      const historyItems = [
        ...(closedPositions || []).map((item: any) => ({
          ...item,
          id: item.id || item._id || item._id?.toString(),
          entryDate: item.updatedAt || item.createdAt,
          timestamp: item.updatedAt || item.createdAt,
          historyType: 'trade',
        })),
        ...(transactions || []).map((tx: any) => ({
          ...tx,
          id: tx.id || tx._id || tx._id?.toString(),
          entryDate: tx.createdAt,
          timestamp: tx.createdAt,
          historyType: 'transaction',
        })),
      ].sort((a: any, b: any) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime());

      setClosedHistory(historyItems);
    } catch (err) {
      console.error("Error synchronizing client ledger portfolios.", err);
    }
  };

  useEffect(() => {
    fetchClientPortfolioStats();
  }, [userProfile]);

  // Handle Order entry placements
  const handlePlaceOrder = React.useCallback(async (orderPayload: any) => {
    if (!marketEnabled) {
      alert("Market is closed.");
      return;
    }
    try {
      if (orderPayload.type === 'MARKET') {
        const res = await tradingService.createPosition({
          symbol: orderPayload.symbol,
          type: orderPayload.side,
          volume: orderPayload.size,
          openPrice: orderPayload.limitPrice || 0,
          sl: orderPayload.slPrice,
          tp: orderPayload.tpPrice
        });
        if (res) await fetchClientPortfolioStats();
      }
    } catch (err: any) {
      alert(`Reject logic: ${err.response?.data?.error || err.message}`);
      throw err;
    }
  }, []);

  // Close Active Position manually
  const handleClosePosition = React.useCallback(async (posId: string) => {
    try {
      await tradingService.closePosition(posId);
      await fetchClientPortfolioStats();
    } catch (err: any) {
      alert(`Error liquidating: ${err.response?.data?.error || err.message}`);
    }
  }, []);

  if (authLoading) return null;

  return (
    <Suspense fallback={<div className="h-[100dvh] w-full flex items-center justify-center bg-[#0b0e14] text-white">Loading Terminal...</div>}>
      <ProTradingDashboard
        wallet={walletMetrics}
        positions={activePositions}
        closedHistory={closedHistory}
        userId={userProfile?.id || "USER_GUEST"}
        onPlaceOrder={handlePlaceOrder}
        onClosePosition={handleClosePosition}
      />
    </Suspense>
  );
}
