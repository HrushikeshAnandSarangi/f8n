import { DEMO_BLOCKS } from "./blocks";
import * as store from "./store";

export class DemoApiError extends Error {
  status: number;
  body: unknown;

  constructor(status: number, body: unknown) {
    super(typeof body === "object" && body && "error" in body ? String((body as { error: unknown }).error) : "Demo API error");
    this.status = status;
    this.body = body;
  }
}

export interface DemoResponse {
  status: number;
  data: unknown;
}

/** Mirrors the real REST API's routes (see f8n-Backend/app/api/) closely enough
 * that every page's existing axios calls work unmodified against this instead. */
export function handleDemoRequest(method: string, path: string, body: unknown): DemoResponse {
  const url = path.split("?")[0];
  const segments = url.split("/").filter(Boolean);

  if (url === "/blocks/" || url === "/blocks") {
    return { status: 200, data: DEMO_BLOCKS };
  }

  if (segments[0] === "strategies") {
    return handleStrategies(method, segments, body);
  }

  if (segments[0] === "backtests") {
    return handleBacktests(method, segments, body);
  }

  if (segments[0] === "paper-sessions") {
    return handlePaperSessions(method, segments, body);
  }

  throw new DemoApiError(404, { error: `No demo route for ${method.toUpperCase()} ${url}` });
}

function handleStrategies(method: string, segments: string[], body: unknown): DemoResponse {
  const id = segments[1] ? Number(segments[1]) : null;

  if (id === null) {
    if (method === "get") {
      return { status: 200, data: store.listStrategies().map(({ graph: _graph, ...rest }) => rest) };
    }
    if (method === "post") {
      const input = (body || {}) as { name?: string; description?: string | null; graph?: any }; // eslint-disable-line @typescript-eslint/no-explicit-any
      return { status: 201, data: store.createStrategy(input) };
    }
  } else {
    if (method === "get") {
      const strategy = store.getStrategy(id);
      if (!strategy) throw new DemoApiError(404, { error: "Not found" });
      return { status: 200, data: strategy };
    }
    if (method === "put") {
      const updated = store.updateStrategy(id, (body || {}) as any); // eslint-disable-line @typescript-eslint/no-explicit-any
      if (!updated) throw new DemoApiError(404, { error: "Not found" });
      return { status: 200, data: updated };
    }
    if (method === "delete") {
      const ok = store.deleteStrategy(id);
      if (!ok) throw new DemoApiError(404, { error: "Not found" });
      return { status: 204, data: null };
    }
  }

  throw new DemoApiError(404, { error: "No demo route" });
}

function handleBacktests(method: string, segments: string[], body: unknown): DemoResponse {
  const id = segments[1] ? Number(segments[1]) : null;

  if (id === null) {
    if (method === "get") {
      return { status: 200, data: store.listBacktests() };
    }
    if (method === "post") {
      const input = (body || {}) as { strategy_id: number; start_date: string; end_date: string; starting_capital?: number };
      if (!store.getStrategy(input.strategy_id)) throw new DemoApiError(404, { error: "Not found" });
      return { status: 202, data: store.createBacktest(input) };
    }
  } else if (method === "get") {
    const run = store.getBacktest(id);
    if (!run) throw new DemoApiError(404, { error: "Not found" });
    return { status: 200, data: run };
  }

  throw new DemoApiError(404, { error: "No demo route" });
}

function handlePaperSessions(method: string, segments: string[], body: unknown): DemoResponse {
  const id = segments[1] ? Number(segments[1]) : null;
  const action = segments[2];

  if (id === null) {
    if (method === "get") {
      return { status: 200, data: store.listPaperSessions() };
    }
    if (method === "post") {
      const input = (body || {}) as { strategy_id: number; starting_capital?: number };
      if (!store.getStrategy(input.strategy_id)) throw new DemoApiError(404, { error: "Not found" });
      return { status: 202, data: store.createPaperSession(input) };
    }
  } else if (action === "stop" && method === "post") {
    const session = store.stopPaperSession(id);
    if (!session) throw new DemoApiError(404, { error: "Not found" });
    return { status: 202, data: { status: "stopping" } };
  } else if (method === "get") {
    const session = store.getPaperSession(id);
    if (!session) throw new DemoApiError(404, { error: "Not found" });
    return { status: 200, data: session };
  }

  throw new DemoApiError(404, { error: "No demo route" });
}
