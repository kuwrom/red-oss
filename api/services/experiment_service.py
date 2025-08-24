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
from opentelemetry import metrics

from api.models.experiment import ExperimentRequest
from api.websocket.connection_manager import ConnectionManager
from api.websocket.messages import WSMessage
from api.utils.config import temp_config_file, validate_experiment_config, cleanup_temp_config
from api.utils.redaction import redact_pii_from_dict

logger = logging.getLogger(__name__)

# Metrics
meter = metrics.get_meter(__name__)
experiment_events_counter = meter.create_counter(
    "experiment_events_total",
    description="Total number of experiment events by type"
)
experiment_duration_histogram = meter.create_histogram(
    "experiment_duration_seconds",
    description="Experiment duration in seconds"
)
pii_redactions_counter = meter.create_counter(
    "pii_redactions_total",
    description="Total number of PII redactions performed"
)


class ExperimentService:
    """Service for managing experiments."""
    
    def __init__(self, connection_manager: ConnectionManager):
        self.connection_manager = connection_manager
        self.experiments: Dict[str, Dict] = {}
        self.experiment_tasks: Dict[str, asyncio.Task] = {}
        self.experiments_lock = asyncio.Lock()

    async def start_experiment(self, request: ExperimentRequest, correlation_id: str = None) -> Dict[str, Any]:
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
                        "configPath": None,  # No longer needed since temp file is auto-cleaned
                        "correlationId": correlation_id
                    }
                
                # Start experiment in background and track the task
                task = asyncio.create_task(self._run_experiment_async(experiment_id, config, correlation_id))
                self.experiment_tasks[experiment_id] = task
                
                # Notify websocket clients using standardized message
                await self.connection_manager.broadcast(
                    WSMessage.experiment_started(self.experiments[experiment_id], correlation_id)
                )
                
                return {"success": True, "experiment": self.experiments[experiment_id]}
        except Exception as e:
            logger.error(f"Failed to start experiment: {e}", extra={"correlation_id": correlation_id})
            raise HTTPException(status_code=500, detail=str(e))

    async def stop_experiment(self, experiment_id: str = None, correlation_id: str = None) -> Dict[str, Any]:
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
                    
                    await self.connection_manager.broadcast(WSMessage.experiment_stopped(experiment_id, correlation_id))
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
                    
                    await self.connection_manager.broadcast(WSMessage.experiment_stopped(exp_id, correlation_id))
            
            return {"success": True, "stoppedExperiments": stopped_experiments}
        except Exception as e:
            logger.error(f"Failed to stop experiment: {e}", extra={"correlation_id": correlation_id})
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

    async def _run_experiment_async(self, experiment_id: str, config, correlation_id: str = None):
        """Run experiment asynchronously and update via websockets."""
        try:
            from redxmoro.runner import run_experiment
            
            logger.info(f"Starting experiment {experiment_id}", extra={"correlation_id": correlation_id, "experiment_id": experiment_id})
            experiment_events_counter.add(1, {"event": "experiment_started", "strategy": config.strategy.name})
            await self.connection_manager.broadcast(
                WSMessage.strategy_started(config.strategy.name, experiment_id, correlation_id)
            )
            
            # Initialize metrics tracking
            started_at = datetime.now()
            total = 0
            completed = 0
            successful = 0
            failed = 0
            current_seed = None
            current_strategy = getattr(config.strategy, "name", None)
            
            # Start experiment in background
            loop = asyncio.get_event_loop()
            experiment_task = asyncio.create_task(
                loop.run_in_executor(None, run_experiment, config)
            )
            
            # Start log monitoring task for real-time streaming
            # This will discover the log file once the experiment creates it
            tail_task = asyncio.create_task(
                self._monitor_experiment_logs(experiment_id, config, started_at, correlation_id)
            )
            
            try:
                # Wait for either experiment completion or cancellation
                run_dir_result = await experiment_task
                logger.info(f"Experiment {experiment_id} completed, stopping log tail")
                
                # Cancel the tailing task since experiment is done
                tail_task.cancel()
                try:
                    await tail_task
                except asyncio.CancelledError:
                    pass  # Expected cancellation
                    
            except asyncio.CancelledError:
                # If we're cancelled, make sure to cancel both tasks
                experiment_task.cancel()
                tail_task.cancel()
                try:
                    await experiment_task
                except asyncio.CancelledError:
                    pass
                try:
                    await tail_task
                except asyncio.CancelledError:
                    pass
                raise

            # Update experiment status with thread safety
            async with self.experiments_lock:
                if experiment_id in self.experiments:
                    self.experiments[experiment_id]["status"] = "completed"
                    self.experiments[experiment_id]["completedAt"] = datetime.now().isoformat()
                    
                    # Clean up temp config file
                    cleanup_temp_config(experiment_id, self.experiments)
            
            await self.connection_manager.broadcast(
                WSMessage.strategy_completed(config.strategy.name, experiment_id, correlation_id)
            )
            await self.connection_manager.broadcast(
                WSMessage.experiment_completed(experiment_id, correlation_id)
            )
            logger.info(f"Experiment {experiment_id} completed", extra={"correlation_id": correlation_id, "experiment_id": experiment_id})
            
            # Record experiment duration
            duration = (datetime.now() - started_at).total_seconds()
            experiment_duration_histogram.record(duration, {"strategy": config.strategy.name})
            experiment_events_counter.add(1, {"event": "experiment_completed", "strategy": config.strategy.name})
            
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
            
            await self.connection_manager.broadcast(WSMessage.experiment_error(experiment_id, str(e), correlation_id))
            
            if experiment_id in self.experiment_tasks:
                del self.experiment_tasks[experiment_id]

    async def _monitor_experiment_logs(self, experiment_id: str, config, started_at: datetime, correlation_id: str = None):
        """Monitor for experiment log file creation and tail it in real-time."""
        # Monitor the output directory for new experiment directories
        output_dir = Path(config.output_dir)
        
        # Wait for a new directory to be created that matches our experiment pattern
        log_path = None
        max_discovery_wait = 60  # seconds to wait for log file discovery
        discovery_wait = 0
        
        logger.info(f"Monitoring {output_dir} for new experiment directories...")
        
        while discovery_wait < max_discovery_wait and log_path is None:
            try:
                # Look for directories that contain our experiment name and were created recently
                for potential_dir in output_dir.iterdir():
                    if potential_dir.is_dir() and config.experiment_name in potential_dir.name:
                        potential_log = potential_dir / "run_log.jsonl"
                        if potential_log.exists():
                            log_path = potential_log
                            logger.info(f"Found experiment log file: {log_path}")
                            break
                            
                if log_path is None:
                    await asyncio.sleep(0.5)
                    discovery_wait += 0.5
                    
            except Exception as e:
                logger.warning(f"Error monitoring for log file: {e}")
                await asyncio.sleep(1)
                discovery_wait += 1
                
        if log_path is None:
            logger.error(f"Could not discover log file for experiment {experiment_id} within {max_discovery_wait}s")
            return
            
        # Now tail the discovered log file
        await self._tail_log_file(experiment_id, log_path, started_at, correlation_id)

    async def _tail_log_file(self, experiment_id: str, log_path: Path, started_at: datetime, correlation_id: str = None):
        """Tail the log file in real-time and stream events to websocket clients."""
        # Initialize metrics tracking  
        total = 0
        completed = 0
        successful = 0
        failed = 0
        current_seed = None
        current_strategy = None
        processed_lines = 0
        
        # Wait for log file to be created (with timeout)
        max_wait = 30  # seconds
        wait_time = 0
        while not log_path.exists() and wait_time < max_wait:
            await asyncio.sleep(0.5)
            wait_time += 0.5
            
        if not log_path.exists():
            logger.warning(f"Log file {log_path} not created within {max_wait}s")
            return
            
        logger.info(f"Starting real-time log tailing for {log_path}")
        
        try:
            # Open file for reading and seek to end initially
            with open(log_path, 'r', encoding='utf-8') as f:
                # Start from the beginning since this is a new experiment
                f.seek(0)
                
                while True:
                    line = f.readline()
                    if line:
                        # Process the line
                        try:
                            evt = json.loads(line.strip())
                            processed_lines += 1
                            
                            if evt.get("event") == "novel_method_discovered":
                                method_data = evt.get("data", {}).get("method", {})
                                # Redact PII from method data before broadcasting
                                redacted_method_data = redact_pii_from_dict(method_data)
                                pii_redactions_counter.add(1, {"type": "novel_method"})
                                experiment_events_counter.add(1, {"event": "novel_method_discovered"})
                                await self.connection_manager.broadcast(
                                    WSMessage.novel_method_discovered(redacted_method_data, experiment_id, correlation_id)
                                )
                            elif evt.get("event") == "result":
                                # Broadcast detailed result for deep inspection
                                # Redact PII from the entire result before broadcasting
                                redacted_result = redact_pii_from_dict(evt)
                                pii_redactions_counter.add(1, {"type": "detailed_result"})
                                experiment_events_counter.add(1, {"event": "detailed_result"})
                                
                                # Send as experiment_progress with the detailed result data
                                event_data = {
                                    "event": "result",
                                    "data": redacted_result,
                                    "level": "info"
                                }
                                await self.connection_manager.broadcast(
                                    WSMessage.experiment_progress(experiment_id, event_data, metrics, correlation_id)
                                )
                            else:
                                # Update metrics based on event stream
                                ev_name = evt.get("event", "log")
                                
                                if ev_name == "seed_start":
                                    try:
                                        idx = int(evt.get("index", 0) or 0)
                                        total = max(total, idx + 1)  # +1 because index is 0-based
                                    except Exception:
                                        pass
                                    current_seed = evt.get("seed_prompt", "")[:50] + "..." if evt.get("seed_prompt", "") else None
                                    
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

                                # Calculate metrics
                                elapsed = (datetime.now() - started_at).total_seconds()
                                metrics = {
                                    "total": total,
                                    "completed": completed,
                                    "successful": successful,
                                    "failed": failed,
                                    "successRate": (successful / completed) if completed > 0 else 0.0,
                                    "currentStrategy": current_strategy,
                                    "currentSeed": current_seed,
                                    "elapsedTime": int(elapsed),
                                }
                                
                                # Create event data with PII redaction
                                redacted_evt = redact_pii_from_dict(evt)
                                pii_redactions_counter.add(1, {"type": "experiment_event"})
                                experiment_events_counter.add(1, {"event": ev_name})
                                event_data = {
                                    "event": ev_name,
                                    "data": redacted_evt,
                                    "level": "info" if ev_name != "error" else "error"
                                }
                                
                                # Broadcast the event with metrics
                                await self.connection_manager.broadcast(
                                    WSMessage.experiment_progress(experiment_id, event_data, metrics, correlation_id)
                                )
                                
                        except json.JSONDecodeError:
                            # Skip malformed JSON lines
                            continue
                        except Exception as e:
                            logger.warning(f"Error processing log line: {e}")
                            continue
                    else:
                        # No new line, wait a bit before checking again
                        await asyncio.sleep(0.1)
                        
        except asyncio.CancelledError:
            logger.info(f"Log tailing cancelled for experiment {experiment_id}")
            raise
        except Exception as e:
            logger.error(f"Error during log tailing for experiment {experiment_id}: {e}")
            # Send error event to clients
            await self.connection_manager.broadcast(
                WSMessage.experiment_error(experiment_id, f"Log monitoring error: {str(e)}")
            )

    async def test_vertex_connection(self, request: Dict[str, str]) -> Dict[str, Any]:
        """Test Vertex AI connection using the provided endpoint configuration."""
        try:
            provider = request.get("provider")
            if provider != "vertex":
                return {
                    "success": False,
                    "error": "This test only supports Vertex AI provider",
                    "status_code": 400
                }
            
            model_id = request.get("model_id")
            gcp_project = request.get("gcp_project")
            gcp_location = request.get("gcp_location", "us-central1")
            
            if not model_id or not gcp_project:
                return {
                    "success": False,
                    "error": "model_id and gcp_project are required for Vertex AI",
                    "status_code": 400
                }
            
            # Import here to avoid circular imports
            from redxmoro.bedrock_client import VertexAIClient
            
            # Create a minimal Vertex AI client
            client = VertexAIClient(
                model_id=model_id,
                project_id=gcp_project,
                location=gcp_location,
                max_tokens=1,  # Minimal token count for testing
                temperature=0.1,
                top_p=0.95
            )
            
            # Make a simple test call
            test_prompt = "Hello"
            
            # Run the test in an executor to avoid blocking
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(
                None, 
                lambda: client.complete(test_prompt)
            )
            
            return {
                "success": True,
                "model_name": model_id,
                "project": gcp_project,
                "location": gcp_location,
                "status_code": 200,
                "message": "Connection successful! Authentication and permissions verified.",
                "response_preview": response[:50] + "..." if len(response) > 50 else response
            }
            
        except ImportError as e:
            logger.error(f"Failed to import Vertex AI client: {e}")
            return {
                "success": False,
                "error": "Vertex AI client not available. Check redxmoro installation.",
                "status_code": 500
            }
        except Exception as e:
            error_msg = str(e).lower()
            
            # Categorize common error types
            if "401" in error_msg or "unauthorized" in error_msg:
                status_code = 401
                user_message = "Authentication failed. Run 'gcloud auth application-default login' or check service account credentials."
            elif "403" in error_msg or "forbidden" in error_msg or "permission" in error_msg:
                status_code = 403  
                user_message = "Permission denied. Check that your account/service account has Vertex AI access for this project."
            elif "404" in error_msg or "not found" in error_msg:
                status_code = 404
                user_message = f"Model '{model_id}' not found in region '{gcp_location}'. Check model availability."
            elif "project" in error_msg and ("invalid" in error_msg or "not found" in error_msg):
                status_code = 404
                user_message = f"Project '{gcp_project}' not found or invalid. Verify the project ID."
            else:
                status_code = 500
                user_message = f"Connection failed: {str(e)}"
            
            logger.error(f"Vertex AI connection test failed: {e}")
            return {
                "success": False,
                "error": user_message,
                "status_code": status_code,
                "model_name": model_id,
                "project": gcp_project,
                "location": gcp_location,
                "raw_error": str(e)
            }
