import axios from "axios";

export const resolveApiUrl = (envUrl) => {
  if (envUrl && envUrl.trim()) {
    let url = envUrl.trim();
    if (!/^https?:\/\//i.test(url)) {
      url = `https://${url}`;
    }
    url = url.replace(/\/+$/, "");
    return url.endsWith("/api") ? url : `${url}/api`;
  }
  if (typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")) {
    return "http://localhost:5000/api";
  }
  return "https://industry-mandi01.onrender.com/api";
};

export const api = axios.create({
  baseURL: resolveApiUrl(import.meta.env.VITE_API_URL),
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = "Bearer " + token;
  }
  return config;
});

export default api;
