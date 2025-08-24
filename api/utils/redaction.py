"""
PII redaction utilities for sensitive data protection.
"""

import re
import json
from typing import Any, Dict, List, Union


class PIIRedactor:
    """Utility class for redacting personally identifiable information."""
    
    # Regex patterns for common PII
    PATTERNS = {
        'email': re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'),
        'credit_card': re.compile(r'\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b'),
        'ssn': re.compile(r'\b\d{3}-\d{2}-\d{4}\b'),
        'phone': re.compile(r'\b(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})\b'),
        'ip_address': re.compile(r'\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b'),
        'url': re.compile(r'https?://(?:[-\w.])+(?:[:\d]+)?(?:/(?:[\w/_.])*(?:\?(?:[\w&=%.])*)?(?:#(?:\w*))?)?'),
        'api_key': re.compile(r'\b[A-Za-z0-9]{32,}\b'),  # Simple pattern for long alphanumeric strings
        'token': re.compile(r'\b(?:token|key|secret)[\s=:]+["\']?([A-Za-z0-9+/=]{20,})["\']?', re.IGNORECASE),
    }
    
    # Replacement patterns
    REPLACEMENTS = {
        'email': '[EMAIL_REDACTED]',
        'credit_card': '[CARD_REDACTED]',
        'ssn': '[SSN_REDACTED]',
        'phone': '[PHONE_REDACTED]',
        'ip_address': '[IP_REDACTED]',
        'url': '[URL_REDACTED]',
        'api_key': '[API_KEY_REDACTED]',
        'token': '[TOKEN_REDACTED]',
    }
    
    def __init__(self, enabled: bool = True, additional_patterns: Dict[str, re.Pattern] = None):
        """Initialize the redactor.
        
        Args:
            enabled: Whether redaction is enabled
            additional_patterns: Additional regex patterns to redact
        """
        self.enabled = enabled
        self.patterns = self.PATTERNS.copy()
        if additional_patterns:
            self.patterns.update(additional_patterns)
    
    def redact_text(self, text: str) -> str:
        """Redact PII from a text string."""
        if not self.enabled or not text:
            return text
        
        redacted_text = text
        for pattern_name, pattern in self.patterns.items():
            replacement = self.REPLACEMENTS.get(pattern_name, '[REDACTED]')
            redacted_text = pattern.sub(replacement, redacted_text)
        
        return redacted_text
    
    def redact_dict(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Recursively redact PII from a dictionary."""
        if not self.enabled:
            return data
        
        if not isinstance(data, dict):
            return data
        
        redacted = {}
        sensitive_keys = {
            'password', 'secret', 'token', 'key', 'authorization', 'auth',
            'api_key', 'apikey', 'access_key', 'secret_key', 'private_key',
            'aws_access_key_id', 'aws_secret_access_key', 'google_api_key',
            'vortex_api_key', 'apiKeys', 'api_keys'
        }
        
        for key, value in data.items():
            # Check if key itself indicates sensitive data
            if any(sensitive in key.lower() for sensitive in sensitive_keys):
                redacted[key] = '[REDACTED]'
            elif isinstance(value, str):
                redacted[key] = self.redact_text(value)
            elif isinstance(value, dict):
                redacted[key] = self.redact_dict(value)
            elif isinstance(value, list):
                redacted[key] = self.redact_list(value)
            else:
                redacted[key] = value
        
        return redacted
    
    def redact_list(self, data: List[Any]) -> List[Any]:
        """Redact PII from a list."""
        if not self.enabled:
            return data
        
        redacted = []
        for item in data:
            if isinstance(item, str):
                redacted.append(self.redact_text(item))
            elif isinstance(item, dict):
                redacted.append(self.redact_dict(item))
            elif isinstance(item, list):
                redacted.append(self.redact_list(item))
            else:
                redacted.append(item)
        
        return redacted
    
    def redact_json(self, json_str: str) -> str:
        """Redact PII from a JSON string."""
        if not self.enabled:
            return json_str
        
        try:
            data = json.loads(json_str)
            redacted_data = self.redact_dict(data)
            return json.dumps(redacted_data)
        except (json.JSONDecodeError, TypeError):
            # If not valid JSON, treat as plain text
            return self.redact_text(json_str)


# Global redactor instance
global_redactor = PIIRedactor(enabled=True)


def redact_pii_from_text(text: str) -> str:
    """Convenience function to redact PII from text."""
    return global_redactor.redact_text(text)


def redact_pii_from_dict(data: Dict[str, Any]) -> Dict[str, Any]:
    """Convenience function to redact PII from dictionary."""
    return global_redactor.redact_dict(data)


def redact_pii_from_json(json_str: str) -> str:
    """Convenience function to redact PII from JSON string."""
    return global_redactor.redact_json(json_str)


def set_redaction_enabled(enabled: bool):
    """Enable or disable global PII redaction."""
    global_redactor.enabled = enabled
