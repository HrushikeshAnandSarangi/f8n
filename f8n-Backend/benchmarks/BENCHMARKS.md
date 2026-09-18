# Engine benchmarks

The `GraphEngine` ([`app/graph/engine.py`](../app/graph/engine.py)) is the one piece of code
that runs on every single tick of every backtest bar and every paper-trading poll - see the
[main README's architecture section](../../README.md#architecture) for why it's shared
between both. Its own overhead (topological sort + block dispatch, not the price/sentiment
fetch behind each block) is what [`benchmarks/bench_engine.py`](bench_engine.py) measures.

## Flagship numbers

Measured on a single AMD64 (Zen-class) core, CPython 3.12.4, 1000 timed `run_tick()` calls
per graph size after a warmup - see [Methodology](#methodology) for exact conditions.

| Agent size | Nodes | Ticks/sec | Mean latency |
|---|---:|---:|---:|
| A real agent (the README's arbitrage example) | 5 | **55,900** | 0.018 ms |
| 5 agents' worth of logic in one graph | 25 | **9,670** | 0.103 ms |
| 20 agents' worth | 100 | **2,190** | 0.456 ms |
| 50 agents' worth | 250 | **940** | 1.07 ms |

Every real agent shipped in this repo (the arbitrage example and the sentiment example, see
[README](../../README.md#how-an-agent-works)) is 4-5 nodes. At that size the engine's own
overhead is immaterial next to the network call a source block makes - a live paper-trading
poll is bottlenecked entirely by ccxt/Reddit/RSS latency, not by graph execution.

## Full results

| Nodes | Edges | Iterations | Mean (ms) | p50 (ms) | p95 (ms) | Ticks/sec |
|---:|---:|---:|---:|---:|---:|---:|
| 5 | 4 | 1000 | 0.018 | 0.015 | 0.034 | 55,930 |
| 25 | 20 | 1000 | 0.103 | 0.080 | 0.182 | 9,672 |
| 100 | 80 | 1000 | 0.456 | 0.467 | 0.686 | 2,194 |
| 250 | 200 | 1000 | 1.066 | 1.102 | 1.489 | 938 |
| 500 | 400 | 1000 | 1.870 | 1.630 | 2.627 | 535 |
| 1,250 | 1,000 | 1000 | 6.807 | 4.829 | 10.132 | 147 |
| 2,500 | 2,000 | 1000 | 14.334 | 10.420 | 52.543 | 70 |

Raw JSON: [`benchmarks/results/latest.json`](results/latest.json). Growth is roughly linear
in node count up to ~500 nodes, then widens (p95 in particular) as the working set stops
fitting comfortably in cache - expected for a plain topological-sort + dict-dispatch engine
with no compilation step, and well past any graph size a human would actually build on the
block canvas.

## Methodology

Each graph is `width` independent 5-node arbitrage lanes (2 price sources -> spread ->
threshold -> paper buy - the same shape as the real arbitrage example) wired into one graph,
so node/edge count scales linearly and predictably with `width`. See
[`arbitrage_lanes_graph()`](bench_engine.py) for the exact structure.

Timing uses a `BenchmarkContext` that returns a price directly with no I/O, so what's
measured is purely the engine's own traversal/dispatch cost - never a network or DB call
(those are what `HistoricalContext`/`LiveContext` in
[`app/graph/execution_context.py`](../app/graph/execution_context.py) are for, and they're
several orders of magnitude slower than anything measured here). Each width runs a warmup
of `min(50, iterations)` ticks before timing starts.

These numbers are relative, not absolute - they'll vary with the machine that runs them.
What matters for catching a regression is the shape of the curve and the ticks/sec at the
node counts a real agent actually has (single digits), not the raw numbers on any one box.

## Reproducing

```bash
cd f8n-Backend
python -m benchmarks.bench_engine
python -m benchmarks.bench_engine --widths 1 10 100 --iterations 1000
python -m benchmarks.bench_engine --widths 1 5 20 50 100 250 500 --iterations 1000 --out benchmarks/results/latest.json
```

A pytest smoke test ([`tests/test_benchmark_engine.py`](../tests/test_benchmark_engine.py))
checks the benchmark harness itself still runs and returns the expected shape - it asserts
on correctness, not on timing, since timing assertions in CI are inherently flaky across
different runners.
