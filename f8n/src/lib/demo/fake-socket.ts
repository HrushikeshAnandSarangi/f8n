export interface SimpleSocket {
  emit(event: string, payload?: unknown): void;
  on(event: string, handler: (payload: any) => void): void; // eslint-disable-line @typescript-eslint/no-explicit-any
  off(event: string, handler: (payload: any) => void): void; // eslint-disable-line @typescript-eslint/no-explicit-any
}

type Handler = (payload: unknown) => void;

/**
 * A minimal in-memory stand-in for the Socket.IO client, used only in demo mode.
 * `store.ts`'s simulated paper-session tickers call `dispatch(...)` to push
 * "server -> client" events to whatever the current page has subscribed to -
 * there's no real network, no rooms, just direct event fan-out.
 */
class FakeSocket implements SimpleSocket {
  private listeners = new Map<string, Set<Handler>>();

  emit(event: string, payload?: unknown) {
    if (event === "join_session" || event === "leave_session") {
      // No real rooms to join in demo mode - the ticker just broadcasts to
      // whichever handlers are currently registered for its events.
      return;
    }
    // Unknown client -> "server" events are no-ops in demo mode.
    void payload;
  }

  on(event: string, handler: Handler) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(handler);
  }

  off(event: string, handler: Handler) {
    this.listeners.get(event)?.delete(handler);
  }

  dispatch(event: string, payload: unknown) {
    this.listeners.get(event)?.forEach((handler) => handler(payload));
  }
}

export const fakeSocket = new FakeSocket();
