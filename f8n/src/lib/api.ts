import axios from "axios";

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

// No accounts, no auth - this is a free tool anyone can use, so the client is just a
// plain HTTP client against the open API.
export const api = axios.create({ baseURL: API_BASE_URL });
