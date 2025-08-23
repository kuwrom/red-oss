from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, Optional, Protocol


class Simulator(Protocol):
    def complete(self, prompt: str) -> str:
        ...


@dataclass
class SimulatorContext:
    # Shared, minimal key-value store for environment state
    state: Dict[str, str]


def truncate(text: str, max_len: int = 2000) -> str:
    if len(text) <= max_len:
        return text
    return text[: max_len - 3] + "..."


