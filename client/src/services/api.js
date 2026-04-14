import axios from "axios";
import { notifyError } from "../utils/toastBus";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  withCredentials: true,
});

// Attach JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally — clear token and redirect to login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
      return Promise.reject(err);
    }

    if (err.response?.status === 429) {
      notifyError("Too many requests were sent too quickly. Please wait a moment and try again.");
    } else if (!err.response) {
      notifyError("Network error. Please check that the backend server is running.");
    }
    return Promise.reject(err);
  }
);

export default api;
