def test_health(client):
    resp = client.get("/api/health")
    assert resp.status_code == 200
    assert resp.get_json()["status"] == "ok"


def test_list_blocks_returns_registry(client):
    resp = client.get("/api/blocks/")
    assert resp.status_code == 200
    types = {b["type"] for b in resp.get_json()}
    assert "source.exchange_ticker" in types
    assert "source.sentiment" in types
    assert "action.paper_buy" in types


def test_strategy_crud_happy_path(client):
    """No accounts, no auth - this is a free tool, so a strategy is usable by anyone
    who has its id, same as everything else in the API."""
    graph = {
        "nodes": [{"id": "a", "type": "source.exchange_ticker", "config": {"exchange": "binance", "symbol": "BTC/USDT"}}],
        "edges": [],
    }
    resp = client.post("/api/strategies", json={"name": "My Agent", "graph": graph})
    assert resp.status_code == 201
    strategy_id = resp.get_json()["id"]

    resp = client.get(f"/api/strategies/{strategy_id}")
    assert resp.status_code == 200
    assert resp.get_json()["graph"] == graph

    resp = client.get("/api/strategies")
    assert len(resp.get_json()) == 1

    resp = client.put(f"/api/strategies/{strategy_id}", json={"name": "Renamed Agent"})
    assert resp.status_code == 200
    assert resp.get_json()["name"] == "Renamed Agent"

    resp = client.delete(f"/api/strategies/{strategy_id}")
    assert resp.status_code == 204
    assert client.get(f"/api/strategies/{strategy_id}").status_code == 404


def test_get_missing_strategy_is_404(client):
    resp = client.get("/api/strategies/999")
    assert resp.status_code == 404
