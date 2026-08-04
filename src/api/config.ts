const LIVE_API_BASE_URL = "https://forex-backend-iem1.onrender.com/api";
const LOCAL_API_BASE_URL = "http://localhost:8000/api";
const LIVE_SOCKET_URL = "https://forex-backend-iem1.onrender.com";
const LOCAL_SOCKET_URL = "http://localhost:8000";

const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

export const API_BASE_URL = isLocalhost ? LOCAL_API_BASE_URL : LIVE_API_BASE_URL;

export const SOCKET_URL = isLocalhost ? LOCAL_SOCKET_URL : LIVE_SOCKET_URL;
