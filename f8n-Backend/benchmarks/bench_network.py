"""Benchmarks the REAL latency of the network calls a live source block makes -
fetch_ticker_price() per exchange (app/marketdata/ccxt_client.py) and each
sentiment source (app/sentiment_engine/pipeline.py). This is what BENCHMARKS.md
means by "several orders of magnitude slower" than the engine - bench_engine.py
measures the engine's own dispatch overhead with these calls stubbed out;
this script measures the calls themselves, live, with nothing stubbed.

Unlike bench_engine.py, this is NOT deterministic or CI-safe: results depend on
the exchange, your network path, and rate limits that fluctuate independently of
this codebase - exactly why README.md calls exercising live ccxt/Reddit/RSS calls
a manual step, not part of `pytest`. Run it yourself; don't wire it into CI.

Reddit and CryptoPanic are skipped unless their credentials are set in the
environment, same as the sentiment blocks themselves.

Usage:
    python -m benchmarks.bench_network
    python -m benchmarks.bench_network --iterations 5 --out benchmarks/results/network.json
"""

import argparse
import json
import os
import statistics
import time
from datetime import datetime, timezone
from pathlib import Path

from app.marketdata.ccxt_client import SUPPORTED_EXCHANGES, fetch_ticker_price
from app.sentiment_engine.pipeline import (
    DEFAULT_SUBREDDITS,
    fetch_cryptopanic_news,
    fetch_reddit_posts,
    fetch_rss_news,
    fetch_yahoo_finance_headlines,
)


def _time_calls(fn, iterations, *args, **kwargs) -> dict:
    samples = []
    errors = 0
    for _ in range(iterations):
        start = time.perf_counter()
        try:
            fn(*args, **kwargs)
        except Exception:  # noqa: BLE001 - a flaky call counts as a data point, not a crash
            errors += 1
            continue
        samples.append(time.perf_counter() - start)

    if not samples:
        return {"iterations": iterations, "errors": errors, "mean_ms": None, "p50_ms": None, "p95_ms": None}

    samples.sort()
    return {
        "iterations": iterations,
        "errors": errors,
        "mean_ms": statistics.mean(samples) * 1000,
        "p50_ms": samples[len(samples) // 2] * 1000,
        "p95_ms": samples[int(len(samples) * 0.95)] * 1000,
        "min_ms": samples[0] * 1000,
        "max_ms": samples[-1] * 1000,
    }


def benchmark_exchanges(iterations, symbol="BTC/USDT") -> dict:
    return {exchange: _time_calls(fetch_ticker_price, iterations, exchange, symbol) for exchange in SUPPORTED_EXCHANGES}


def benchmark_sentiment_sources(iterations, ticker="BTC-USD") -> dict:
    results = {
        "rss_news": _time_calls(fetch_rss_news, iterations, ticker),
        "yahoo_finance": _time_calls(fetch_yahoo_finance_headlines, iterations, ticker),
    }

    if os.environ.get("REDDIT_CLIENT_ID") and os.environ.get("REDDIT_CLIENT_SECRET"):
        results["reddit"] = _time_calls(fetch_reddit_posts, iterations, DEFAULT_SUBREDDITS, ticker)
    else:
        results["reddit"] = {"skipped": "REDDIT_CLIENT_ID/REDDIT_CLIENT_SECRET not configured"}

    if os.environ.get("CRYPTOPANIC_API_KEY"):
        results["cryptopanic"] = _time_calls(fetch_cryptopanic_news, iterations, ticker)
    else:
        results["cryptopanic"] = {"skipped": "CRYPTOPANIC_API_KEY not configured"}

    return results


def print_table(title, results):
    print(f"\n{title}")
    header = f"{'source':>15} {'iters':>6} {'errors':>7} {'mean_ms':>10} {'p50_ms':>10} {'p95_ms':>10}"
    print(header)
    print("-" * len(header))
    for name, r in results.items():
        if "skipped" in r:
            print(f"{name:>15}   skipped - {r['skipped']}")
            continue
        mean = f"{r['mean_ms']:.1f}" if r["mean_ms"] is not None else "n/a"
        p50 = f"{r['p50_ms']:.1f}" if r["p50_ms"] is not None else "n/a"
        p95 = f"{r['p95_ms']:.1f}" if r["p95_ms"] is not None else "n/a"
        print(f"{name:>15} {r['iterations']:>6} {r['errors']:>7} {mean:>10} {p50:>10} {p95:>10}")


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--iterations", type=int, default=5, help="Timed calls per source")
    parser.add_argument("--out", type=Path, default=None, help="Write results as JSON to this path")
    args = parser.parse_args()

    exchange_results = benchmark_exchanges(args.iterations)
    sentiment_results = benchmark_sentiment_sources(args.iterations)

    print_table("Exchange ticker fetch (ccxt)", exchange_results)
    print_table("Sentiment source fetch", sentiment_results)

    if args.out:
        args.out.parent.mkdir(parents=True, exist_ok=True)
        args.out.write_text(
            json.dumps(
                {
                    "run_at": datetime.now(timezone.utc).isoformat(),
                    "exchanges": exchange_results,
                    "sentiment_sources": sentiment_results,
                },
                indent=2,
            )
        )
        print(f"\nWrote {args.out}")


if __name__ == "__main__":
    main()
