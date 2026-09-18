# Performance benchmarks

Three scripts, each isolating a different layer of the same request path - a strategy graph
executing against a data source, then (for paper trading) broadcasting the result:

1. **`bench_engine.py`** - the `GraphEngine`'s own dispatch overhead, network/DB stubbed out.
2. **`bench_network.py`** - the real network calls a source block makes (ccxt, RSS, Yahoo,
   Reddit, CryptoPanic), nothing stubbed.
3. **`bench_paper_concurrency.py`** - DB writes + Socket.IO room broadcasts under several
   concurrent paper-trading sessions, network stubbed out (that's (2)'s job, not this one's).

Put together, these answer the question this doc used to just assert: **when a live paper
session is slow, is it the engine, the network, or the DB/socket layer?** Short answer,
confirmed below rather than assumed: the network, by 4-5 orders of magnitude, and it isn't
close.

## 1. Engine dispatch overhead

The `GraphEngine` ([`app/graph/engine.py`](../app/graph/engine.py)) is the one piece of code
that runs on every single tick of every backtest bar and every paper-trading poll - see the
[main README's architecture section](../../README.md#architecture) for why it's shared
between both. This measures its own overhead (topological sort + block dispatch), not the
price/sentiment fetch behind each block.

Measured on a single AMD64 (Zen-class) core, CPython 3.12.4, 1000 timed `run_tick()` calls
per graph size after a warmup - see [Methodology](#methodology).

| Agent size | Nodes | Ticks/sec | Mean latency |
|---|---:|---:|---:|
| A real agent (the README's arbitrage example) | 5 | **55,900** | 0.018 ms |
| 5 agents' worth of logic in one graph | 25 | **9,670** | 0.103 ms |
| 20 agents' worth | 100 | **2,190** | 0.456 ms |
| 50 agents' worth | 250 | **940** | 1.07 ms |

<details>
<summary>Full results (up to 2,500 nodes)</summary>

| Nodes | Edges | Iterations | Mean (ms) | p50 (ms) | p95 (ms) | Ticks/sec |
|---:|---:|---:|---:|---:|---:|---:|
| 5 | 4 | 1000 | 0.018 | 0.015 | 0.034 | 55,930 |
| 25 | 20 | 1000 | 0.103 | 0.080 | 0.182 | 9,672 |
| 100 | 80 | 1000 | 0.456 | 0.467 | 0.686 | 2,194 |
| 250 | 200 | 1000 | 1.066 | 1.102 | 1.489 | 938 |
| 500 | 400 | 1000 | 1.870 | 1.630 | 2.627 | 535 |
| 1,250 | 1,000 | 1000 | 6.807 | 4.829 | 10.132 | 147 |
| 2,500 | 2,000 | 1000 | 14.334 | 10.420 | 52.543 | 70 |

Raw JSON: [`results/latest.json`](results/latest.json). Growth is roughly linear in node
count up to ~500 nodes, then widens (p95 in particular) as the working set stops fitting
comfortably in cache - expected for a plain topological-sort + dict-dispatch engine with no
compilation step, and well past any graph size a human would actually build on the canvas.

</details>

Every real agent shipped in this repo (the arbitrage and sentiment examples, see
[README](../../README.md#how-an-agent-works)) is 4-5 nodes. Section 2 puts a real number on
just how immaterial that 0.018 ms is.

## 2. Network I/O latency - the actual bottleneck

Each source block's real work is a network call: `fetch_ticker_price()` (ccxt) or one of the
sentiment fetchers (`app/sentiment_engine/pipeline.py`). This is what `LiveContext`/
`HistoricalContext` do that section 1's engine benchmark deliberately stubs out - measured
here live, nothing stubbed, 5 timed calls per source.

| Source | Mean | p50 | p95 |
|---|---:|---:|---:|
| Binance ticker | 1,482 ms | 255 ms | 6,368 ms |
| Kraken ticker | 1,215 ms | 1,004 ms | 2,285 ms |
| Coinbase ticker | 792 ms | 102 ms | 3,584 ms |
| KuCoin ticker | 997 ms | 223 ms | 4,073 ms |
| Bybit ticker | 738 ms | 144 ms | 3,111 ms |
| RSS news (CoinDesk + Cointelegraph) | 1,234 ms | 1,119 ms | 1,811 ms |
| Yahoo Finance headlines | 675 ms\* | 0.2 ms\* | 3,376 ms |

\* Yahoo Finance's mean/p50 are misleadingly low: in this run it returned 0 headlines on
every call (`yfinance` hit an API contract error, handled gracefully per
[`fetch_yahoo_finance_headlines`](../app/sentiment_engine/pipeline.py) - it logs and returns
`[]` rather than raising), so most calls failed fast instead of actually fetching data. Raw
JSON: [`results/network.json`](results/network.json). Reddit and CryptoPanic are skipped
unless `REDDIT_CLIENT_ID`/`REDDIT_CLIENT_SECRET` or `CRYPTOPANIC_API_KEY` are set.

**That's the comparison this doc used to only assert:** even the fastest source here
(Bybit, 738 ms mean) is **~41,000x** slower than one engine tick (0.018 ms) on a real 5-node
agent; the slowest (Binance, 1,482 ms) is **~82,000x** slower. A live paper session's poll
cadence is set entirely by whichever source blocks it uses, never by the engine.

## 3. Concurrent paper-trading sessions - DB + Socket.IO scaling

Each paper session is its own background thread ([`app/papertrading/manager.py`](../app/papertrading/manager.py))
that, per poll, runs the engine, writes a trade/equity row, and emits it over Socket.IO to
that session's room. This benchmarks that DB-write-plus-emit path under 1-50 *concurrent*
sessions sharing one process, one SQLite file, and one `SocketIO` instance - the same
single-process model the README documents as the current limitation - with the network
stubbed out (section 2 already covers that cost) and a price walk that deliberately crosses
the arbitrage threshold every other tick, so both the equity-only and the equity+trade write
paths actually get exercised.

| Sessions | Total ticks | Trades | Wall time | Aggregate ticks/sec | Tick mean | Tick p95 |
|---:|---:|---:|---:|---:|---:|---:|
| 1 | 30 | 1 | 0.20 s | 147 | 6.8 ms | 8.6 ms |
| 5 | 150 | 5 | 1.13 s | 132 | 28.7 ms | 146.9 ms |
| 20 | 600 | 20 | 4.57 s | 131 | 97.5 ms | 366.1 ms |
| 50 | 1,500 | 50 | 10.96 s | 137 | 221.1 ms | 743.5 ms |

Raw JSON: [`results/paper_concurrency.json`](results/paper_concurrency.json).

**What this shows:** aggregate throughput is flat at ~130-150 ticks/sec regardless of how
many sessions are running - SQLite allows one writer at a time, so adding sessions doesn't
add capacity, it adds queueing. That shows up directly as p95 tick latency growing roughly
linearly with session count (8.6 ms -> 743.5 ms from 1 to 50 sessions) even though each
session's own workload never changed. In a separate run at 50 concurrent sessions, one
session's commit failed outright with `sqlite3.OperationalError: database is locked` - an
intermittent but real failure mode, not a benchmark artifact (see
[Methodology](#methodology) for how this was confirmed). This is precisely the scenario the
README already flags Postgres as the fix for ("Recommended" over the sqlite fallback) - this
benchmark is the confirming evidence for that recommendation, not a new finding requiring a
different one. A single agent (the left column) is unaffected either way.

## Methodology

**Section 1** - each graph is `width` independent 5-node arbitrage lanes (2 price sources ->
spread -> threshold -> paper buy, the real arbitrage example's shape) wired into one graph,
so node/edge count scales linearly and predictably with `width` - see
[`arbitrage_lanes_graph()`](bench_engine.py). Timing uses a context that returns a price
directly with no I/O, so what's measured is purely the engine's own traversal/dispatch cost.
Each width runs a warmup of `min(50, iterations)` ticks before timing starts.

**Section 2** measures the real, unmocked functions the source blocks call
(`fetch_ticker_price`, `fetch_rss_news`, `fetch_yahoo_finance_headlines`, and Reddit/
CryptoPanic when credentials are set) - 5 iterations each, network conditions permitting.

**Section 3** uses a real file-based SQLite DB (not `TestingConfig`'s `:memory:`, which
SQLAlchemy is forced onto a single-connection `StaticPool` for - the only way an in-memory
DB survives across connections - and that made every thread share one physical connection,
which is what actually caused the *first* attempt at this benchmark to crash outright; fixed
by adding `config_overrides` to `create_app()` so a real file + a normal per-thread
connection pool can be used instead) and a real `Socket.IO` test client subscribed to each
session's room, so every `emit()` has an actual subscriber to serialize a payload to and
deliver it to - the same as a browser tab watching a live session.

All three: these numbers are relative to the machine that ran them, not absolute - rerun
them on your own hardware/network before treating any number here as a promise. What's
structural (network >> engine by orders of magnitude; SQLite serializes writes under
concurrent sessions; ticks/sec is flat under contention while tail latency isn't) will hold
regardless of the machine.

## Reproducing

```bash
cd f8n-Backend

# 1. Engine dispatch overhead - fast, deterministic, safe to run anywhere
python -m benchmarks.bench_engine
python -m benchmarks.bench_engine --widths 1 5 20 50 100 250 500 --iterations 1000 --out benchmarks/results/latest.json

# 2. Network I/O latency - hits real exchanges/RSS/Yahoo; set REDDIT_CLIENT_ID/
#    REDDIT_CLIENT_SECRET or CRYPTOPANIC_API_KEY first to include those sources
python -m benchmarks.bench_network --iterations 5 --out benchmarks/results/network.json

# 3. Concurrent paper-trading sessions - network-free, but writes real SQLite files
python -m benchmarks.bench_paper_concurrency --sessions 1 5 20 50 --ticks 30 --out benchmarks/results/paper_concurrency.json
```

Pytest smoke tests ([`tests/test_benchmark_engine.py`](../tests/test_benchmark_engine.py),
[`tests/test_benchmark_paper_concurrency.py`](../tests/test_benchmark_paper_concurrency.py))
check that benchmarks (1) and (3) still run and return the expected shape - they assert on
correctness, not timing, since timing assertions are inherently flaky across CI runners.
Benchmark (2) is deliberately **not** in the pytest suite, for the same reason the README
already calls live ccxt/Reddit/RSS calls a manual step: it's non-deterministic and
network-dependent by nature, not a regression a CI run should gate on.
