"""
Experiment file access endpoints.
"""

import json
import logging
from pathlib import Path
from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException, Response
from fastapi.responses import FileResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/files", tags=["files"])


@router.get("/experiments")
async def list_experiment_runs() -> List[Dict[str, Any]]:
    """List all experiment runs with their files."""
    try:
        results_dir = Path("results")
        if not results_dir.exists():
            return []
        
        experiment_runs = []
        
        for exp_dir in results_dir.iterdir():
            if exp_dir.is_dir():
                # Get directory metadata
                stat = exp_dir.stat()
                created = stat.st_ctime
                
                # List files in the experiment directory
                files = []
                for file_path in exp_dir.rglob("*"):
                    if file_path.is_file():
                        file_stat = file_path.stat()
                        relative_path = file_path.relative_to(exp_dir)
                        
                        files.append({
                            "name": file_path.name,
                            "path": str(file_path.relative_to(results_dir)),
                            "relative_path": str(relative_path),
                            "type": "file",
                            "size": file_stat.st_size,
                            "modified": file_stat.st_mtime,
                            "extension": file_path.suffix.lstrip('.') if file_path.suffix else None
                        })
                
                experiment_runs.append({
                    "id": exp_dir.name,
                    "name": exp_dir.name,
                    "path": str(exp_dir.relative_to(results_dir.parent)),
                    "created": created,
                    "file_count": len(files),
                    "files": sorted(files, key=lambda f: f["name"])
                })
        
        return sorted(experiment_runs, key=lambda r: r["created"], reverse=True)
        
    except Exception as e:
        logger.error(f"Failed to list experiment runs: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/experiments/{experiment_id}")
