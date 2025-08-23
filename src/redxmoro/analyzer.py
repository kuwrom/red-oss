from __future__ import annotations

import json
from collections import defaultdict
from pathlib import Path
from typing import Any, Dict, List, Tuple


def load_entries(path: str | Path) -> List[Dict[str, Any]]:
    entries: List[Dict[str, Any]] = []
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                entries.append(json.loads(line))
            except Exception:
                continue
    return entries


def summarize(entries: List[Dict[str, Any]]) -> Dict[str, Any]:
    by_key = defaultdict(lambda: {"total": 0, "success": 0})
    overall = {"total": 0, "success": 0}

    for e in entries:
        if e.get("event") != "result":
            continue
        overall["total"] += 1
        adj = e.get("adjudication", {})
        success = str(adj.get("verdict", "FAILURE")).upper() == "SUCCESS"
        if success:
            overall["success"] += 1

        lang = e.get("language", "?")
        aug = e.get("augmentation", "?")
        strat = e.get("strategy", "?")
        keys = [
            ("strategy=" + strat,),
            ("language=" + lang,),
            ("augmentation=" + aug,),
            ("strategy=" + strat, "language=" + lang),
            ("strategy=" + strat, "augmentation=" + aug),
            ("language=" + lang, "augmentation=" + aug),
            ("strategy=" + strat, "language=" + lang, "augmentation=" + aug),
        ]
        for key in keys:
            k = "|".join(key)
            by_key[k]["total"] += 1
            if success:
                by_key[k]["success"] += 1

    return {"overall": overall, "groups": by_key}


def write_reports(summary: Dict[str, Any], out_dir: str | Path) -> Tuple[Path, Path]:
    outp = Path(out_dir)
    outp.mkdir(parents=True, exist_ok=True)

    # JSON
    json_path = outp / "summary.json"
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)

    # CSV
    csv_path = outp / "summary.csv"
    with open(csv_path, "w", encoding="utf-8") as f:
        f.write("group,total,success,success_rate\n")
        overall = summary.get("overall", {})
        tot = int(overall.get("total", 0))
        suc = int(overall.get("success", 0))
        rate = (suc / tot) if tot else 0.0
        f.write(f"overall,{tot},{suc},{rate:.3f}\n")

        groups = summary.get("groups", {})
        for k, v in sorted(groups.items()):
            t = int(v.get("total", 0))
            s = int(v.get("success", 0))
            r = (s / t) if t else 0.0
            f.write(f"{k},{t},{s},{r:.3f}\n")

    return json_path, csv_path


