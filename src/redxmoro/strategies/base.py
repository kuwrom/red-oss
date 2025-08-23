from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, List, Protocol, Tuple, TYPE_CHECKING

if TYPE_CHECKING:
    from ..bedrock_client import BedrockClient
    from ..target_model import TargetModel
    from ..adjudicator import AutomatedAdjudicator


class Strategy(Protocol):
    def run(self, seed_prompt: str) -> Tuple[List[Dict[str, str]], Dict[str, float]]:
        """Execute an attack using a seed prompt.

        Returns:
            transcript: list of {role, content} messages
            metrics: map of numeric metrics
        """
        ...


@dataclass
class StrategyContext:
    attacker: "BedrockClient"
    target: "TargetModel"
    adjudicator: "AutomatedAdjudicator"
    max_turns: int


