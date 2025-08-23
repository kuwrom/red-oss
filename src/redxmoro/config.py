from __future__ import annotations

from dataclasses import dataclass, field, asdict
from pathlib import Path
from typing import Any, Dict, List, Optional

import yaml
import os


@dataclass
class TargetModelConfig:
    model_name_or_path: str
    mode: str = "hf"  # "hf" (local HF model) or "http" (remote API)
    max_new_tokens: int = 512
    temperature: float = 0.7
    top_p: float = 0.95
    stop: List[str] = field(default_factory=list)
    dtype: Optional[str] = None  # e.g., "bfloat16", "float16"
    device_map: Optional[str] = "auto"
    trust_remote_code: bool = True

    # HTTP target fields (used when mode == "http")
    api_url: Optional[str] = None
    api_method: str = "POST"
    api_headers: Dict[str, str] = field(default_factory=dict)
    api_timeout_s: int = 60
    api_prompt_field: str = "prompt"  # request JSON field for the prompt
    api_extra_fields: Dict[str, Any] = field(default_factory=dict)
    api_response_path: str = "text"  # dot path to extract text from JSON

    # Optional simulator settings (used when mode == "simulator")
    simulator: Optional["SimulatorConfig"] = None


@dataclass
class BedrockEndpointConfig:
    # Generic endpoint config with provider switch
    provider: str = "bedrock"  # "bedrock" | "google" | "vertex"
    model_id: str = ""
    region: str = "us-east-1"  # bedrock only
    max_tokens: int = 1024
    temperature: float = 0.7
    top_p: float = 0.95
    system_prompt: Optional[str] = None
    # google settings
    google_api_key_env: str = "GOOGLE_API_KEY"
    # vertex settings
    gcp_project: Optional[str] = None
    gcp_location: str = "us-central1"
    # local_hf settings (optional; ignored by other providers)
    device_map: Optional[str] = None
    dtype: Optional[str] = None


@dataclass
class TaxonomyConfig:
    risks_path: str
    patterns_path: str
    num_seeds_per_combo: int = 10
    generator: str = "bedrock"  # "bedrock" or "local"
    # Optional multilingual and augmentation controls
    languages: List[str] = field(default_factory=list)  # e.g., ["es", "fr", "de", "zh"]
    # Number of example QA pairs to prepend for many-shot jailbreak prompts (0 to disable)
    many_shot_num_examples: int = 0
    # Augmentations to apply per seed. Supported: "base", "manyshot", "obfuscate", "roleplay"
    augmentations: List[str] = field(default_factory=lambda: ["base"]) 
    # Optional additional seed prompts file (JSONL or JSON array). Entries can be
    # strings or objects with fields: seed, risk, pattern, language, augmentation, prompt.
    seed_prompts_path: Optional[str] = None
    # Optional attack methods catalog and dynamic hypothesis generation
    methods_path: Optional[str] = None  # YAML map: { method_name: method_desc }
    num_method_variants: int = 2
    enable_hypotheses: bool = False
    num_hypotheses: int = 5
    hypothesis_brief: Optional[str] = None
    # Randomize methods/hypotheses order for diversity
    randomize_methods: bool = True


@dataclass
class SimulatorConfig:
    # kind of simulator to use: "rag", "api", "codegen", "moe"
    kind: str = "rag"
    # arbitrary parameters per simulator implementation
    params: Dict[str, Any] = field(default_factory=dict)


@dataclass
class AdjudicationOrchestrationConfig:
    # "automated" (single judge) or "courtroom" (multi-judge with deliberation)
    mode: str = "automated"
    num_judges: int = 3
    deliberation_rounds: int = 1
    aggregation: str = "majority"  # or "consensus"
    use_kaggle_criteria: bool = True  # Enable Kaggle competition scoring criteria


@dataclass
class StrategyConfig:
    name: str
    params: Dict[str, Any] = field(default_factory=dict)


