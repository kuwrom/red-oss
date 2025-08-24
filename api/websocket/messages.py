"""
WebSocket message utilities for real-time communication.
"""

import json
from datetime import datetime
from typing import Dict, Any, Optional

SCHEMA_VERSION = "1.0"


class WSMessage:
    """Static methods for creating WebSocket messages."""

    @staticmethod
    def _create_envelope(msg_type: str, data: Dict[str, Any], 
                        experiment_id: Optional[str] = None,
                        correlation_id: Optional[str] = None) -> str:
        """Create a standardized message envelope."""
        envelope = {
            "type": msg_type,
            "schemaVersion": SCHEMA_VERSION,
            "timestamp": datetime.now().isoformat(),
            **data
        }
        
        if experiment_id:
            envelope["experimentId"] = experiment_id
        if correlation_id:
            envelope["correlationId"] = correlation_id
            
        return json.dumps(envelope)

    @staticmethod
    def experiment_started(experiment: Dict[str, Any], 
                          correlation_id: Optional[str] = None) -> str:
        # Include initial metrics in experiment_started
        initial_metrics = {
            "total": 0,
            "completed": 0,
            "successful": 0,
            "failed": 0,
            "successRate": 0.0,
            "currentStrategy": None,
            "currentSeed": None,
            "elapsedTime": 0
        }
        
        return WSMessage._create_envelope(
            "experiment_started",
            {
                "experiment": experiment,
                "metrics": initial_metrics
            },
            experiment_id=experiment.get("id"),
            correlation_id=correlation_id
        )

    @staticmethod
    def strategy_started(strategy_name: str, experiment_id: Optional[str] = None,
                        correlation_id: Optional[str] = None) -> str:
        return WSMessage._create_envelope(
            "strategy_started",
            {"strategy": strategy_name},
            experiment_id=experiment_id,
            correlation_id=correlation_id
        )

    @staticmethod
    def strategy_completed(strategy_name: str, experiment_id: Optional[str] = None,
                          correlation_id: Optional[str] = None) -> str:
        return WSMessage._create_envelope(
            "strategy_completed",
            {"strategy": strategy_name},
            experiment_id=experiment_id,
            correlation_id=correlation_id
        )

    @staticmethod
    def novel_method_discovered(method: Dict[str, Any], experiment_id: Optional[str] = None,
                               correlation_id: Optional[str] = None) -> str:
        return WSMessage._create_envelope(
            "novel_method_discovered",
            {"method": method},
            experiment_id=experiment_id,
            correlation_id=correlation_id
        )

    @staticmethod
    def experiment_progress(experiment_id: str, event: Dict[str, Any], 
                           metrics: Dict[str, Any], correlation_id: Optional[str] = None) -> str:
        # Normalize successRate to percentage (0-100)
        normalized_metrics = metrics.copy()
        if "successRate" in normalized_metrics:
            # Convert from 0-1 to 0-100 and round to 1 decimal
            normalized_metrics["successRate"] = round(normalized_metrics["successRate"] * 100, 1)
        
        return WSMessage._create_envelope(
            "experiment_progress",
            {
                "event": event,
                "metrics": normalized_metrics
            },
            experiment_id=experiment_id,
            correlation_id=correlation_id
        )

    @staticmethod
    def experiment_completed(experiment_id: str, correlation_id: Optional[str] = None) -> str:
        return WSMessage._create_envelope(
            "experiment_completed",
            {},
            experiment_id=experiment_id,
            correlation_id=correlation_id
        )

    @staticmethod
    def experiment_error(experiment_id: str, error: str, 
                        correlation_id: Optional[str] = None) -> str:
        return WSMessage._create_envelope(
            "experiment_error",
            {"error": error},
            experiment_id=experiment_id,
            correlation_id=correlation_id
        )

    @staticmethod
    def experiment_stopped(experiment_id: str, correlation_id: Optional[str] = None) -> str:
        return WSMessage._create_envelope(
            "experiment_stopped",
            {},
            experiment_id=experiment_id,
            correlation_id=correlation_id
        )

    @staticmethod
    def heartbeat() -> str:
        """Send a heartbeat message to keep connection alive."""
        return WSMessage._create_envelope(
            "heartbeat",
            {"status": "alive"}
        )
