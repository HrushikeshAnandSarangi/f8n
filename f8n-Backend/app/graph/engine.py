from collections import defaultdict, deque

from app.blocks.registry import get_block

ACTION_CATEGORY = "action"


class GraphEngine:
    """Executes one "tick" of a strategy graph (a historical bar during a backtest,
    or a live poll during paper trading) and returns any action signals it produced.

    The graph format mirrors React Flow's node/edge shape directly, so the frontend
    canvas can be serialized to `graph_json` with no transformation:
        {"nodes": [{"id", "type", "config"}, ...],
         "edges": [{"source", "sourceHandle", "target", "targetHandle"}, ...]}
    """

    def run_tick(self, graph: dict, ctx) -> list:
        nodes = {n["id"]: n for n in graph.get("nodes", [])}
        edges = graph.get("edges", [])

        incoming = defaultdict(list)  # node_id -> [(source_id, source_handle, target_handle)]
        adjacency = defaultdict(list)
        indegree = {node_id: 0 for node_id in nodes}
        for edge in edges:
            source, target = edge["source"], edge["target"]
            if source not in nodes or target not in nodes:
                continue
            incoming[target].append((source, edge.get("sourceHandle"), edge.get("targetHandle")))
            adjacency[source].append(target)
            indegree[target] += 1

        order = []
        queue = deque([node_id for node_id, deg in indegree.items() if deg == 0])
        remaining = dict(indegree)
        while queue:
            node_id = queue.popleft()
            order.append(node_id)
            for nxt in adjacency[node_id]:
                remaining[nxt] -= 1
                if remaining[nxt] == 0:
                    queue.append(nxt)

        if len(order) != len(nodes):
            raise ValueError("Strategy graph has a cycle and cannot be executed")

        outputs = {}
        signals = []
        for node_id in order:
            node = nodes[node_id]
            block_cls = get_block(node["type"])
            block_inputs = {}
            for source_id, source_handle, target_handle in incoming.get(node_id, []):
                block_inputs[target_handle] = outputs.get(source_id, {}).get(source_handle)

            result = block_cls().execute(node.get("config") or {}, block_inputs, ctx) or {}
            outputs[node_id] = result

            if block_cls.spec.category == ACTION_CATEGORY and result.get("triggered"):
                signals.append({"node_id": node_id, **result})

        return signals
