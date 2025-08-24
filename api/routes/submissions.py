"""
Submission management API routes.
"""

import logging
from fastapi import APIRouter

from api.models.experiment import SubmissionRequest
from api.services import SubmissionService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/submissions", tags=["submissions"])

# Service will be injected via dependency injection in main.py
submission_service: SubmissionService = None


def set_submission_service(service: SubmissionService):
    """Set the submission service instance."""
    global submission_service
    submission_service = service


@router.get("")
async def list_submissions():
    """List all submissions."""
    return await submission_service.list_submissions()


@router.post("")
async def create_submission(request: SubmissionRequest):
    """Create a new submission."""
    return await submission_service.create_submission(request)


@router.get("/{submission_id}/download")
async def download_submission(submission_id: str):
    """Download a submission file."""
    return await submission_service.download_submission(submission_id)


@router.delete("/{submission_id}")
async def delete_submission(submission_id: str):
    """Delete a submission."""
    return await submission_service.delete_submission(submission_id)
