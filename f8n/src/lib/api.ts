import axios from "axios";
import { demoAdapter } from "./demo/adapter";
import { isDemoMode } from "./demo/mode";

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

// No accounts, no auth - this is a free tool anyone can use, so the client is just a
// plain HTTP client against the open API.
export const api = axios.create({ baseURL: API_BASE_URL });

// Demo Mode: swap in a fully in-browser adapter per request so every page's existing
// api.get/post/put/delete calls keep working, backed by simulated data instead of a
// real backend. See src/lib/demo/ - the toggle lives on the dashboard.
api.interceptors.request.use((config) => {
  if (isDemoMode()) {
    config.adapter = demoAdapter;
  }
  return config;
});
