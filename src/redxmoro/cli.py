from __future__ import annotations

from pathlib import Path
import typer
from rich import print as rprint

from .config import ExperimentConfig
from .runner import run_experiment
from .analyzer import load_entries, summarize, write_reports


app = typer.Typer(add_completion=False, no_args_is_help=True)


@app.command()
def run(config: str = typer.Option(..., help="Path to experiment YAML")):
    """Run an experiment defined by the YAML config."""
    cfg = ExperimentConfig.from_yaml(config)
    run_dir = run_experiment(cfg)
    rprint(f"[bold green]Run complete[/bold green]: {run_dir}")


@app.command()
def analyze(run_log: str = typer.Option(..., help="Path to run_log.jsonl"), out_dir: str = typer.Option("analysis", help="Output folder for summary reports")):
    """Analyze a run log and emit summary JSON/CSV with success rates by groups."""
    entries = load_entries(run_log)
    summary = summarize(entries)
    json_p, csv_p = write_reports(summary, out_dir)
    rprint(f"[bold green]Analysis written[/bold green]: {json_p} and {csv_p}")


if __name__ == "__main__":
    app()