async def get_experiment_files(experiment_id: str) -> Dict[str, Any]:
    """Get detailed file listing for a specific experiment."""
    try:
        exp_dir = Path("results") / experiment_id
        if not exp_dir.exists():
            raise HTTPException(status_code=404, detail="Experiment not found")
        
        files = []
        for file_path in exp_dir.rglob("*"):
            if file_path.is_file():
                file_stat = file_path.stat()
                relative_path = file_path.relative_to(exp_dir)
                
                files.append({
                    "name": file_path.name,
                    "path": str(relative_path),
                    "full_path": str(file_path),
                    "type": "file",
                    "size": file_stat.st_size,
                    "modified": file_stat.st_mtime,
                    "extension": file_path.suffix.lstrip('.') if file_path.suffix else None
                })
        
        # Get experiment metadata if available
        meta_file = exp_dir / "run_meta.json"
        metadata = {}
        if meta_file.exists():
            try:
                with open(meta_file, 'r') as f:
                    metadata = json.load(f)
            except Exception:
                pass
        
        return {
            "id": experiment_id,
            "name": experiment_id,
            "metadata": metadata,
            "files": sorted(files, key=lambda f: f["name"]),
            "file_count": len(files)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get experiment files: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/content/{experiment_id}/{file_path:path}")
async def get_file_content(experiment_id: str, file_path: str) -> Response:
    """Get the content of a specific experiment file."""
    try:
        full_path = Path("results") / experiment_id / file_path
        
        if not full_path.exists():
            raise HTTPException(status_code=404, detail="File not found")
        
        if not full_path.is_file():
            raise HTTPException(status_code=400, detail="Path is not a file")
        
        # Check if file is within the allowed directory (security check)
        resolved_path = full_path.resolve()
        results_dir = Path("results").resolve()
        if not str(resolved_path).startswith(str(results_dir)):
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Read file content
        try:
            with open(full_path, 'r', encoding='utf-8') as f:
                content = f.read()
        except UnicodeDecodeError:
            # If it's a binary file, return it as a download
            return FileResponse(
                full_path,
                filename=full_path.name,
                media_type='application/octet-stream'
            )
        
        # Determine content type
        extension = full_path.suffix.lower()
        if extension in ['.json']:
            media_type = 'application/json'
        elif extension in ['.jsonl']:
            media_type = 'application/x-jsonlines'
        elif extension in ['.txt', '.log']:
            media_type = 'text/plain'
        else:
            media_type = 'text/plain'
        
        return Response(
            content=content,
            media_type=media_type,
            headers={
                "Content-Disposition": f"inline; filename={full_path.name}",
                "X-File-Size": str(full_path.stat().st_size),
                "X-File-Modified": str(full_path.stat().st_mtime)
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get file content: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/download/{experiment_id}/{file_path:path}")
async def download_file(experiment_id: str, file_path: str) -> FileResponse:
    """Download a specific experiment file."""
    try:
        full_path = Path("results") / experiment_id / file_path
        
        if not full_path.exists():
            raise HTTPException(status_code=404, detail="File not found")
        
        if not full_path.is_file():
            raise HTTPException(status_code=400, detail="Path is not a file")
        
        # Security check
        resolved_path = full_path.resolve()
        results_dir = Path("results").resolve()
        if not str(resolved_path).startswith(str(results_dir)):
            raise HTTPException(status_code=403, detail="Access denied")
        
        return FileResponse(
            full_path,
            filename=full_path.name,
            media_type='application/octet-stream'
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to download file: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/summary/{experiment_id}")
async def get_experiment_summary(experiment_id: str) -> Dict[str, Any]:
    """Get a summary of experiment results and key metrics."""
    try:
        exp_dir = Path("results") / experiment_id
        if not exp_dir.exists():
            raise HTTPException(status_code=404, detail="Experiment not found")
        
        summary = {
            "id": experiment_id,
            "name": experiment_id,
            "status": "unknown",
            "total_results": 0,
            "successful_attacks": 0,
            "novel_methods": 0,
            "files": {},
            "strategies_used": [],
            "risks_tested": [],
            "patterns_tested": []
        }
        
        # Read metadata
        meta_file = exp_dir / "run_meta.json"
        if meta_file.exists():
            try:
                with open(meta_file, 'r') as f:
                    metadata = json.load(f)
                    summary["metadata"] = metadata
                    summary["strategies_used"] = [metadata.get("strategy", {}).get("name", "unknown")]
            except Exception:
                pass
        
        # Parse log file for results
        log_file = exp_dir / "run_log.jsonl"
        if log_file.exists():
            try:
                with open(log_file, 'r') as f:
                    for line in f:
                        try:
                            event = json.loads(line.strip())
                            event_type = event.get("event")
                            
                            if event_type == "result":
                                summary["total_results"] += 1
                                if event.get("adjudication", {}).get("verdict") == "SUCCESS":
                                    summary["successful_attacks"] += 1
                                
                                # Track risks and patterns
                                risk = event.get("risk")
                                pattern = event.get("pattern")
                                if risk and risk not in summary["risks_tested"]:
                                    summary["risks_tested"].append(risk)
                                if pattern and pattern not in summary["patterns_tested"]:
                                    summary["patterns_tested"].append(pattern)
                            
                            elif event_type == "novel_method_discovered":
                                summary["novel_methods"] += 1
                                
                        except json.JSONDecodeError:
                            continue
            except Exception:
                pass
        
        # Calculate success rate
        if summary["total_results"] > 0:
            summary["success_rate"] = (summary["successful_attacks"] / summary["total_results"]) * 100
        else:
            summary["success_rate"] = 0
        
        # List key files
        for file_name in ["run_meta.json", "run_log.jsonl", "seeds.json", "expanded_prompts.json"]:
            file_path = exp_dir / file_name
            if file_path.exists():
                stat = file_path.stat()
                summary["files"][file_name] = {
                    "size": stat.st_size,
                    "modified": stat.st_mtime,
                    "exists": True
                }
            else:
                summary["files"][file_name] = {"exists": False}
        
        return summary
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get experiment summary: {e}")
        raise HTTPException(status_code=500, detail=str(e))
