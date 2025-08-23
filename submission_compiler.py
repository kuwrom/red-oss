from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, List, Tuple

import typer


app = typer.Typer(add_completion=False, no_args_is_help=True)


def _load_run_log(path: str | Path) -> List[Dict[str, Any]]:
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


def _extract_successes(entries: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    out: List[Dict[str, Any]] = []
    for e in entries:
        if e.get("event") == "result":
            adj = e.get("adjudication", {})
            if str(adj.get("verdict")).upper() == "SUCCESS":
                out.append(e)
    return out


def _normalize(text: str) -> str:
    return " ".join(text.lower().strip().split())


def _ngrams(text: str, n: int = 3) -> set:
    tokens = _normalize(text).split()
    if len(tokens) < n:
        return set(tokens)
    return {" ".join(tokens[i : i + n]) for i in range(0, len(tokens) - n + 1)}


def _signature(entry: Dict[str, Any]) -> set:
    # Build a signature from attacker messages and last target response
    transcript = entry.get("transcript", [])
    attacker_texts = [m.get("content", "") for m in transcript if m.get("role") == "attacker"]
    target_texts = [m.get("content", "") for m in transcript if m.get("role") == "target"]
    last_target = target_texts[-1] if target_texts else ""
    bag = " \n ".join(attacker_texts[-3:]) + " \n " + last_target
    return _ngrams(bag, n=3)


def _jaccard(a: set, b: set) -> float:
    if not a and not b:
        return 1.0
    if not a or not b:
        return 0.0
    inter = len(a & b)
    union = len(a | b)
    return inter / max(1, union)


def _severity(entry: Dict[str, Any]) -> float:
    return float(entry.get("adjudication", {}).get("score", 0.0) or 0.0)


def _dedup(entries: List[Dict[str, Any]], threshold: float) -> List[Dict[str, Any]]:
    kept: List[Tuple[Dict[str, Any], set]] = []
    for e in sorted(entries, key=_severity, reverse=True):
        sig = _signature(e)
        is_dup = any(_jaccard(sig, s) >= threshold for _, s in kept)
        if not is_dup:
            kept.append((e, sig))
    return [e for e, _ in kept]


def _build_finding(entry: Dict[str, Any]) -> Dict[str, Any]:
    risk = entry.get("risk", "Unknown Risk")
    pattern = entry.get("pattern", "Unknown Pattern")
    seed = entry.get("seed_prompt", "")
    transcript = entry.get("transcript", [])
    justification = entry.get("adjudication", {}).get("justification", "")

    title = f"{risk} via {pattern}"
    summary = justification or f"Detected vulnerability expression in category: {risk}."
    walkthrough = []

    # harmony_response_walkthroughs expects step-wise narration; use transcript
    for msg in transcript:
        role = msg.get("role", "unknown")
        content = msg.get("content", "")
        walkthrough.append({
            "role": role,
            "content": content,
        })

    return {
        "issue_title": title,
        "issue_summary": summary,
        "risk_category": risk,
        "attack_pattern": pattern,
        "seed_prompt": seed,
        "harmony_response_walkthroughs": walkthrough,
    }


@app.command()
def compile(
    run_log: str = typer.Option(..., help="Path to run_log.jsonl"),
    out: str = typer.Option("submissions/findings.json", help="Output JSON path"),
    min_score: float = typer.Option(0.0, help="Minimum adjudicator score to include"),
    top_k: int = typer.Option(50, help="Maximum number of findings to keep after dedup"),
    dedup_threshold: float = typer.Option(0.8, help="Jaccard threshold on n-grams for deduplication (0-1)"),
):
    entries = _load_run_log(run_log)
    successes = _extract_successes(entries)
    # Filter by severity
    successes = [e for e in successes if _severity(e) >= min_score]
    # Deduplicate by content similarity
    successes = _dedup(successes, threshold=dedup_threshold)
    # Cap to top_k by severity
    successes.sort(key=_severity, reverse=True)
    successes = successes[: max(1, int(top_k))]
    findings = [_build_finding(e) for e in successes]

    Path(out).parent.mkdir(parents=True, exist_ok=True)
    with open(out, "w", encoding="utf-8") as f:
        json.dump({"findings": findings}, f, indent=2)
    typer.echo(f"Wrote {len(findings)} findings to {out}")


if __name__ == "__main__":
    app()


