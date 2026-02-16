"""
Träningsloop för Frankenstein AI — Lär sig programmera.

Kör agenten genom hela läroplanen, nivå för nivå.
Visar progression, statistik och inlärda färdigheter.
"""

import time
import sys
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich.progress import Progress, SpinnerColumn, TextColumn, BarColumn
from rich import box

from curriculum import get_curriculum, get_tasks_by_level
from code_agent import CodeLearningAgent

console = Console()


def run_training(
    start_level: int = 1,
    end_level: int = 5,
    max_attempts: int = 3,
    verbose: bool = True,
) -> None:
    """Kör hela träningen genom läroplanen."""

    agent = CodeLearningAgent(max_attempts=max_attempts)
    all_tasks = get_curriculum()

    console.print(Panel.fit(
        "[bold cyan]🧟 FRANKENSTEIN AI — PROGRAMMERINGSTRÄNING[/]\n"
        f"[dim]{len(all_tasks)} uppgifter │ Nivå {start_level}-{end_level} │ Max {max_attempts} försök per uppgift[/]",
        title="[bold]Lär sig programmera[/]",
        border_style="cyan",
    ))

    level_results: dict[int, dict] = {}
    t_total_start = time.time()

    for level in range(start_level, end_level + 1):
        tasks = get_tasks_by_level(level)
        if not tasks:
            continue

        level_names = {
            1: "Grundläggande",
            2: "Kontrollflöde",
            3: "Funktioner & Listor",
            4: "Algoritmer",
            5: "Avancerat",
        }

        console.print(f"\n[bold white on blue] NIVÅ {level}: {level_names.get(level, '?')} ({len(tasks)} uppgifter) [/]\n")

        level_solved = 0
        level_attempts = 0
        t_level_start = time.time()

        for task in tasks:
            console.print(f"[bold cyan]📝 {task.id} — {task.title}[/] [dim](svårighet {task.difficulty}, {len(task.test_cases)} test)[/]")

            result = agent.solve_task(task, verbose=verbose)

            if result and result.score >= 1.0:
                level_solved += 1
                console.print(f"  [bold green]✓ Löst![/] ({result.execution_time_ms:.0f}ms)\n")
            elif result:
                console.print(f"  [bold red]✗ Ej löst[/] (bästa: {result.score:.0%})\n")
            else:
                console.print(f"  [bold red]✗ Kunde inte generera lösning[/]\n")

        level_time = time.time() - t_level_start
        level_results[level] = {
            "solved": level_solved,
            "total": len(tasks),
            "rate": level_solved / len(tasks),
            "time": level_time,
        }

        # Nivåsammanfattning
        rate = level_solved / len(tasks)
        color = "green" if rate >= 0.8 else "yellow" if rate >= 0.5 else "red"
        console.print(
            f"[{color}]  Nivå {level}: {level_solved}/{len(tasks)} lösta ({rate:.0%}) — {level_time:.1f}s[/]"
        )

        agent.current_level = level + 1

        # Om < 50% lösta, stanna inte — fortsätt ändå för att lära sig
        if rate < 0.5:
            console.print(f"  [dim]⚠ Låg lösningsgrad — fortsätter ändå för att lära sig mer[/]")

    # ===== SLUTRAPPORT =====
    total_time = time.time() - t_total_start
    stats = agent.get_stats()

    console.print("\n")

    # Resultat per nivå
    table = Table(title="🧟 Träningsresultat per Nivå", box=box.ROUNDED)
    table.add_column("Nivå", style="cyan")
    table.add_column("Lösta", justify="center")
    table.add_column("Totalt", justify="center")
    table.add_column("Rate", justify="center")
    table.add_column("Tid", justify="right")

    for level, res in level_results.items():
        rate = res["rate"]
        rate_color = "green" if rate >= 0.8 else "yellow" if rate >= 0.5 else "red"
        table.add_row(
            f"Nivå {level}",
            str(res["solved"]),
            str(res["total"]),
            f"[{rate_color}]{rate:.0%}[/]",
            f"{res['time']:.1f}s",
        )

    # Total
    total_solved = sum(r["solved"] for r in level_results.values())
    total_tasks = sum(r["total"] for r in level_results.values())
    total_rate = total_solved / max(total_tasks, 1)
    rate_color = "green" if total_rate >= 0.8 else "yellow" if total_rate >= 0.5 else "red"
    table.add_row(
        "[bold]TOTALT[/]",
        f"[bold]{total_solved}[/]",
        f"[bold]{total_tasks}[/]",
        f"[bold {rate_color}]{total_rate:.0%}[/]",
        f"[bold]{total_time:.1f}s[/]",
    )

    console.print(table)

    # Inlärda färdigheter
    if stats["skill_names"]:
        console.print(f"\n[bold]Inlärda färdigheter ({stats['skills_learned']}):[/]")
        for skill_name in sorted(stats["skill_names"]):
            skill = agent.skills[skill_name]
            bar = "█" * min(int(skill.success_rate * 10), 10)
            console.print(f"  {skill_name:20s} [{bar:10s}] {skill.success_rate:.0%} ({len(skill.task_ids)} uppgifter)")

    # Lösta uppgifter
    if agent.solved:
        console.print(f"\n[bold]Lösta uppgifter ({len(agent.solved)}):[/]")
        for task_id, attempt in sorted(agent.solved.items()):
            console.print(f"  [green]✓[/] {task_id} — försök {attempt.attempt_num + 1}, strategi: {attempt.strategy}")

    # Misslyckade
    failed = [t for t in get_curriculum() if t.id not in agent.solved and t.difficulty <= end_level]
    if failed:
        console.print(f"\n[bold]Ej lösta ({len(failed)}):[/]")
        for task in failed[:10]:
            console.print(f"  [red]✗[/] {task.id} — {task.title}")

    console.print(f"\n[bold]Totalt: {total_solved}/{total_tasks} uppgifter lösta ({total_rate:.0%})[/]")
    console.print(f"[dim]Tid: {total_time:.1f}s │ Försök: {stats['total_attempts']} │ Färdigheter: {stats['skills_learned']}[/]")

    # Visa en exempellösning
    if agent.solved:
        first_solved = list(agent.solved.values())[0]
        console.print(f"\n[bold]Exempellösning ({first_solved.task_id}):[/]")
        console.print(f"```python\n{first_solved.code}\n```")

    console.print(f"\n[bold green]✓ Träning klar![/]")


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Frankenstein AI — Programmeringsträning")
    parser.add_argument("--start", type=int, default=1, help="Startnivå (1-5)")
    parser.add_argument("--end", type=int, default=5, help="Slutnivå (1-5)")
    parser.add_argument("--attempts", type=int, default=3, help="Max försök per uppgift")
    parser.add_argument("--quiet", action="store_true", help="Mindre output")
    args = parser.parse_args()

    run_training(
        start_level=args.start,
        end_level=args.end,
        max_attempts=args.attempts,
        verbose=not args.quiet,
    )
