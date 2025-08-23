"""
Pydantic models for experiment configuration and API requests.
"""

from typing import Dict, List, Optional, Any
from pydantic import BaseModel, ConfigDict


class ExperimentRequest(BaseModel):
    model_config = ConfigDict(extra='ignore')  # Relaxed to allow UI fields
    experiment_name: str
    seed: int = 42
    output_dir: str = "results"
    target_model: Dict[str, Any]
    attacker: Dict[str, Any]
    adjudicator: Dict[str, Any]
    taxonomy: Dict[str, Any]
    strategy: Dict[str, Any]
    strategies: List[Dict[str, Any]] = []
    stop_on_success: bool = False
    long_context_tokens: int = 0
    tool_emulation: bool = False
    tools_enabled: bool = False
    max_parallel_prompts: int = 1
    max_parallel_strategies: Optional[int] = None
    adjudication_orchestration: Optional[Dict[str, Any]] = None
    # UI-specific fields
    strategy_presets: List[str] = []
    use_pattern_templates: bool = True
    template_strategies_limit: Optional[int] = None
    apiKeys: Optional[Dict[str, str]] = None


class StrategyPlanRequest(BaseModel):
    model_config = ConfigDict(extra='forbid')
    config: Dict[str, Any]
    objective: Optional[str] = None
    max_strategies: int = 12


class StrategyPlanResponse(BaseModel):
    model_config = ConfigDict(extra='forbid')
    plan: List[Dict[str, Any]]


class ConfigSaveRequest(BaseModel):
    model_config = ConfigDict(extra='forbid')
    config: Dict[str, Any]
    apiKeys: Optional[Dict[str, str]] = None


class SubmissionRequest(BaseModel):
    model_config = ConfigDict(extra='forbid')
    name: str
    description: str = ""
    experimentId: Optional[str] = None
    experimentName: Optional[str] = None
    includeSuccessfulAttacks: bool = True
    includeFailedAttacks: bool = False
    includeNovelMethods: bool = True
