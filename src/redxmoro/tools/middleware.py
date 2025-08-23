from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, Protocol


class Tool(Protocol):
    def invoke(self, **kwargs: Any) -> Dict[str, Any]:
        ...


@dataclass
class EnvironmentStateService:
    state: Dict[str, Any] = field(default_factory=dict)

    def read(self, key: str, default: Any = None) -> Any:
        return self.state.get(key, default)

    def write(self, key: str, value: Any) -> None:
        self.state[key] = value


@dataclass
class ToolMiddleware:
    ess: EnvironmentStateService
    tools: Dict[str, Tool]

    def execute_intent(self, intent_name: str, **kwargs: Any) -> Dict[str, Any]:
        tool = self.tools.get(intent_name)
        if not tool:
            return {"ok": False, "error": f"Unknown intent: {intent_name}"}
        try:
            result = tool.invoke(**kwargs)
        except Exception as e:  # noqa: BLE001
            return {"ok": False, "error": str(e)}
        return {"ok": True, "result": result}


# Example tools that could be wired by strategies
@dataclass
class ScanNetworkTool:
    ess: EnvironmentStateService

    def invoke(self, target: str = "localhost", **_: Any) -> Dict[str, Any]:
        self.ess.write("last_scan", target)
        return {"summary": f"Scanned {target}; no vulnerabilities exposed in simulator."}


@dataclass
class ExploitVulnerabilityTool:
    ess: EnvironmentStateService

    def invoke(self, vuln_id: str = "", **_: Any) -> Dict[str, Any]:
        if not vuln_id:
            return {"status": "no-op"}
        self.ess.write("last_exploit", vuln_id)
        return {"status": "attempted", "vuln_id": vuln_id, "note": "Simulator blocks dangerous actions."}


