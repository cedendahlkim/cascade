"""
Ablation Study Runner for Frankenstein AI.

Runs the same benchmark suite with components systematically disabled.
Results are saved to ablation_results.json for paper-ready analysis.

Usage:
    python ablation_runner.py --config baseline --tasks 200
    python ablation_runner.py --config no_hdc --tasks 200
    python ablation_runner.py --config all --tasks 200   # run all sequentially
    python ablation_runner.py --table                    # print LaTeX table from results

Configurations:
    baseline       All components active
    no_hdc         HDC pattern matching disabled
    no_aif         Active Inference disabled (fixed strategy)
    no_ebbinghaus  Ebbinghaus memory disabled (no System 1)
    no_circadian   Circadian engine disabled (constant phase)
    no_gut         Gut Feeling disabled (no metacognitive filtering)
    no_sleep       Sleep consolidation disabled (no dreams/insights)
"""

import json
import time
import sys
import os
import argparse
import random
import copy
from pathlib import Path
from datetime import datetime

# Force UTF-8
if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

from rich.console import Console
from rich.table import Table
from rich import box

from task_generator import generate_task
from task_generator_v2 import generate_v2_task
from code_agent import FrankensteinCodeAgent, SolveMetadata
from programming_env import evaluate_solution

console = Console()

# Paths
DATA_DIR = Path(__file__).parent / "training_data"
CONFIG_PATH = DATA_DIR / "config.json"
RESULTS_PATH = DATA_DIR / "ablation_results.json"
BACKUP_CONFIG_PATH = DATA_DIR / "config_backup.json"

# Ablation configurations: which modules to disable
ABLATION_CONFIGS = {
    "baseline": {},  # all enabled
    "no_hdc": {"hdc": False},
    "no_aif": {"aif": False},
    "no_ebbinghaus": {"ebbinghaus": False},
    "no_circadian": {"_circadian": False},  # handled separately (not in mcfg)
    "no_gut": {"gut_feeling": False},
    "no_sleep": {"_sleep": False},  # handled separately (not in mcfg)
}

ALL_MODULES = ["hdc", "aif", "ebbinghaus", "gut_feeling", "emotions", "stm"]


def _backup_config():
    """Backup current config.json before ablation."""
    if CONFIG_PATH.exists():
        import shutil
        shutil.copy2(CONFIG_PATH, BACKUP_CONFIG_PATH)
        console.print("[dim]Config backed up[/]")


def _restore_config():
    """Restore config.json after ablation."""
    if BACKUP_CONFIG_PATH.exists():
        import shutil
        shutil.copy2(BACKUP_CONFIG_PATH, CONFIG_PATH)
        BACKUP_CONFIG_PATH.unlink()
        console.print("[dim]Config restored[/]")
    elif CONFIG_PATH.exists():
        # Reset to all-enabled
        _write_config({m: True for m in ALL_MODULES})


def _write_config(module_states: dict[str, bool]):
    """Write module config for ablation."""
    # Read existing config to preserve structure
    existing = {}
    if CONFIG_PATH.exists():
        try:
            existing = json.loads(CONFIG_PATH.read_text(encoding="utf-8"))
        except Exception:
            pass

    modules = existing.get("modules", {})
    for mod in ALL_MODULES:
        if mod not in modules:
            modules[mod] = {"enabled": True, "label": mod, "description": ""}
        modules[mod]["enabled"] = module_states.get(mod, True)

    existing["modules"] = modules
    CONFIG_PATH.write_text(json.dumps(existing, indent=2, ensure_ascii=False), encoding="utf-8")


def _apply_ablation_config(config_name: str) -> dict[str, bool]:
    """Apply an ablation configuration. Returns the module states."""
    overrides = ABLATION_CONFIGS[config_name]

    # Start with all enabled
    states = {m: True for m in ALL_MODULES}

    # Apply overrides (skip special _ prefixed ones)
    for key, val in overrides.items():
        if not key.startswith("_") and key in states:
            states[key] = val

    _write_config(states)
    return states


