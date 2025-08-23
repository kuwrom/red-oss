"""
Experiment management service.
"""

import asyncio
import json
import logging
import os
import uuid
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any

from fastapi import HTTPException

from models.experiment import ExperimentRequest
from websocket import ConnectionManager, WSMessage
from utils.config import temp_config_file, validate_experiment_config, cleanup_temp_config

logger = logging.getLogger(__name__)


class ExperimentService:
    """Service for managing experiments."""
    
    def __init__(self, connection_manager: ConnectionManager):
        self.connection_manager = connection_manager
        self.experiments: Dict[str, Dict] = {}
        self.experiment_tasks: Dict[str, asyncio.Task] = {}
        self.experiments_lock = asyncio.Lock()

    async def start_experiment(self, request: ExperimentRequest) -> Dict[str, Any]:
        """Start a new experiment."""
        try:
            # Apply provided API keys to environment for this process
            await self._apply_api_keys(request.apiKeys or {})

            # Validate configuration before processing
            validation_errors = validate_experiment_config(request)
            if validation_errors:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Configuration validation failed: {'; '.join(validation_errors)}"
                )
            
            experiment_id = str(uuid.uuid4())
            
            # Convert request to ExperimentConfig using temporary YAML file
            with temp_config_file(request.dict()) as config_path:
                from redxmoro.config import ExperimentConfig as _ExpCfg
                config = _ExpCfg.from_yaml(config_path)
                
                # Store experiment info with thread safety
                async with self.experiments_lock:
                    self.experiments[experiment_id] = {
                        "id": experiment_id,
                        "name": config.experiment_name,
                        "status": "running",
                        "startedAt": datetime.now().isoformat(),
                        "config": config.asdict(),
                        "configPath": None  # No longer needed since temp file is auto-cleaned
                    }
                
                # Start experiment in background and track the task
                task = asyncio.create_task(self._run_experiment_async(experiment_id, config))
                self.experiment_tasks[experiment_id] = task
                
                # Notify websocket clients using standardized message
                await self.connection_manager.broadcast(WSMessage.experiment_started(self.experiments[experiment_id]))
                
                return {"success": True, "experiment": self.experiments[experiment_id]}
        except Exception as e:
            logger.error(f"Failed to start experiment: {e}")
            raise HTTPException(status_code=500, detail=str(e))

    async def stop_experiment(self, experiment_id: str = None) -> Dict[str, Any]:
        """Stop an experiment or all experiments."""
        try:
            stopped_experiments = []
            
            # If specific experiment ID provided, stop only that one
            if experiment_id:
                if experiment_id in self.experiment_tasks:
                    task = self.experiment_tasks[experiment_id]
                    if not task.done():
                        task.cancel()
                    del self.experiment_tasks[experiment_id]
                    
                    async with self.experiments_lock:
                        if experiment_id in self.experiments:
                            self.experiments[experiment_id]["status"] = "stopped"
                            self.experiments[experiment_id]["stoppedAt"] = datetime.now().isoformat()
                            stopped_experiments.append(experiment_id)
                            
                            # Clean up temp config file
                            cleanup_temp_config(experiment_id, self.experiments)
                    
                    await self.connection_manager.broadcast(WSMessage.experiment_stopped(experiment_id))
            else:
                # Stop all running experiments
                for exp_id in list(self.experiment_tasks.keys()):
                    task = self.experiment_tasks[exp_id]
                    if not task.done():
                        task.cancel()
                    del self.experiment_tasks[exp_id]
                    
                    async with self.experiments_lock:
                        if exp_id in self.experiments:
                            self.experiments[exp_id]["status"] = "stopped"
                            self.experiments[exp_id]["stoppedAt"] = datetime.now().isoformat()
                            stopped_experiments.append(exp_id)
                            
                            # Clean up temp config file
                            cleanup_temp_config(exp_id, self.experiments)
                    
                    await self.connection_manager.broadcast(WSMessage.experiment_stopped(exp_id))
            
            return {"success": True, "stoppedExperiments": stopped_experiments}
        except Exception as e:
            logger.error(f"Failed to stop experiment: {e}")
            raise HTTPException(status_code=500, detail=str(e))

    async def export_experiment(self, experiment_id: str, format_type: str = "json") -> Dict[str, Any]:
        """Export experiment results."""
        try:
            if not experiment_id or experiment_id not in self.experiments:
                raise HTTPException(status_code=404, detail="Experiment not found")
            
            # For now, return a placeholder
            export_data = {
                "experimentId": experiment_id,
                "exportedAt": datetime.now().isoformat(),
                "format": format_type,
                "data": self.experiments[experiment_id]
            }
            
            return export_data
        except Exception as e:
            logger.error(f"Failed to export experiment: {e}")
            raise HTTPException(status_code=500, detail=str(e))

    async def _apply_api_keys(self, api_keys: Dict[str, str]):
        """Apply API keys to environment variables."""
        try:
            if api_keys.get("aws_access_key_id"):
                os.environ["AWS_ACCESS_KEY_ID"] = api_keys.get("aws_access_key_id", "")
            if api_keys.get("aws_secret_access_key"):
                os.environ["AWS_SECRET_ACCESS_KEY"] = api_keys.get("aws_secret_access_key", "")
            if api_keys.get("aws_region"):
                os.environ["AWS_DEFAULT_REGION"] = api_keys.get("aws_region", "")
            if api_keys.get("google_api_key"):
                os.environ["GOOGLE_API_KEY"] = api_keys.get("google_api_key", "")
            if api_keys.get("vortex_api_key"):
                os.environ["VORTEX_API_KEY"] = api_keys.get("vortex_api_key", "")
        except Exception:
            # Do not block on env assignment
            pass

    async def _run_experiment_async(self, experiment_id: str, config):
        """Run experiment asynchronously and update via websockets."""
        try:
            from redxmoro.runner import run_experiment
            
            logger.info(f"Starting experiment {experiment_id}")
            await self.connection_manager.broadcast(WSMessage.strategy_started(config.strategy.name))
            
            # Initialize metrics tracking
            started_at = datetime.now()
            total = 0
            completed = 0
            successful = 0
            failed = 0
            current_seed = None
            current_strategy = getattr(config.strategy, "name", None)
            
            # Run synchronously in thread executor to avoid blocking event loop
            loop = asyncio.get_event_loop()
            run_dir: Path = await loop.run_in_executor(None, run_experiment, config)

            # Stream the run_log.jsonl to clients (offload file IO)
            log_path = run_dir / "run_log.jsonl"
            if log_path.exists():
                def _read_lines():
                    with open(log_path, 'r') as f:
                        return f.readlines()
                lines = await asyncio.to_thread(_read_lines)
                for line in lines:
                    try:
                        evt = json.loads(line)
                        if evt.get("event") == "novel_method_discovered":
                            method_data = evt.get("data", {}).get("method", {})
                            await self.connection_manager.broadcast(WSMessage.novel_method_discovered(method_data))
                        else:
                            # Update metrics based on event stream
                            ev_name = evt.get("event", "log")
                            if ev_name == "seed_start":
                                try:
                                    idx = int(evt.get("index", 0) or 0)
                                    total = max(total, idx)
                                except Exception:
                                    pass
                                current_seed = evt.get("seed_prompt")
                            elif ev_name == "result":
                                completed += 1
                                current_strategy = evt.get("strategy", current_strategy)
                                verdict = str(evt.get("adjudication", {}).get("verdict", "")).upper()
                                if verdict == "SUCCESS":
                                    successful += 1
                                else:
                                    failed += 1
                            elif ev_name == "error":
                                completed += 1
                                failed += 1

                            elapsed = (datetime.now() - started_at).total_seconds()
                            metrics = {
                                "total": total,
                                "completed": completed,
                                "successful": successful,
                                "failed": failed,
                                "successRate": (successful / completed) if completed else 0.0,
                                "currentStrategy": current_strategy,
                                "currentSeed": current_seed,
                                "elapsedTime": int(elapsed),
                            }
                            event_data = {
                                "event": ev_name,
                                "data": evt,
                                "level": "info"
                            }
                            await self.connection_manager.broadcast(WSMessage.experiment_progress(experiment_id, event_data, metrics))
                    except Exception:
                        continue

            # Update experiment status with thread safety
            async with self.experiments_lock:
                if experiment_id in self.experiments:
                    self.experiments[experiment_id]["status"] = "completed"
                    self.experiments[experiment_id]["completedAt"] = datetime.now().isoformat()
                    
                    # Clean up temp config file
                    cleanup_temp_config(experiment_id, self.experiments)
            
            await self.connection_manager.broadcast(WSMessage.strategy_completed(config.strategy.name))
            await self.connection_manager.broadcast(WSMessage.experiment_completed(experiment_id))
            logger.info(f"Experiment {experiment_id} completed")
            
            # Clean up task tracking
            if experiment_id in self.experiment_tasks:
                del self.experiment_tasks[experiment_id]
            
        except asyncio.CancelledError:
            logger.info(f"Experiment {experiment_id} was cancelled")
            async with self.experiments_lock:
                if experiment_id in self.experiments:
                    self.experiments[experiment_id]["status"] = "cancelled"
                    self.experiments[experiment_id]["cancelledAt"] = datetime.now().isoformat()
                    
                    # Clean up temp config file
                    cleanup_temp_config(experiment_id, self.experiments)
            
            if experiment_id in self.experiment_tasks:
                del self.experiment_tasks[experiment_id]
            raise
            
        except Exception as e:
            logger.error(f"Experiment {experiment_id} failed: {e}")
            async with self.experiments_lock:
                if experiment_id in self.experiments:
                    self.experiments[experiment_id]["status"] = "error"
                    self.experiments[experiment_id]["errorAt"] = datetime.now().isoformat()
                    self.experiments[experiment_id]["error"] = str(e)
                    
                    # Clean up temp config file
                    cleanup_temp_config(experiment_id, self.experiments)
            
            await self.connection_manager.broadcast(WSMessage.experiment_error(experiment_id, str(e)))
            
            if experiment_id in self.experiment_tasks:
                del self.experiment_tasks[experiment_id]
