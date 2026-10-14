const isDevelopment = import.meta.env.DEV;

export const API_BASE_URL = (import.meta.env.VITE_API_URL as string)?.replace(/\/api\/?$/, '') || "https://forex-backend-iem1.onrender.com";
export const SOCKET_URL = (import.meta.env.VITE_SOCKET_URL as string) || API_BASE_URL;
