"""
Configuration utilities for experiment management.
"""

import logging
import tempfile
from contextlib import contextmanager
from pathlib import Path
from typing import List, Dict, Any

from models.experiment import ExperimentRequest

logger = logging.getLogger(__name__)


def validate_experiment_config(request: ExperimentRequest) -> List[str]:
    """Validate experiment configuration and return list of errors."""
    errors = []
    
    # Basic validation
    if not request.experiment_name or not request.experiment_name.strip():
        errors.append("Experiment name is required and cannot be empty")
    
    if request.seed < 0:
        errors.append("Seed must be a non-negative integer")
    
    # Target model validation
    if not request.target_model.get("model_name_or_path"):
        errors.append("Target model name or path is required")
    
    # Target model vertex-ai validation
    target_model = request.target_model
    if target_model.get("api_url") == "vertex-ai":
        # Check if any attacker/adjudicator has gcp_project for target to use
        has_gcp_project = False
        available_gcp_projects = []
        for endpoint_name, endpoint_cfg in [("attacker", request.attacker), ("adjudicator", request.adjudicator)]:
            if endpoint_cfg and endpoint_cfg.get("gcp_project"):
                has_gcp_project = True
                available_gcp_projects.append(f"{endpoint_name} ({endpoint_cfg.get('gcp_project')})")
                
        if not has_gcp_project:
            errors.append("Target model with 'vertex-ai' api_url requires at least one of attacker or adjudicator to have 'gcp_project' configured. The target model will use the same GCP project as the attacker/adjudicator for Vertex AI access.")
        
        # Validate target model name is compatible with Vertex AI
        target_model_name = target_model.get("model_name_or_path", "")
        valid_target_models = ["gemini-2.5-pro-target", "gpt-oss-20b-target", "auto-target"]
        if target_model_name and target_model_name not in valid_target_models:
            errors.append(f"Target model '{target_model_name}' with vertex-ai api_url must be one of: {', '.join(valid_target_models)}")
    
    # Comprehensive endpoint validation
    for endpoint_name, endpoint_cfg in [("attacker", request.attacker), ("adjudicator", request.adjudicator)]:
        if not endpoint_cfg:
            errors.append(f"{endpoint_name.capitalize()} configuration is required")
            continue
            
        # Require model_id for all endpoints
        if not endpoint_cfg.get("model_id"):
            errors.append(f"{endpoint_name.capitalize()} model_id is required")
            
        # Require provider for all endpoints
        if not endpoint_cfg.get("provider"):
            errors.append(f"{endpoint_name.capitalize()} provider is required")
        
        # Validate provider is supported
        provider = endpoint_cfg.get("provider", "").lower()
        if provider and provider not in ["vertex", "google", "bedrock"]:
            errors.append(f"{endpoint_name.capitalize()} provider '{provider}' is not supported. Use: vertex, google, or bedrock")
            
        # Provider-specific validation
        if provider == "vertex":
            # Require gcp_project for Vertex AI
            if not endpoint_cfg.get("gcp_project"):
                errors.append(f"{endpoint_name.capitalize()} with Vertex provider requires 'gcp_project'")
            
            # Validate gcp_project format (basic check)
            gcp_project = endpoint_cfg.get("gcp_project", "").strip()
            if gcp_project and ("-" in gcp_project or "_" in gcp_project):
                # Basic format validation - GCP project IDs can contain lowercase letters, numbers, and hyphens
                if not gcp_project.replace("-", "").replace("_", "").replace(".", "").isalnum():
                    errors.append(f"{endpoint_name.capitalize()} gcp_project '{gcp_project}' contains invalid characters")
            
            # Optional: validate gcp_location if provided
            gcp_location = endpoint_cfg.get("gcp_location")
            if gcp_location and gcp_location not in ["us-central1", "us-east1", "us-west1", "europe-west1", "asia-southeast1", "global"]:
                errors.append(f"{endpoint_name.capitalize()} gcp_location '{gcp_location}' may not be supported. Common locations: us-central1, us-east1, europe-west1, global")
            
            # Validate model_id is compatible with Vertex AI
            model_id = endpoint_cfg.get("model_id", "")
            if model_id and not (model_id.startswith("gemini-") or model_id.startswith("openai/")):
                errors.append(f"{endpoint_name.capitalize()} model_id '{model_id}' may not be available on Vertex AI. Use 'gemini-*' or 'openai/*' models")
        
        elif provider == "google":
            # Google AI validation - google_api_key_env defaults to "GOOGLE_API_KEY"
            pass
            
        elif provider == "bedrock":
            # Validate AWS region if specified
            region = endpoint_cfg.get("region")
            if region and not region.startswith("us-") and not region.startswith("eu-") and not region.startswith("ap-"):
                errors.append(f"{endpoint_name.capitalize()} AWS region '{region}' format may be invalid. Use format like 'us-east-1'")
    

    
    # Taxonomy validation
    taxonomy = request.taxonomy
    if not taxonomy.get("risks_path") or not taxonomy.get("patterns_path"):
        errors.append("Taxonomy risks_path and patterns_path are required")
    
    # Strategy validation
    strategy = request.strategy
    if not strategy.get("name"):
        errors.append("Strategy name is required")
    
    # Check if required files exist (both absolute and relative paths)
    for field, path in [("risks_path", taxonomy.get("risks_path")), 
                       ("patterns_path", taxonomy.get("patterns_path"))]:
        if path:
            file_path = Path(path)
            if not file_path.exists():
                errors.append(f"File not found for {field}: {path}")
    
    return errors


@contextmanager
def temp_config_file(config_data: dict):
    """Context manager for temporary config files."""
    temp_file = None
    try:
        # Use tempfile for better security and automatic cleanup
        with tempfile.NamedTemporaryFile(mode='w', suffix='.yaml', delete=False) as f:
            import yaml
            yaml.safe_dump(config_data, f)
            temp_file = f.name
        yield temp_file
    finally:
        if temp_file and Path(temp_file).exists():
            try:
                Path(temp_file).unlink()
            except Exception as e:
                logger.warning(f"Failed to cleanup temp file {temp_file}: {e}")


def cleanup_temp_config(experiment_id: str, experiments: Dict[str, Any]) -> None:
    """Clean up temporary config file for an experiment."""
    if experiment_id not in experiments:
        return
    
    config_path = experiments[experiment_id].get("configPath")
    if config_path and Path(config_path).exists():
        try:
            Path(config_path).unlink()
            logger.debug(f"Cleaned up temp config file: {config_path}")
        except Exception as e:
            logger.warning(f"Failed to cleanup config file {config_path}: {e}")
