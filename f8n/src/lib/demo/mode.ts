"use client";

import { useEffect, useState } from "react";
import { mutate } from "swr";

const STORAGE_KEY = "f8n_demo_mode";

type Listener = (enabled: boolean) => void;

const listeners = new Set<Listener>();

export function isDemoMode(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(STORAGE_KEY) === "true";
}

export function setDemoMode(enabled: boolean) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, String(enabled));
  if (!enabled) {
    // Stop any simulated paper-session tickers so they don't keep running (and
    // burning timers) once the switch is off - a lazy import avoids a cycle
    // with store.ts, which never needs to import this module back.
    import("./store").then(({ stopAllTickers }) => stopAllTickers());
  }
  listeners.forEach((listener) => listener(enabled));
  // Every page's data comes from SWR keyed by REST path - revalidating everything
  // makes the switch take effect immediately, without needing a page reload.
  mutate(() => true, undefined, { revalidate: true });
}

export function subscribeDemoMode(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useDemoMode(): [boolean, (enabled: boolean) => void] {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    setEnabled(isDemoMode());
    return subscribeDemoMode(setEnabled);
  }, []);

  return [enabled, setDemoMode];
}