def generate_benchmark_tasks(num_tasks: int, seed: int = 42) -> list:
    """Generate a fixed set of benchmark tasks across all categories and difficulties."""
    rng = random.Random(seed)
    tasks = []

    # Mix of standard tasks (70%) and V2 tasks (30%)
    num_standard = int(num_tasks * 0.7)
    num_v2 = num_tasks - num_standard

    # Standard tasks: spread across difficulties 1-10
    for i in range(num_standard):
        difficulty = (i % 10) + 1
        random.seed(seed + i)  # deterministic per task
        task = generate_task(difficulty)
        tasks.append(("standard", task))

    # V2 tasks: spread across difficulties 3-8
    for i in range(num_v2):
        difficulty = (i % 6) + 3
        random.seed(seed + num_standard + i)
        task = generate_v2_task(difficulty)
        tasks.append(("v2", task))

    # Shuffle with fixed seed
    rng.shuffle(tasks)
    return tasks


def run_ablation(config_name: str, tasks: list, skip_circadian: bool = False,
                 skip_sleep: bool = False) -> dict:
    """Run one ablation configuration and return results."""
    console.print(f"\n[bold white on blue] ABLATION: {config_name} ({len(tasks)} tasks) [/]")

    # Apply config
    states = _apply_ablation_config(config_name)
    disabled = [k for k, v in ABLATION_CONFIGS[config_name].items() if not v]
    if disabled:
        console.print(f"  [yellow]Disabled: {', '.join(disabled)}[/]")
    else:
        console.print(f"  [green]All modules active (baseline)[/]")

    # Create fresh agent for each ablation (no cross-contamination)
    agent = FrankensteinCodeAgent(max_attempts=3)

    results = {
        "config_name": config_name,
        "module_states": states,
        "tasks_attempted": 0,
        "tasks_solved": 0,
        "first_try_solves": 0,
        "solve_rate": 0.0,
        "first_try_rate": 0.0,
        "avg_time_ms": 0.0,
        "total_time_ms": 0.0,
        "tier_distribution": {"s0": 0, "s1": 0, "s2": 0},
        "per_category": {},
        "per_level": {},
        "per_task_type": {"standard": {"attempted": 0, "solved": 0}, "v2": {"attempted": 0, "solved": 0}},
        "started_at": datetime.now().isoformat(),
        "finished_at": "",
    }

    for i, (task_type, task) in enumerate(tasks):
        try:
            result = agent.solve_task(task, verbose=False)
        except Exception as e:
            console.print(f"  [red]Error on task {task.id}: {e}[/]")
            continue

        meta: SolveMetadata | None = getattr(result, "metadata", None) if result else None
        time_ms = meta.total_time_ms if meta else 0.0
        solved = result is not None and result.score >= 1.0
        first_try = meta.first_try_success if meta else False
        strategy = meta.winning_strategy if meta else ""

        results["tasks_attempted"] += 1
        results["total_time_ms"] += time_ms
        results["per_task_type"][task_type]["attempted"] += 1

        # Determine tier
        tier = "s2"
        if strategy == "system0_deterministic":
            tier = "s0"
        elif strategy == "system1_memory":
            tier = "s1"
        results["tier_distribution"][tier] += 1

        # Per category
        cat = task.category
        if cat not in results["per_category"]:
            results["per_category"][cat] = {"attempted": 0, "solved": 0, "first_try": 0, "total_time_ms": 0.0}
        results["per_category"][cat]["attempted"] += 1
        results["per_category"][cat]["total_time_ms"] += time_ms

        # Per level
        lvl = str(task.difficulty)
        if lvl not in results["per_level"]:
            results["per_level"][lvl] = {"attempted": 0, "solved": 0, "first_try": 0, "total_time_ms": 0.0}
        results["per_level"][lvl]["attempted"] += 1
        results["per_level"][lvl]["total_time_ms"] += time_ms

        if solved:
            results["tasks_solved"] += 1
            results["per_category"][cat]["solved"] += 1
            results["per_level"][lvl]["solved"] += 1
            results["per_task_type"][task_type]["solved"] += 1
            if first_try:
                results["first_try_solves"] += 1
                results["per_category"][cat]["first_try"] += 1
                results["per_level"][lvl]["first_try"] += 1

        # Progress indicator
        if (i + 1) % 20 == 0 or i == len(tasks) - 1:
            sr = results["tasks_solved"] / max(results["tasks_attempted"], 1) * 100
            s0_pct = results["tier_distribution"]["s0"] / max(results["tasks_attempted"], 1) * 100
            console.print(
                f"  [{i+1}/{len(tasks)}] "
                f"Solve: {results['tasks_solved']}/{results['tasks_attempted']} ({sr:.1f}%) "
                f"S0: {s0_pct:.0f}% "
                f"[dim]{tier}:{strategy[:12] if strategy else 'none'}[/]"
            )

    # Compute final rates
    n = max(results["tasks_attempted"], 1)
    results["solve_rate"] = round(results["tasks_solved"] / n, 4)
    results["first_try_rate"] = round(results["first_try_solves"] / n, 4)
    results["avg_time_ms"] = round(results["total_time_ms"] / n, 1)
    results["finished_at"] = datetime.now().isoformat()

    # Compute per-category and per-level rates
    for cat_data in results["per_category"].values():
        a = max(cat_data["attempted"], 1)
        cat_data["solve_rate"] = round(cat_data["solved"] / a, 4)
        cat_data["avg_time_ms"] = round(cat_data["total_time_ms"] / a, 1)
    for lvl_data in results["per_level"].values():
        a = max(lvl_data["attempted"], 1)
        lvl_data["solve_rate"] = round(lvl_data["solved"] / a, 4)
        lvl_data["avg_time_ms"] = round(lvl_data["total_time_ms"] / a, 1)

    console.print(f"  [bold green]Done: {results['solve_rate']*100:.1f}% solve, "
                  f"{results['first_try_rate']*100:.1f}% first-try, "
                  f"{results['avg_time_ms']:.0f}ms avg[/]")

    return results


