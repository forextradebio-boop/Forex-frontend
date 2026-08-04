const LIVE_API_BASE_URL = "https://forex-backend-iem1.onrender.com/api";
const LOCAL_API_BASE_URL = "http://localhost:8000/api";
const LIVE_SOCKET_URL = "https://forex-backend-iem1.onrender.com";
const LOCAL_SOCKET_URL = "http://localhost:8000";

export const API_BASE_URL = (() => {
  if ((import.meta as any).env?.DEV) return LOCAL_API_BASE_URL;
  return ((import.meta as any).env?.VITE_API_URL as string | undefined)?.trim() || LIVE_API_BASE_URL;
})();

export const SOCKET_URL = (() => {
  if ((import.meta as any).env?.DEV) return LOCAL_SOCKET_URL;
  return ((import.meta as any).env?.VITE_SOCKET_URL as string | undefined)?.trim() || LIVE_SOCKET_URL;
})();