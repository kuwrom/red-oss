"""
Client factory utilities for building LLM clients.
"""

from typing import Dict, Any
from fastapi import HTTPException


def build_text_client_for_api(ep_cfg: Dict[str, Any]):
    """Build a text completion client based on provider configuration."""
    from redxmoro.bedrock_client import BedrockClient, GoogleAIClient, VertexAIClient
    
    provider = (ep_cfg.get("provider") or "bedrock").lower()
    
    if provider == "google":
        return GoogleAIClient(
            model_id=ep_cfg.get("model_id", ""),
            api_key_env=ep_cfg.get("google_api_key_env", "GOOGLE_API_KEY"),
            max_tokens=int(ep_cfg.get("max_tokens", 1024) or 1024),
            temperature=float(ep_cfg.get("temperature", 0.7) or 0.7),
            top_p=float(ep_cfg.get("top_p", 0.95) or 0.95),
            system_prompt=ep_cfg.get("system_prompt"),
        )
    
    if provider == "vertex":
        project = ep_cfg.get("gcp_project")
        location = ep_cfg.get("gcp_location", "us-central1")
        if not project:
            raise HTTPException(status_code=400, detail="Vertex provider requires 'gcp_project'")
        return VertexAIClient(
            model_id=ep_cfg.get("model_id", ""),
            project_id=project,
            location=location,
            max_tokens=int(ep_cfg.get("max_tokens", 1024) or 1024),
            temperature=float(ep_cfg.get("temperature", 0.7) or 0.7),
            top_p=float(ep_cfg.get("top_p", 0.95) or 0.95),
            system_prompt=ep_cfg.get("system_prompt"),
        )
    
    return BedrockClient(
        model_id=ep_cfg.get("model_id", ""),
        region=ep_cfg.get("region", "us-east-1"),
        max_tokens=int(ep_cfg.get("max_tokens", 1024) or 1024),
        temperature=float(ep_cfg.get("temperature", 0.7) or 0.7),
        top_p=float(ep_cfg.get("top_p", 0.95) or 0.95),
        system_prompt=ep_cfg.get("system_prompt"),
    )