def save_results(all_results: dict):
    """Save ablation results to JSON."""
    RESULTS_PATH.write_text(
        json.dumps(all_results, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )
    console.print(f"[green]Results saved to {RESULTS_PATH}[/]")


def load_results() -> dict:
    """Load existing ablation results."""
    if RESULTS_PATH.exists():
        return json.loads(RESULTS_PATH.read_text(encoding="utf-8"))
    return {}


def print_latex_table():
    """Print paper-ready LaTeX table from ablation results."""
    results = load_results()
    if not results:
        console.print("[red]No ablation results found. Run ablations first.[/]")
        return

    # Rich table
    table = Table(title="Frankenstein AI — Ablation Study", box=box.DOUBLE_EDGE)
    table.add_column("Config", style="bold")
    table.add_column("Solve Rate", justify="right")
    table.add_column("First-Try", justify="right")
    table.add_column("Avg Time", justify="right")
    table.add_column("S0%", justify="right")
    table.add_column("S1%", justify="right")
    table.add_column("S2%", justify="right")
    table.add_column("Tasks", justify="right")

    baseline_sr = results.get("baseline", {}).get("solve_rate", 0)

    for config_name in ["baseline", "no_hdc", "no_aif", "no_ebbinghaus", "no_circadian", "no_gut", "no_sleep"]:
        r = results.get(config_name)
        if not r:
            table.add_row(config_name, "—", "—", "—", "—", "—", "—", "—")
            continue

        n = max(r["tasks_attempted"], 1)
        sr = r["solve_rate"] * 100
        ft = r["first_try_rate"] * 100
        avg_t = r["avg_time_ms"]
        s0 = r["tier_distribution"]["s0"] / n * 100
        s1 = r["tier_distribution"]["s1"] / n * 100
        s2 = r["tier_distribution"]["s2"] / n * 100

        # Color: green if >= baseline, red if worse
        sr_style = "green" if sr >= baseline_sr * 100 - 1 else "red"
        delta = sr - baseline_sr * 100
        delta_str = f" ({delta:+.1f})" if config_name != "baseline" else ""

        table.add_row(
            config_name,
            f"[{sr_style}]{sr:.1f}%{delta_str}[/{sr_style}]",
            f"{ft:.1f}%",
            f"{avg_t:.0f}ms",
            f"{s0:.1f}%",
            f"{s1:.1f}%",
            f"{s2:.1f}%",
            str(r["tasks_attempted"]),
        )

    console.print(table)

    # LaTeX output
    console.print("\n[bold]LaTeX Table:[/]")
    print("\\begin{table}[h]")
    print("\\centering")
    print("\\caption{Ablation Study: Component Contribution Analysis}")
    print("\\label{tab:ablation}")
    print("\\begin{tabular}{lcccccc}")
    print("\\toprule")
    print("Config & Solve Rate & First-Try & Avg Time & S0\\% & S1\\% & S2\\% \\\\")
    print("\\midrule")

    for config_name in ["baseline", "no_hdc", "no_aif", "no_ebbinghaus", "no_circadian", "no_gut", "no_sleep"]:
        r = results.get(config_name)
        if not r:
            print(f"{config_name} & — & — & — & — & — & — \\\\")
            continue
        n = max(r["tasks_attempted"], 1)
        sr = r["solve_rate"] * 100
        ft = r["first_try_rate"] * 100
        avg_t = r["avg_time_ms"]
        s0 = r["tier_distribution"]["s0"] / n * 100
        s1 = r["tier_distribution"]["s1"] / n * 100
        s2 = r["tier_distribution"]["s2"] / n * 100
        label = config_name.replace("_", "\\_")
        print(f"{label} & {sr:.1f}\\% & {ft:.1f}\\% & {avg_t:.0f}ms & {s0:.1f}\\% & {s1:.1f}\\% & {s2:.1f}\\% \\\\")

    print("\\bottomrule")
    print("\\end{tabular}")
    print("\\end{table}")

    # V2 breakdown
    console.print("\n[bold]V2 Task Performance by Config:[/]")
    v2_table = Table(title="V2 (Software Engineering) Tasks", box=box.SIMPLE)
    v2_table.add_column("Config", style="bold")
    v2_table.add_column("V2 Solved", justify="right")
    v2_table.add_column("V2 Rate", justify="right")
    v2_table.add_column("Std Solved", justify="right")
    v2_table.add_column("Std Rate", justify="right")

    for config_name in ["baseline", "no_hdc", "no_aif", "no_ebbinghaus", "no_circadian", "no_gut", "no_sleep"]:
        r = results.get(config_name)
        if not r:
            continue
        v2 = r.get("per_task_type", {}).get("v2", {"attempted": 0, "solved": 0})
        std = r.get("per_task_type", {}).get("standard", {"attempted": 0, "solved": 0})
        v2r = v2["solved"] / max(v2["attempted"], 1) * 100
        stdr = std["solved"] / max(std["attempted"], 1) * 100
        v2_table.add_row(
            config_name,
            f"{v2['solved']}/{v2['attempted']}",
            f"{v2r:.1f}%",
            f"{std['solved']}/{std['attempted']}",
            f"{stdr:.1f}%",
        )

    console.print(v2_table)


def main():
    parser = argparse.ArgumentParser(description="Frankenstein AI Ablation Study Runner")
    parser.add_argument("--config", type=str, default="all",
                        help="Which ablation config to run (or 'all')")
    parser.add_argument("--tasks", type=int, default=200,
                        help="Number of tasks per configuration")
    parser.add_argument("--seed", type=int, default=42,
                        help="Random seed for task generation")
    parser.add_argument("--table", action="store_true",
                        help="Print results table (no running)")
    args = parser.parse_args()

    if args.table:
        print_latex_table()
        return

    # Validate config
    if args.config != "all" and args.config not in ABLATION_CONFIGS:
        console.print(f"[red]Unknown config: {args.config}[/]")
        console.print(f"Available: {', '.join(ABLATION_CONFIGS.keys())}, all")
        return

    # Generate benchmark tasks (same for all configs)
    console.print(f"[bold]Generating {args.tasks} benchmark tasks (seed={args.seed})...[/]")
    tasks = generate_benchmark_tasks(args.tasks, seed=args.seed)
    console.print(f"  {len([t for t in tasks if t[0] == 'standard'])} standard + "
                  f"{len([t for t in tasks if t[0] == 'v2'])} v2 tasks")

    # Backup config
    _backup_config()

    # Load existing results (allow incremental runs)
    all_results = load_results()

    configs_to_run = list(ABLATION_CONFIGS.keys()) if args.config == "all" else [args.config]

    try:
        for config_name in configs_to_run:
            skip_circ = config_name == "no_circadian"
            skip_sleep = config_name == "no_sleep"

            result = run_ablation(
                config_name, tasks,
                skip_circadian=skip_circ,
                skip_sleep=skip_sleep,
            )
            all_results[config_name] = result
            save_results(all_results)

    except KeyboardInterrupt:
        console.print("\n[yellow]Interrupted — saving partial results...[/]")
        save_results(all_results)
    finally:
        _restore_config()

    # Print summary table
    console.print()
    print_latex_table()


if __name__ == "__main__":
    main()
