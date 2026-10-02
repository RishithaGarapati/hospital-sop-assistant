import axios from "axios";
import { useAuthStore } from "../store/authStore";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1",
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

// ── Auth ─────────────────────────────────────────────
export const login = (email: string, password: string) =>
  api.post("/auth/login", new URLSearchParams({ username: email, password }));

// ── SOPs ─────────────────────────────────────────────
export const getSops = (params?: Record<string, string>) =>
  api.get("/sops/", { params });

export const uploadSop = (formData: FormData) =>
  api.post("/sops/", formData, { headers: { "Content-Type": "multipart/form-data" } });

export const updateSop = (id: number, data: Record<string, string>) =>
  api.put(`/sops/${id}`, data);

export const deleteSop = (id: number) => api.delete(`/sops/${id}`);

// ── Chat ─────────────────────────────────────────────
export const queryChat = (question: string, category_filter?: string) =>
  api.post("/chat/query", { question, category_filter });

// ── Summary ──────────────────────────────────────────
export const generateSummary = (sop_id: number, summary_type: string) =>
  api.post("/summaries/", { sop_id, summary_type });

// ── Analytics ────────────────────────────────────────
export const getAnalytics = () => api.get("/analytics/overview");
export const getTopSops = () => api.get("/analytics/top-sops");

// ── Users ────────────────────────────────────────────
export const getUsers = () => api.get("/users/");
export const createUser = (data: Record<string, string>) => api.post("/users/", data);
export const deleteUser = (id: number) => api.delete(`/users/${id}`);
