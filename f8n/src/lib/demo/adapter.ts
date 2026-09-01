import type { AxiosAdapter, AxiosResponse, InternalAxiosRequestConfig } from "axios";
import { DemoApiError, handleDemoRequest } from "./router";

const SIMULATED_LATENCY_MS = 250;

function parseBody(data: unknown): unknown {
  if (typeof data === "string") {
    try {
      return JSON.parse(data);
    } catch {
      return undefined;
    }
  }
  return data;
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Axios adapter used in place of a real HTTP call while demo mode is on - see
 * api.ts, which installs this per-request via a request interceptor. Keeps every
 * page's existing axios/SWR calls working unmodified against simulated data. */
export const demoAdapter: AxiosAdapter = async (config: InternalAxiosRequestConfig): Promise<AxiosResponse> => {
  await delay(SIMULATED_LATENCY_MS);

  const method = (config.method || "get").toLowerCase();
  const url = config.url || "";
  const body = parseBody(config.data);

  try {
    const { status, data } = handleDemoRequest(method, url, body);
    return { data, status, statusText: "OK", headers: {}, config };
  } catch (err) {
    if (err instanceof DemoApiError) {
      const error = new Error(err.message) as Error & { response: AxiosResponse; isAxiosError: boolean };
      error.isAxiosError = true;
      error.response = { data: err.body, status: err.status, statusText: "Error", headers: {}, config };
      throw error;
    }
    throw err;
  }
};
