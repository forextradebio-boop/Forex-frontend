# Forex Factory - Frontend

## Quick start

1. Install dependencies:
   `npm install`
2. Copy the example environment file:
   `cp .env.example .env`
3. Start the Vite development server:
   `npm run dev`

## Environment variables

The frontend uses the following runtime variables:
- `VITE_API_URL` — backend API base URL, defaulting to `http://localhost:8000/api`
- `VITE_SOCKET_URL` — WebSocket server URL, defaulting to `http://localhost:8000`
