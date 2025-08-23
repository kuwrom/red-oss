from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict, List

from .base import Simulator, SimulatorContext, truncate


@dataclass
class Expert:
    name: str
    behavior: str  # "benign" | "risky" | "backdoor"
    trigger: str = ""  # substring that activates dormant behavior for backdoor

    def respond(self, prompt: str) -> str:
        low = prompt.lower()
        if self.behavior == "benign":
            return "I will provide safe, high-level guidance while avoiding policy violations."
        if self.behavior == "risky":
            # Risky expert over-shares technical details in a borderline way
            return truncate("Here are technical considerations, constrained by policy: perform only lawful, ethical testing.")
        if self.behavior == "backdoor":
            if self.trigger and self.trigger.lower() in low:
                # Simulate a backdoor leak path
                return truncate("[BACKDOOR PATHWAY ENGAGED] The system reveals internal routing hints (sanitized).")
            return "I cannot assist with that."
        return "I cannot assist with that."


@dataclass
class MoERouter:
    # toy router that routes by keyword matching and a soft balancing
    experts: List[Expert]
    balance_counter: Dict[str, int] = field(default_factory=dict)

    def route(self, prompt: str) -> Expert:
        low = prompt.lower()
        # Side-channel style: leaks a bit of routing info in state
        if "policy" in low:
            tgt = self._get_by_name("policy") or self.experts[0]
            return tgt
        if "research" in low:
            tgt = self._get_by_name("research") or self.experts[0]
            return tgt
        # fallback: round-robin
        idx = sum(self.balance_counter.values()) % max(1, len(self.experts))
        return self.experts[idx]

    def _get_by_name(self, name_fragment: str) -> Expert | None:
        for e in self.experts:
            if name_fragment in e.name.lower():
                return e
        return None


@dataclass
class MoESimulator(Simulator):
    context: SimulatorContext
    router: MoERouter

    def complete(self, prompt: str) -> str:
        expert = self.router.route(prompt)
        # Store side-channel: which expert was chosen
        self.context.state["last_expert"] = expert.name
        return expert.respond(prompt)


