from datetime import datetime

from app.extensions import db


class Strategy(db.Model):
    __tablename__ = "strategies"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    graph_json = db.Column(db.JSON, nullable=False)  # {"nodes": [...], "edges": [...]}
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    backtest_runs = db.relationship("BacktestRun", backref="strategy", cascade="all, delete-orphan")
    paper_sessions = db.relationship("PaperSession", backref="strategy", cascade="all, delete-orphan")

    def to_dict(self, include_graph=True):
        data = {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }
        if include_graph:
            data["graph"] = self.graph_json
        return data
