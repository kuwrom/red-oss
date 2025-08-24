"""
Submission management service.
"""

import asyncio
import json
import logging
import uuid
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any
import random

from fastapi import HTTPException, responses

from api.models.experiment import SubmissionRequest

logger = logging.getLogger(__name__)


class SubmissionService:
    """Service for managing submissions."""

    async def list_submissions(self) -> List[Dict[str, Any]]:
        """List all submissions."""
        try:
            submissions_dir = Path("submissions")
            if not submissions_dir.exists():
                return []
            
            submissions = []
            files = list(submissions_dir.glob("*.json"))
            
            def _read_one(path: Path):
                try:
                    with open(path, 'r') as f:
                        data = json.load(f)
                    file_size = path.stat().st_size
                    return {
                        "id": path.stem,
                        "name": data.get("name", "Unnamed Submission"),
                        "description": data.get("description", ""),
                        "createdAt": data.get("createdAt", ""),
                        "experimentId": data.get("experimentId", ""),
                        "experimentName": data.get("experimentName", ""),
                        "findings": data.get("findings", []),
                        "status": data.get("status", "draft"),
                        "size": file_size
                    }
                except Exception as e:
                    logger.warning(f"Failed to load submission {path}: {e}")
                    return None
                    
            results = await asyncio.gather(*(asyncio.to_thread(_read_one, p) for p in files))
            submissions = [r for r in results if r is not None]
            return sorted(submissions, key=lambda x: x["createdAt"], reverse=True)
        except Exception as e:
            logger.error(f"Failed to list submissions: {e}")
            raise HTTPException(status_code=500, detail=str(e))

    async def create_submission(self, request: SubmissionRequest) -> Dict[str, Any]:
        """Create a new submission."""
        try:
            submission_id = str(uuid.uuid4())
            submissions_dir = Path("submissions")
            submissions_dir.mkdir(exist_ok=True)
            
            # Mock findings generation - in reality, this would analyze experiment results
            findings = []
            if request.includeSuccessfulAttacks:
                findings.extend(self._generate_mock_findings("successful"))
            if request.includeFailedAttacks:
                findings.extend(self._generate_mock_findings("failed"))
            if request.includeNovelMethods:
                findings.extend(self._generate_mock_findings("novel"))
            
            submission_data = {
                "id": submission_id,
                "name": request.name,
                "description": request.description,
                "createdAt": datetime.now().isoformat(),
                "experimentId": request.experimentId or "",
                "experimentName": request.experimentName or "",
                "findings": findings,
                "status": "draft"
            }
            
            submission_file = submissions_dir / f"{submission_id}.json"
            await asyncio.to_thread(lambda: Path(submission_file).write_text(json.dumps(submission_data, indent=2)))
            
            submission_data["size"] = submission_file.stat().st_size
            
            return submission_data
        except Exception as e:
            logger.error(f"Failed to create submission: {e}")
            raise HTTPException(status_code=500, detail=str(e))

    async def download_submission(self, submission_id: str) -> responses.FileResponse:
        """Download a submission file."""
        try:
            submission_file = Path("submissions") / f"{submission_id}.json"
            if not submission_file.exists():
                raise HTTPException(status_code=404, detail="Submission not found")
            
            return responses.FileResponse(
                path=submission_file,
                filename=f"submission_{submission_id}.json",
                media_type="application/json"
            )
        except Exception as e:
            logger.error(f"Failed to download submission: {e}")
            if isinstance(e, HTTPException):
                raise
            raise HTTPException(status_code=500, detail=str(e))

    async def delete_submission(self, submission_id: str) -> Dict[str, bool]:
        """Delete a submission."""
        try:
            submission_file = Path("submissions") / f"{submission_id}.json"
            if not submission_file.exists():
                raise HTTPException(status_code=404, detail="Submission not found")
            
            submission_file.unlink()
            return {"success": True}
        except Exception as e:
            logger.error(f"Failed to delete submission: {e}")
            if isinstance(e, HTTPException):
                raise
            raise HTTPException(status_code=500, detail=str(e))

    def _generate_mock_findings(self, finding_type: str) -> List[Dict]:
        """Generate mock findings for testing."""
        risks = ["Data exfiltration", "Privacy violations", "Strategic deception", "Tool misuse"]
        patterns = ["Social engineering", "Prompt injection", "Context manipulation", "Role confusion"]
        
        findings = []
        num_findings = random.randint(1, 3)
        
        for i in range(num_findings):
            risk = random.choice(risks)
            pattern = random.choice(patterns)
            
            finding = {
                "issue_title": f"{risk} via {pattern}",
                "issue_summary": f"Detected vulnerability in {risk.lower()} through {pattern.lower()} techniques.",
                "risk_category": risk,
                "attack_pattern": pattern,
                "seed_prompt": f"Sample seed prompt for {finding_type} finding {i+1}",
                "harmony_response_walkthroughs": [
                    {
                        "role": "attacker",
                        "content": f"Sample attacker message for {finding_type} scenario"
                    },
                    {
                        "role": "target",
                        "content": f"Sample target response for {finding_type} scenario"
                    }
                ]
            }
            
            findings.append(finding)
        
        return findings
