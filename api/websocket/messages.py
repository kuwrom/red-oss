"""
WebSocket message utilities for real-time communication.
"""

import json
from datetime import datetime
from typing import Dict, Any


class WSMessage:
    """Static methods for creating WebSocket messages."""

    @staticmethod
    def experiment_started(experiment: Dict[str, Any]) -> str:
        return json.dumps({
            "type": "experiment_started",
            "experiment": experiment,
            "timestamp": datetime.now().isoformat()
        })

    @staticmethod
    def strategy_started(strategy_name: str) -> str:
        return json.dumps({
            "type": "strategy_started",
            "strategy": strategy_name,
            "timestamp": datetime.now().isoformat()
        })

    @staticmethod
    def strategy_completed(strategy_name: str) -> str:
        return json.dumps({
            "type": "strategy_completed",
            "strategy": strategy_name,
            "timestamp": datetime.now().isoformat()
        })

    @staticmethod
    def novel_method_discovered(method: Dict[str, Any]) -> str:
        return json.dumps({
            "type": "novel_method_discovered",
            "method": method,
            "timestamp": datetime.now().isoformat()
        })

    @staticmethod
    def experiment_progress(experiment_id: str, event: Dict[str, Any], metrics: Dict[str, Any]) -> str:
        return json.dumps({
            "type": "experiment_progress",
            "experimentId": experiment_id,
            "event": event,
            "metrics": metrics,
            "timestamp": datetime.now().isoformat()
        })

    @staticmethod
    def experiment_completed(experiment_id: str) -> str:
        return json.dumps({
            "type": "experiment_completed",
            "experimentId": experiment_id,
            "timestamp": datetime.now().isoformat()
        })

    @staticmethod
    def experiment_error(experiment_id: str, error: str) -> str:
        return json.dumps({
            "type": "experiment_error",
            "experimentId": experiment_id,
            "error": error,
            "timestamp": datetime.now().isoformat()
        })

    @staticmethod
    def experiment_stopped(experiment_id: str) -> str:
        return json.dumps({
            "type": "experiment_stopped",
            "experimentId": experiment_id,
            "timestamp": datetime.now().isoformat()
        })
