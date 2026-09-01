import statistics


def compute_summary(trades, equity_points, starting_capital):
    if not equity_points:
        return {
            "starting_capital": starting_capital,
            "ending_equity": starting_capital,
            "total_return_pct": 0.0,
            "max_drawdown_pct": 0.0,
            "win_rate_pct": 0.0,
            "trade_count": len(trades),
            "total_fees": round(sum(t.fee for t in trades), 4),
            "sharpe_ratio": 0.0,
        }

    ending_equity = equity_points[-1].equity
    total_return_pct = (ending_equity - starting_capital) / starting_capital * 100.0 if starting_capital else 0.0

    peak = starting_capital
    max_drawdown_pct = 0.0
    for point in equity_points:
        peak = max(peak, point.equity)
        if peak:
            max_drawdown_pct = max(max_drawdown_pct, (peak - point.equity) / peak * 100.0)

    closed_trades = [t for t in trades if t.pnl is not None]
    winning_trades = [t for t in closed_trades if t.pnl > 0]
    win_rate_pct = (len(winning_trades) / len(closed_trades) * 100.0) if closed_trades else 0.0

    return {
        "starting_capital": starting_capital,
        "ending_equity": ending_equity,
        "total_return_pct": round(total_return_pct, 4),
        "max_drawdown_pct": round(max_drawdown_pct, 4),
        "win_rate_pct": round(win_rate_pct, 2),
        "trade_count": len(trades),
        "total_fees": round(sum(t.fee for t in trades), 4),
        "sharpe_ratio": round(_sharpe_ratio(_period_returns(equity_points)), 4),
    }


def _period_returns(equity_points):
    returns = []
    for prev, curr in zip(equity_points, equity_points[1:]):
        if prev.equity:
            returns.append((curr.equity - prev.equity) / prev.equity)
    return returns


def _sharpe_ratio(returns, risk_free=0.0):
    if len(returns) < 2:
        return 0.0
    mean = statistics.mean(returns) - risk_free
    stdev = statistics.pstdev(returns)
    if stdev == 0:
        return 0.0
    return (mean / stdev) * (len(returns) ** 0.5)
