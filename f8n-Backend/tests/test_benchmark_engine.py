from benchmarks.bench_engine import arbitrage_lanes_graph, benchmark


def test_arbitrage_lanes_graph_scales_linearly_with_width():
    assert len(arbitrage_lanes_graph(1)["nodes"]) == 5
    assert len(arbitrage_lanes_graph(10)["nodes"]) == 50


def test_benchmark_runs_and_reports_expected_shape():
    result = benchmark(width=2, iterations=5, warmup=1)
    assert result["node_count"] == 10
    assert result["iterations"] == 5
    assert result["mean_ms"] > 0
    assert result["ticks_per_sec"] > 0
