import React, { useState, useEffect } from "react";
import { useAuth } from "./contexts/AuthContext";
import { io } from "socket.io-client";
import { API_BASE_URL, SOCKET_URL } from "./api/config";
import * as walletService from "./services/wallet";
import * as tradingService from "./services/trading";
import MT5Simulator from "./components/MT5Simulator";
import { SymbolData, UserWallet, Position } from "./types";

export default function App() {
  const { user: userProfile, loading: authLoading } = useAuth();

  // Live updates states (synced from SSE or polling)
  const [symbols, setSymbols] = useState<SymbolData[]>([]);
  const [walletMetrics, setWalletMetrics] = useState<UserWallet>({ balance: 0, equity: 0, margin: 0, freeMargin: 0, pnl: 0 });
  const [activePositions, setActivePositions] = useState<Position[]>([]);
  const [closedHistory, setClosedHistory] = useState<any[]>([]);

  // Sync pricing data via SSE stream on component mount
  useEffect(() => {
    const fetchStaticMetadata = async () => {
      try {
        const catRes = await fetch(`${API_BASE_URL}/market/symbols`);
        if (catRes.ok) {
          const symJson = await catRes.json();
          setSymbols(symJson.symbols || []);
        }
      } catch (err) {
        console.error("Error loading server startup payloads.", err);
      }
    };

    fetchStaticMetadata();

    const socket = io(SOCKET_URL);

    socket.on("prices", (data: any[]) => {
      if (data?.length) {
        setSymbols(data);
      }
    });

    if (userProfile?.id) {
      socket.on(`pnl_${userProfile.id}`, (positions: any[]) => {
        setActivePositions(
          positions.map((p: any) => ({
            id: p._id,
            symbol: p.symbol,
            side: p.type,
            size: p.volume,
            entryPrice: p.openPrice,
            currentPrice: p.currentPrice,
            pnl: p.pnl,
            slPrice: p.sl,
            tpPrice: p.tp
          }))
        );
      });

      socket.on(`wallet_${userProfile.id}`, (wallet: any) => {
        setWalletMetrics(wallet);
      });
    }

    return () => {
      socket.disconnect();
    };
  }, [userProfile?.id]);

  const fetchClientPortfolioStats = async () => {
    if (!userProfile) return;
    try {
      const walletData = await walletService.getWallet();
      if (walletData) {
        setWalletMetrics(walletData);
      }

      const posData = await tradingService.getPositions();
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
          tpPrice: p.tp
        })));
      }
    } catch (err) {
      console.error("Error synchronizing client ledger portfolios.", err);
    }
  };

  useEffect(() => {
    fetchClientPortfolioStats();
  }, [userProfile]);

  // Handle Order entry placements
  const handlePlaceOrder = async (orderPayload: any) => {
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
        if (res) fetchClientPortfolioStats();
      }
    } catch (err: any) {
      alert(`Reject logic: ${err.response?.data?.error || err.message}`);
      throw err;
    }
  };

  // Close Active Position manually
  const handleClosePosition = async (posId: string) => {
    try {
      await tradingService.closePosition(posId);
      fetchClientPortfolioStats();
    } catch (err) {
      alert("Error liquidating.");
    }
  };

  if (authLoading) return null;

  return (
    <MT5Simulator
      symbols={symbols}
      wallet={walletMetrics}
      positions={activePositions}
      closedHistory={closedHistory}
      userId={userProfile?.id || "USER_GUEST"}
      onPlaceOrder={handlePlaceOrder}
      onClosePosition={handleClosePosition}
    />
  );
}
