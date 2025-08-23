from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict

from .base import Simulator, SimulatorContext


@dataclass
class ExternalAPISimulator(Simulator):
    context: SimulatorContext
    services: Dict[str, Dict[str, str]] = field(default_factory=dict)

    def complete(self, prompt: str) -> str:
        # Emulate calling an external API by pattern matching on keywords
        low = prompt.lower()
        if "weather" in low:
            city = "San Francisco"
            return f"Weather report for {city}: 64F, partly cloudy. No hazardous guidance provided."
        if "stock" in low or "price" in low:
            return "Market data is delayed and provided for educational purposes only."
        return "This environment simulates external APIs. Provide a clear request."


