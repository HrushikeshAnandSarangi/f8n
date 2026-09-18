import tempfile
from pathlib import Path

from app.graph.engine import GraphEngine
from benchmarks.bench_paper_concurrency import FastContext, _arbitrage_graph, benchmark


def test_fast_context_alternates_trigger_and_non_trigger_ticks():
    """The whole point of FastContext over a constant price is that it exercises
    both write paths (equity-only, and equity+trade) - a context that never
    triggers would silently only ever benchmark the cheaper one."""
    graph = _arbitrage_graph()
    engine = GraphEngine()
    ctx = FastContext()

    signal_counts = [len(engine.run_tick(graph, ctx)) for _ in range(4)]

    assert any(count > 0 for count in signal_counts)
    assert any(count == 0 for count in signal_counts)


def test_benchmark_runs_concurrent_sessions_and_reports_expected_shape():
    with tempfile.TemporaryDirectory() as tmp:
        result = benchmark(num_sessions=3, ticks_per_session=4, db_path=Path(tmp) / "bench.db")

    assert result["sessions"] == 3
    assert result["total_ticks"] == 12
    assert result["trades_fired"] > 0
    assert result["wall_seconds"] > 0
    assert result["tick_mean_ms"] > 0
