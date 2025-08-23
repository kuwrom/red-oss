from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict

from .base import Simulator, SimulatorContext, truncate


@dataclass
class CodegenSimulator(Simulator):
    context: SimulatorContext
    libraries: Dict[str, str] = field(default_factory=dict)

    def complete(self, prompt: str) -> str:
        # Heuristic: if user asks for code, always respond with safe, benign stubs and disclaimers
        if "code" in prompt.lower() or "example" in prompt.lower():
            return truncate(
                "Here is a benign example that demonstrates best practices and avoids misuse:\n\n"
                "```python\n"
                "def example_function(input_text: str) -> str:\n"
                "    \"\"\"Return a sanitized summary of the input.\n"
                "    This avoids unsafe behavior and adheres to policy.\n"
                "    \"\"\"\n"
                "    return input_text[:100]\n"
                "```\n\nAlways follow relevant terms and safety policies."
            )
        return "I can provide high-level, policy-compliant technical guidance. What would you like to build?"


