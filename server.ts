import dotenv from 'dotenv';
// Load environment variables before anything else!
dotenv.config({ path: './backend/.env' });

import express from 'express';
import cors from 'cors';
import { connectDatabase } from './backend/src/config/database';
import authRoutes from './backend/src/routes/authRoutes';
import healthRoutes from './backend/src/routes/healthRoutes';
import { errorHandler } from './backend/src/middleware/errorHandler';
import http from 'http';
import { SocketServer } from './backend/src/services/socketServer';
import { PriceEngine } from './backend/src/services/priceEngine';

console.log("MONGO URI =", process.env.MONGODB_URI);

const app = express();
const allowedOrigins = [
  "https://forex-frontend-tau.vercel.app"
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Register API routes
app.use('/api/auth', authRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/wallet', require('./backend/src/routes/walletRoutes').default);
app.use('/api/deposits', require('./backend/src/routes/depositRoutes').default);
app.use('/api/withdrawals', require('./backend/src/routes/withdrawalRoutes').default);
app.use('/api/kyc', require('./backend/src/routes/kycRoutes').default);
app.use('/api/trading', require('./backend/src/routes/tradingRoutes').default);
app.use('/api/copy-trading', require('./backend/src/routes/copyTradingRoutes').default);
app.use('/api/watchlist', require('./backend/src/routes/watchlistRoutes').default);
app.use('/api/alerts', require('./backend/src/routes/alertRoutes').default);
app.use('/api/admin', require('./backend/src/routes/adminRoutes').default);
app.use('/api/market', require('./backend/src/routes/marketRoutes').default);

// Central error handling
app.use(errorHandler);

const server = http.createServer(app);
SocketServer.init(server);

const start = async () => {
  await connectDatabase();
  const PORT = Number(process.env.PORT) || 8000;
  server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    PriceEngine.start();
  });
};

start();