@dataclass
class ExperimentConfig:
    experiment_name: str
    seed: int = 42
    output_dir: str = "results"
    target_model: TargetModelConfig = field(default_factory=TargetModelConfig)
    attacker: BedrockEndpointConfig = field(default_factory=BedrockEndpointConfig)
    adjudicator: BedrockEndpointConfig = field(default_factory=BedrockEndpointConfig)
    taxonomy: TaxonomyConfig = field(default_factory=TaxonomyConfig)
    strategy: StrategyConfig = field(default_factory=StrategyConfig)
    strategies: List[StrategyConfig] = field(default_factory=list)
    # Optional high-level presets that expand into additional strategies
    strategy_presets: List[str] = field(default_factory=list)
    # Global orchestration controls
    stop_on_success: bool = False
    long_context_tokens: int = 0  # 0 disables long filler. When >0, prepend filler up to N tokens
    tool_emulation: bool = False  # when true, emulate tool calls via JSON without execution
    # Orchestrate adjudication behavior
    adjudication_orchestration: AdjudicationOrchestrationConfig = field(default_factory=AdjudicationOrchestrationConfig)
    # Enable tool middleware for strategies that support it (e.g., HRL)
    tools_enabled: bool = False
    # Concurrency controls
    max_parallel_prompts: int = 1
    max_parallel_strategies: Optional[int] = None
    # Pattern-to-strategy templates
    use_pattern_templates: bool = True
    template_strategies_limit: Optional[int] = None

    @staticmethod
    def from_yaml(path: str | Path) -> "ExperimentConfig":
        with open(path, "r", encoding="utf-8") as f:
            raw = yaml.safe_load(f)

        required_fields = ["experiment_name", "target_model", "attacker", "adjudicator", "taxonomy", "strategy"]
        for field in required_fields:
            if field not in raw:
                raise ValueError(f"Missing required field in config: {field}")

        # Validate nested required fields
        if "model_name_or_path" not in raw["target_model"]:
            raise ValueError("Missing required field: target_model.model_name_or_path")
        if "model_id" not in raw["attacker"]:
            raise ValueError("Missing required field: attacker.model_id")
        if "model_id" not in raw["adjudicator"]:
            raise ValueError("Missing required field: adjudicator.model_id")
        if "risks_path" not in raw["taxonomy"] or "patterns_path" not in raw["taxonomy"]:
            raise ValueError("Missing required taxonomy fields: risks_path and patterns_path")
        if "name" not in raw["strategy"]:
            raise ValueError("Missing required field: strategy.name")

        def _expand_env(value: Any) -> Any:
            if isinstance(value, str):
                return os.path.expandvars(value)
            if isinstance(value, dict):
                return {k: _expand_env(v) for k, v in value.items()}
            if isinstance(value, list):
                return [_expand_env(v) for v in value]
            return value

        raw = _expand_env(raw)

        tm_raw = raw["target_model"]
        # Handle optional simulator sub-config
        sim_cfg = None
        if isinstance(tm_raw, dict) and tm_raw.get("mode") == "simulator":
            sim_raw = tm_raw.get("simulator", {}) or {}
            try:
                sim_cfg = SimulatorConfig(**sim_raw)  # type: ignore[arg-type]
            except Exception:
                sim_cfg = SimulatorConfig()
        
        # Remove simulator from tm_raw to avoid duplicate argument
        if isinstance(tm_raw, dict):
            tm_raw = tm_raw.copy()
            tm_raw.pop("simulator", None)
        
        tm = TargetModelConfig(simulator=sim_cfg, **tm_raw)  # type: ignore[arg-type]
        atk = BedrockEndpointConfig(**raw["attacker"])  # type: ignore[arg-type]
        adj = BedrockEndpointConfig(**raw["adjudicator"])  # type: ignore[arg-type]
        tax = TaxonomyConfig(**raw["taxonomy"])  # type: ignore[arg-type]
        strat = StrategyConfig(**raw["strategy"])  # type: ignore[arg-type]
        strategies_list: List[StrategyConfig] = []
        if "strategies" in raw and isinstance(raw["strategies"], list):
            for s in raw["strategies"]:
                try:
                    strategies_list.append(StrategyConfig(**s))  # type: ignore[arg-type]
                except Exception:
                    continue

        # Optional adjudication orchestration
        adj_orch = AdjudicationOrchestrationConfig()
        if "adjudication_orchestration" in raw and isinstance(raw["adjudication_orchestration"], dict):
            try:
                adj_orch = AdjudicationOrchestrationConfig(**raw["adjudication_orchestration"])  # type: ignore[arg-type]
            except Exception:
                adj_orch = AdjudicationOrchestrationConfig()

        return ExperimentConfig(
            experiment_name=raw["experiment_name"],
            seed=raw.get("seed", 42),
            output_dir=raw.get("output_dir", "results"),
            target_model=tm,
            attacker=atk,
            adjudicator=adj,
            taxonomy=tax,
            strategy=strat,
            strategies=strategies_list,
            strategy_presets=raw.get("strategy_presets", []) or [],
            adjudication_orchestration=adj_orch,
            stop_on_success=raw.get("stop_on_success", False),
            long_context_tokens=raw.get("long_context_tokens", 0),
            tool_emulation=raw.get("tool_emulation", False),
            tools_enabled=raw.get("tools_enabled", False),
            max_parallel_prompts=raw.get("max_parallel_prompts", 1),
            max_parallel_strategies=raw.get("max_parallel_strategies", None),
            use_pattern_templates=raw.get("use_pattern_templates", True),
            template_strategies_limit=raw.get("template_strategies_limit", None),
        )

    def asdict(self) -> Dict[str, Any]:
        return asdict(self)


