class Portfolio:
    """Shared paper-money fill/PnL simulation used by both the backtest runner and the
    live paper-trading bot, so a strategy is tested and run with the exact same
    accounting - only where the price/action signals come from differs.
    """

    def __init__(self, starting_capital: float):
        self.cash = starting_capital
        self.positions = {}  # (exchange, symbol) -> {"qty": float, "avg_cost": float}
        self.realized_pnl = 0.0

    def apply_buy(self, exchange, symbol, price, quantity, fee_pct):
        if price is None:
            return None
        cost = price * quantity
        fee = cost * fee_pct
        total_cost = cost + fee
        if total_cost > self.cash:
            return None  # insufficient paper funds - skip the trade

        self.cash -= total_cost
        key = (exchange, symbol)
        position = self.positions.setdefault(key, {"qty": 0.0, "avg_cost": 0.0})
        new_qty = position["qty"] + quantity
        position["avg_cost"] = (position["avg_cost"] * position["qty"] + cost) / new_qty if new_qty else 0.0
        position["qty"] = new_qty
        return {"fee": fee, "pnl": None}

    def apply_sell(self, exchange, symbol, price, quantity, fee_pct):
        if price is None:
            return None
        key = (exchange, symbol)
        position = self.positions.get(key)
        if not position or position["qty"] < quantity:
            return None  # nothing (or not enough) to sell - skip the trade

        proceeds = price * quantity
        fee = proceeds * fee_pct
        pnl = (price - position["avg_cost"]) * quantity - fee

        self.cash += proceeds - fee
        position["qty"] -= quantity
        self.realized_pnl += pnl
        return {"fee": fee, "pnl": pnl}

    def equity(self, price_lookup):
        """price_lookup: callable(exchange, symbol) -> current price or None."""
        value = self.cash
        for (exchange, symbol), position in self.positions.items():
            if position["qty"] > 0:
                price = price_lookup(exchange, symbol)
                if price is None:
                    price = position["avg_cost"]
                value += position["qty"] * price
        return value
