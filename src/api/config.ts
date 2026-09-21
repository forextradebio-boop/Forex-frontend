const LOCAL_API_BASE_URL = "https://forex-backend-cils.onrender.com";
const LOCAL_SOCKET_URL = "https://forex-backend-cils.onrender.com";

const LIVE_API_BASE_URL = "https://forex-backend-cils.onrender.com";
const LIVE_SOCKET_URL = "https://forex-backend-cils.onrender.com";

const isDev = import.meta.env ? import.meta.env.DEV : window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

export const API_BASE_URL = isDev ? LOCAL_API_BASE_URL : LIVE_API_BASE_URL;
export const SOCKET_URL = isDev ? LOCAL_SOCKET_URL : LIVE_SOCKET_URL;
