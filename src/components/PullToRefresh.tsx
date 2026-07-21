import React from 'react';
import PullToRefreshLib from 'react-simple-pull-to-refresh';
import { RefreshCw } from 'lucide-react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({ onRefresh, children }) => {
  return (
    <PullToRefreshLib
      onRefresh={onRefresh}
      pullingContent={
        <div className="flex justify-center items-center py-4">
          <div className="bg-lb-panel shadow-lg rounded-full p-2.5 flex items-center justify-center border border-lb-border">
             <RefreshCw className="w-5 h-5 text-lb-text-muted" />
          </div>
        </div>
      }
      refreshingContent={
        <div className="flex justify-center items-center py-4">
          <div className="bg-lb-panel shadow-lg rounded-full p-2.5 flex items-center justify-center border border-lb-border">
             <RefreshCw className="w-5 h-5 text-lb-accent animate-spin" />
          </div>
        </div>
      }
    >
      {/* react-simple-pull-to-refresh requires a single root child that handles scrolling */}
      <div className="h-full w-full overflow-y-auto">
        {children}
      </div>
    </PullToRefreshLib>
  );
};
