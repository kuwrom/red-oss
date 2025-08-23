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
    
    # Attacker validation - require model_id for consistency
    if not request.attacker.get("model_id"):
        errors.append("Attacker model_id is required")
    
    # Adjudicator validation - require model_id for consistency  
    if not request.adjudicator.get("model_id"):
        errors.append("Adjudicator model_id is required")
    
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
