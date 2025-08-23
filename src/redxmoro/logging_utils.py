from __future__ import annotations

import os
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, Optional
import threading

import orjson
import shortuuid


def ensure_dir(path: str | Path) -> Path:
    p = Path(path)
    p.mkdir(parents=True, exist_ok=True)
    return p


def new_run_dir(base: str | Path, experiment_name: str) -> Path:
    ts = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    run_id = f"{experiment_name}_{ts}_{shortuuid.uuid()}"
    path = Path(base) / run_id
    ensure_dir(path)
    return path


class RunLogger:
    def __init__(self, log_path: str | Path) -> None:
        self.log_path = Path(log_path)
        ensure_dir(self.log_path.parent)
        # Touch file
        if not self.log_path.exists():
            self.log_path.write_text("")
        self._lock = threading.Lock()

    def log(self, event: Dict[str, Any]) -> None:
        line = orjson.dumps(event, option=orjson.OPT_NON_STR_KEYS).decode("utf-8")
        with self._lock:
            with open(self.log_path, "a", encoding="utf-8") as f:
                f.write(line + os.linesep)


