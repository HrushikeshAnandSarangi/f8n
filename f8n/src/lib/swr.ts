import { api } from "./api";

export const fetcher = (url: string) => api.get(url).then((res) => res.data);
