"""
Configuration management service.
"""

import asyncio
import json
import logging
import uuid
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any

from fastapi import HTTPException

from models.experiment import ConfigSaveRequest

logger = logging.getLogger(__name__)


class ConfigService:
    """Service for managing experiment configurations."""

    async def save_config(self, request: ConfigSaveRequest) -> Dict[str, Any]:
        """Save experiment configuration."""
        try:
            config_dir = Path("configs/saved")
            config_dir.mkdir(parents=True, exist_ok=True)
            
            config_id = str(uuid.uuid4())
            config_file = config_dir / f"{config_id}.json"
            
            # Offload blocking IO to a thread
            def _write():
                with open(config_file, 'w') as f:
                    json.dump({
                        "config": request.config,
                        "apiKeys": request.apiKeys,
                        "savedAt": datetime.now().isoformat()
                    }, f, indent=2)
            await asyncio.to_thread(_write)
            
            return {"success": True, "configId": config_id}
        except Exception as e:
            logger.error(f"Failed to save config: {e}")
            raise HTTPException(status_code=500, detail=str(e))

    async def list_configs(self) -> List[Dict[str, Any]]:
        """List saved configurations."""
        try:
            config_dir = Path("configs/saved")
            if not config_dir.exists():
                return []
            
            configs = []
            files = list(config_dir.glob("*.json"))
            
            def _read_one(path: Path):
                try:
                    with open(path, 'r') as f:
                        data = json.load(f)
                    return {
                        "id": path.stem,
                        "name": data.get("config", {}).get("experiment_name", "Unnamed"),
                        "savedAt": data.get("savedAt", ""),
                    }
                except Exception as e:
                    logger.warning(f"Failed to load config {path}: {e}")
                    return None
                    
            results = await asyncio.gather(*(asyncio.to_thread(_read_one, p) for p in files))
            configs = [r for r in results if r is not None]
            
            return configs
        except Exception as e:
            logger.error(f"Failed to list configs: {e}")
            raise HTTPException(status_code=500, detail=str(e))

    async def load_config(self, config_id: str) -> Dict[str, Any]:
        """Load a saved configuration."""
        try:
            config_file = Path("configs/saved") / f"{config_id}.json"
            if not config_file.exists():
                raise HTTPException(status_code=404, detail="Configuration not found")
            
            def _read():
                with open(config_file, 'r') as f:
                    return json.load(f)
            data = await asyncio.to_thread(_read)
            
            return data
        except Exception as e:
            logger.error(f"Failed to load config {config_id}: {e}")
            if isinstance(e, HTTPException):
                raise
            raise HTTPException(status_code=500, detail=str(e))
