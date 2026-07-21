import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw } from 'lucide-react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({ onRefresh, children }) => {
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef(0);

  const threshold = 120; // pull distance needed to trigger refresh

  const handleTouchStart = (e: React.TouchEvent) => {
    // Only allow pull to refresh when at the very top of the page
    if (window.scrollY === 0 || document.documentElement.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
      setIsPulling(true);
      setPullDistance(0);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPulling || isRefreshing) return;

    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;

    if (diff > 0 && window.scrollY === 0) {
      // Prevent default to avoid browser's native pull-to-refresh
      if (e.cancelable) {
        e.preventDefault();
      }
      // Apply a dampening effect
      setPullDistance(diff * 0.4);
    }
  };

  const handleTouchEnd = async () => {
    if (!isPulling) return;
    setIsPulling(false);

    if (pullDistance >= threshold * 0.4 && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(60); // Hold spinner at 60px
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  };

  return (
    <div
      className="w-full h-full relative"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator overlay */}
      <div
        className="fixed top-0 left-0 right-0 flex justify-center z-[100] pointer-events-none transition-transform duration-200 ease-out"
        style={{
          transform: `translateY(${isRefreshing ? 60 : pullDistance}px)`,
          opacity: pullDistance > 10 || isRefreshing ? 1 : 0
        }}
      >
        <div className="bg-lb-panel shadow-2xl rounded-full p-2.5 flex items-center justify-center border border-lb-border mt-[-40px]">
          <RefreshCw
            className={`w-6 h-6 text-lb-accent ${isRefreshing ? 'animate-spin' : ''}`}
            style={{ transform: `rotate(${pullDistance * 3}deg)` }}
          />
        </div>
      </div>

      {children}
    </div>
  );
};
