"""
24/7 Kontinuerlig träning för Frankenstein AI.

Kör oändligt:
1. Genererar nya uppgifter dynamiskt
2. Löser dem med LLM + minnesbaserad strategi
3. Sparar all progression till disk (JSON)
4. Adaptiv svårighetsgrad — ökar när agenten klarar sig bra
5. Periodisk sammanfattning och statistik
6. Auto-restart vid fel

Starta: python continuous_train.py
Stoppa: Ctrl+C (sparar automatiskt)
"""

import json
import time
import signal
import sys
import os
import random
from datetime import datetime, timedelta
from pathlib import Path

# Force UTF-8 output for redirected processes
if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass
if sys.stderr and hasattr(sys.stderr, "reconfigure"):
    try:
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich import box

from curriculum import get_curriculum
from task_generator import generate_task
from task_generator_v2 import generate_v2_task
from chaos_monkey import create_chaos_task, generate_refactor_task
from code_agent import CodeLearningAgent, SolveMetadata
from code_solver import solve_deterministic as solve_code_deterministic
from programming_env import evaluate_solution
from circadian import CircadianClock, SleepEngine
from terminal_tasks import generate_terminal_task
from terminal_agent import TerminalAgent
from spaced_repetition import SpacedRepetitionScheduler
import urllib.request

# Detect if output is redirected — disable Rich formatting if so
_is_redirected = not sys.stdout.isatty() if sys.stdout else True
console = Console(force_terminal=not _is_redirected, no_color=_is_redirected)

# Persistens
DATA_DIR = Path(__file__).parent / "training_data"
PROGRESS_FILE = DATA_DIR / "progress.json"
LOG_FILE = DATA_DIR / "training.log"
SOLUTIONS_DIR = DATA_DIR / "solutions"


BRIDGE_URL = os.environ.get("BRIDGE_URL", "http://localhost:3031")


def _send_terminal_event(event: dict):
    """Send a live terminal event to bridge for real-time UI updates. Fire-and-forget."""
    try:
        data = json.dumps({"event": event}).encode("utf-8")
        req = urllib.request.Request(
            f"{BRIDGE_URL}/api/frankenstein/terminal/event",
            data=data,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        urllib.request.urlopen(req, timeout=2)
    except Exception:
        pass


def ensure_dirs():
    DATA_DIR.mkdir(exist_ok=True)
    SOLUTIONS_DIR.mkdir(exist_ok=True)


def load_progress() -> dict:
    """Ladda sparad progression från disk."""
    if PROGRESS_FILE.exists():
        try:
            return json.loads(PROGRESS_FILE.read_text(encoding="utf-8"))
        except Exception:
            pass
    return {
        "total_tasks_attempted": 0,
        "total_tasks_solved": 0,
        "total_attempts": 0,
        "current_difficulty": 1,
        "skills": {},
        "solved_ids": [],
        "session_count": 0,
        "total_training_seconds": 0,
        "history": [],  # Senaste 1000 resultat med rik metadata
        "level_stats": {str(i): {"attempted": 0, "solved": 0} for i in range(1, 11)},
        "category_stats": {},  # Per kategori: attempted, solved, total_time_ms
        "started_at": datetime.now().isoformat(),
        "best_streak": 0,
        "current_streak": 0,
        "first_try_solves": 0,
        "retry_solves": 0,
        "total_solve_time_ms": 0.0,
        "trends": {},  # Beräknade rullande medelvärden
    }


def save_progress(progress: dict):
    """Spara progression till disk."""
    ensure_dirs()
    progress["last_saved"] = datetime.now().isoformat()
    PROGRESS_FILE.write_text(json.dumps(progress, indent=2, ensure_ascii=False), encoding="utf-8")


def log_event(msg: str):
    """Logga till fil."""
    ensure_dirs()
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(f"[{timestamp}] {msg}\n")


def compute_trends(progress: dict) -> dict:
    """Beräkna rullande trender från historik."""
    history = progress.get("history", [])
    trends = {}
    for window_name, window_size in [("last_10", 10), ("last_50", 50), ("last_100", 100)]:
        recent = history[-window_size:] if len(history) >= window_size else history
        if not recent:
            trends[window_name] = {"solve_rate": 0, "first_try_rate": 0, "avg_time_ms": 0, "count": 0}
            continue
        solved = sum(1 for h in recent if h.get("score", 0) >= 1.0)
        first_try = sum(1 for h in recent if h.get("first_try", False))
        times = [h.get("time_ms", 0) for h in recent if h.get("time_ms", 0) > 0]
        trends[window_name] = {
            "solve_rate": round(solved / len(recent), 3),
            "first_try_rate": round(first_try / len(recent), 3),
            "avg_time_ms": round(sum(times) / max(len(times), 1), 1),
            "count": len(recent),
        }

    # Trender per nivå (senaste 50)
    level_trends = {}
    recent_all = history[-200:]
    for lvl in range(1, 11):
        level_hist = [h for h in recent_all if h.get("difficulty") == lvl]
        if level_hist:
            s = sum(1 for h in level_hist if h.get("score", 0) >= 1.0)
            ft = sum(1 for h in level_hist if h.get("first_try", False))
            times = [h.get("time_ms", 0) for h in level_hist if h.get("time_ms", 0) > 0]
            level_trends[str(lvl)] = {
                "solve_rate": round(s / len(level_hist), 3),
                "first_try_rate": round(ft / len(level_hist), 3),
                "avg_time_ms": round(sum(times) / max(len(times), 1), 1),
                "count": len(level_hist),
            }
    trends["per_level"] = level_trends

    # Trender per kategori (senaste 200)
    cat_trends = {}
    for h in recent_all:
        cat = h.get("category", "unknown")
        if cat not in cat_trends:
            cat_trends[cat] = {"attempted": 0, "solved": 0, "first_try": 0, "total_time_ms": 0.0}
        cat_trends[cat]["attempted"] += 1
        if h.get("score", 0) >= 1.0:
            cat_trends[cat]["solved"] += 1
        if h.get("first_try", False):
            cat_trends[cat]["first_try"] += 1
        cat_trends[cat]["total_time_ms"] += h.get("time_ms", 0)
    for cat, ct in cat_trends.items():
        ct["solve_rate"] = round(ct["solved"] / max(ct["attempted"], 1), 3)
        ct["avg_time_ms"] = round(ct["total_time_ms"] / max(ct["attempted"], 1), 1)
    trends["per_category"] = cat_trends

    return trends


def save_solution(task_id: str, code: str, score: float):
    """Spara en lösning till disk."""
    ensure_dirs()
    safe_id = task_id.replace("/", "_").replace("\\", "_")
    path = SOLUTIONS_DIR / f"{safe_id}.py"
    header = f"# Task: {task_id} | Score: {score:.0%} | {datetime.now().isoformat()}\n\n"
    path.write_text(header + code, encoding="utf-8")


def adaptive_difficulty(progress: dict) -> int:
    """Beräkna adaptiv svårighetsgrad baserat på senaste prestanda + gut feeling.
    
    Nivåer 1-10:
    1: Aritmetik, 2: Strängar/mönster, 3: Listor/talteori
    4: Dict/algoritmer/rekursion/matris, 5: Sortering/avancerade strängar
    6: Datastrukturer (stack/kö/länkad lista), 7: Funktionell/grafer
    8: Dynamisk programmering/kombinatorik
    9: Avancerade grafalgoritmer/sökning, 10: Expert (trie, backtracking, avancerad DP)
    
    Gut feeling-integration:
    - Om magkänslan var "confident" OCH korrekt → snabbare uppgradering
    - Om magkänslan var "cautious" OCH korrekt (misslyckades) → långsammare
    """
    history = progress.get("history", [])
    if len(history) < 5:
        return max(1, progress.get("current_difficulty", 1))

    current = progress.get("current_difficulty", 1)

    # Titta på senaste 15 uppgifter på NUVARANDE nivå
    recent_at_level = [h for h in history[-30:] if h.get("difficulty", 1) == current]
    if len(recent_at_level) < 3:
        recent_at_level = history[-10:]

    scores = [h.get("score", 0) for h in recent_at_level]
    solve_rate = sum(1 for s in scores if s >= 1.0) / max(len(scores), 1)

    # Gut feeling-bonus: analysera senaste gut predictions
    gut_bonus = 0.0
    recent_gut = [h for h in history[-20:] if h.get("gut_rec")]
    if len(recent_gut) >= 5:
        confident_correct = sum(
            1 for h in recent_gut
            if h.get("gut_rec") == "confident" and h.get("score", 0) >= 1.0
        )
        cautious_correct = sum(
            1 for h in recent_gut
            if h.get("gut_rec") == "cautious" and h.get("score", 0) < 1.0
        )
        gut_accuracy = (confident_correct + cautious_correct) / len(recent_gut)
        avg_valence = sum(h.get("gut_valence", 0) for h in recent_gut) / len(recent_gut)

        # Hög gut accuracy + positiv valence → AI:n "känner sig stark" → lättare att gå upp
        if gut_accuracy > 0.6 and avg_valence > 0.2:
            gut_bonus = 0.05  # Sänk tröskeln för uppgradering
        # Låg valence + gut var rätt om att det var svårt → stanna kvar längre
        elif gut_accuracy > 0.5 and avg_valence < -0.1:
            gut_bonus = -0.05  # Höj tröskeln

    # Öka svårighet om > 75% lösningsgrad (strängare för högre nivåer)
    threshold_up = (0.75 if current <= 4 else 0.70) - gut_bonus
    if solve_rate >= threshold_up and current < 10:
        return current + 1

    # Minska om < 25% lösningsgrad
    threshold_down = 0.25 + gut_bonus
    if solve_rate < threshold_down and current > 1:
        return current - 1

    # Stanna kvar om mellan trösklarna
    return current


def print_session_stats(progress: dict, session_start: float, session_solved: int, session_attempted: int, agent=None):
    """Skriv ut sessionstatistik inkl. Frankenstein-stack."""
    elapsed = time.time() - session_start
    total_time = progress.get("total_training_seconds", 0) + elapsed

    table = Table(title="🧟 Frankenstein AI — Statistik", box=box.SIMPLE)
    table.add_column("", style="cyan")
    table.add_column("Session", justify="right")
    table.add_column("Totalt", justify="right", style="bold")

    total_attempted = progress.get("total_tasks_attempted", 0)
    total_solved = progress.get("total_tasks_solved", 0)

    table.add_row("Uppgifter", str(session_attempted), str(total_attempted))
    table.add_row("Lösta", str(session_solved), str(total_solved))
    rate_s = f"{session_solved/max(session_attempted,1):.0%}"
    rate_t = f"{total_solved/max(total_attempted,1):.0%}"
    table.add_row("Lösningsgrad", rate_s, rate_t)

    ft = progress.get("first_try_solves", 0)
    rt = progress.get("retry_solves", 0)
    ft_rate = f"{ft/max(total_solved,1):.0%}" if total_solved else "—"
    table.add_row("First-try", str(ft), ft_rate)
    table.add_row("Retry-lösta", str(rt), f"{rt/max(total_solved,1):.0%}" if total_solved else "—")

    avg_solve_ms = progress.get("total_solve_time_ms", 0) / max(total_solved, 1)
    table.add_row("Snitt tid/löst", f"{avg_solve_ms:.0f}ms", "")
    table.add_row("Svårighet", str(progress.get("current_difficulty", 1)), "")
    table.add_row("Streak", str(progress.get("current_streak", 0)), f"Bäst: {progress.get('best_streak', 0)}")
    table.add_row("Skills", str(len(progress.get("skills", {}))), "")
    table.add_row("Tid", f"{elapsed/60:.0f}m", f"{total_time/3600:.1f}h")

    # Rullande trender
    trends = progress.get("trends", {})
    if trends:
        table.add_row("", "", "")
        table.add_row("[bold]-- TRENDER --[/]", "", "")
        for wname, label in [("last_10", "Senaste 10"), ("last_50", "Senaste 50"), ("last_100", "Senaste 100")]:
            t = trends.get(wname, {})
            if t.get("count", 0) > 0:
                table.add_row(label, f"{t['solve_rate']:.0%} löst", f"FT:{t['first_try_rate']:.0%} {t['avg_time_ms']:.0f}ms")

    # Frankenstein-stack stats
    if agent:
        stats = agent.get_stats()
        table.add_row("", "", "")
        table.add_row("[bold]-- FRANKENSTEIN STACK --[/]", "", "")
        table.add_row("HDC Koncept", str(stats.get("hdc_concepts", 0)), "")
        table.add_row("AIF Exploration", f"{stats.get('aif_exploration_weight', 0):.2f}", "")
        table.add_row("AIF Surprise", f"{stats.get('aif_surprise', 0):.2f}", "")
        table.add_row("Ebbinghaus Minnen", str(stats.get("memory_active", 0)), str(stats.get("memory_total_stored", 0)))
        table.add_row("Ebbinghaus Glömda", str(stats.get("memory_total_decayed", 0)), "")

    console.print(table)

    # Nivåstatistik
    level_stats = progress.get("level_stats", {})
    console.print("[bold]Per nivå:[/]")
    for lvl in range(1, 11):
        ls = level_stats.get(str(lvl), {"attempted": 0, "solved": 0})
        a, s = ls["attempted"], ls["solved"]
        rate = s / max(a, 1)
        bar = "█" * int(rate * 20) + "░" * (20 - int(rate * 20))
        color = "green" if rate >= 0.8 else "yellow" if rate >= 0.5 else "red"
        console.print(f"  Nivå {lvl}: [{bar}] [{color}]{s}/{a} ({rate:.0%})[/]")


def run_continuous():
    """Huvudloop — kör tills Ctrl+C."""
    ensure_dirs()
    progress = load_progress()
    progress["session_count"] = progress.get("session_count", 0) + 1

    agent = CodeLearningAgent(max_attempts=3)

    # Spaced Repetition Scheduler — bootstrap from history
    sr_scheduler = SpacedRepetitionScheduler()
    sr_imported = sr_scheduler.import_from_progress(progress)
    if sr_imported:
        console.print(f"[dim]📅 Spaced Repetition: importerade {sr_imported} kategorier[/]")

    # Återställ agent-state från sparad progression
    for skill_name, skill_data in progress.get("skills", {}).items():
        from code_agent import SkillMemory
        agent.skills[skill_name] = SkillMemory(
            pattern=skill_data.get("pattern", skill_name),
            example_code=skill_data.get("example_code", ""),
            task_ids=skill_data.get("task_ids", []),
            success_rate=skill_data.get("success_rate", 0.5),
            times_used=skill_data.get("times_used", 0),
        )

    session_start = time.time()
    session_solved = 0
    session_attempted = 0
    tasks_since_report = 0

    # Kör curriculum först om inte redan gjort
    curriculum_done = len([h for h in progress.get("history", []) if not h.get("id", "").startswith("gen-")]) >= 20

    console.print(Panel.fit(
        "[bold cyan]🧟 FRANKENSTEIN AI — 24/7 TRÄNING[/]\n"
        f"[dim]Session #{progress['session_count']} │ "
        f"Totalt: {progress.get('total_tasks_solved', 0)} lösta │ "
        f"Svårighet: {progress.get('current_difficulty', 1)} │ "
        f"Skills: {len(progress.get('skills', {}))}[/]\n"
        f"[dim]Tryck Ctrl+C för att stoppa (sparar automatiskt)[/]",
        border_style="cyan",
    ))

    # Graceful shutdown
    running = True
    def signal_handler(sig, frame):
        nonlocal running
        running = False
        console.print("\n[yellow]⏹ Stoppar... sparar progression...[/]")
    signal.signal(signal.SIGINT, signal_handler)

    try:
        # Fas 1: Kör curriculum om inte klart
        if not curriculum_done:
            console.print("\n[bold]📚 Fas 1: Curriculum (fasta uppgifter)[/]\n")
            curriculum = get_curriculum()
            solved_ids = set(progress.get("solved_ids", []))
            remaining = [t for t in curriculum if t.id not in solved_ids]

            for task in remaining:
                if not running:
                    break

                console.print(f"[cyan]📝 {task.id} — {task.title}[/] [dim](nivå {task.difficulty})[/]", end=" ")
                result = agent.solve_task(task, verbose=False)
                session_attempted += 1
                progress["total_tasks_attempted"] = progress.get("total_tasks_attempted", 0) + 1

                lvl = str(task.difficulty)
                if lvl not in progress["level_stats"]:
                    progress["level_stats"][lvl] = {"attempted": 0, "solved": 0}
                progress["level_stats"][lvl]["attempted"] += 1

                if result and result.score >= 1.0:
                    session_solved += 1
                    progress["total_tasks_solved"] = progress.get("total_tasks_solved", 0) + 1
                    progress["solved_ids"].append(task.id)
                    progress["level_stats"][lvl]["solved"] += 1
                    progress["current_streak"] = progress.get("current_streak", 0) + 1
                    progress["best_streak"] = max(progress.get("best_streak", 0), progress["current_streak"])
                    save_solution(task.id, result.code, result.score)
                    console.print(f"[green]✅ {result.passed}/{result.total}[/]")
                    log_event(f"SOLVED {task.id} ({task.title}) score={result.score:.0%}")
                else:
                    progress["current_streak"] = 0
                    score = result.score if result else 0
                    console.print(f"[red]❌ {score:.0%}[/]")
                    log_event(f"FAILED {task.id} ({task.title}) score={score:.0%}")

                meta = result.metadata if result and hasattr(result, 'metadata') else None
                progress["history"].append({
                    "id": task.id,
                    "task_id": task.id,
                    "score": result.score if result else 0,
                    "difficulty": task.difficulty,
                    "category": getattr(task, 'category', 'curriculum'),
                    "timestamp": time.time(),
                    "time_ms": 0,
                    "attempts": 1,
                    "first_try": bool(result and result.score >= 1.0),
                    "strategy": "",
                    "feedback": (result.feedback if result else "") or "",
                })
                progress["history"] = progress["history"][-1000:]

                tasks_since_report += 1
                if tasks_since_report >= 10:
                    save_progress(progress)
                    tasks_since_report = 0

        # Fas 2: Oändlig genererad träning
        if running:
            console.print("\n[bold]🔄 Fas 2: Oändlig träning (dynamiskt genererade uppgifter)[/]\n")

        # Circadian system: dygnsrytm + sömn
        circadian = CircadianClock(
            batches_per_day=30,   # 1 "dag" = 30 batchar ≈ 30 min
            sleep_batches=3,      # 3 batchar sömn per dag
        )
        sleep_engine = SleepEngine(cycles_per_night=3)

        # Terminal agent: löser bash-uppgifter (Terminal-Bench-inspirerat)
        terminal_agent = TerminalAgent()

        batch_num = 0
        while running:
            batch_num += 1

            # === CIRCADIAN: Hämta aktuell fas ===
            circ_state = circadian.get_state()

            # === SÖMN: Kör minneskonsolidering istället för uppgifter ===
            if circ_state.is_sleeping:
                console.print(f"[bold white on dark_blue] 💤 Dag {circ_state.day_number} — SÖMN (cykel {circadian.batch_in_day - int(circadian.batches_per_day * 0.688) + 1}/{circadian.sleep_batches}) [/]")
                sleep_report = sleep_engine.run_sleep_cycle(
                    episodic_memory=agent.episodic_memory,
                    hdc_bridge=agent.hdc,
                    concept_code=agent.concept_code,
                )
                console.print(f"  [dim]Konsoliderade {sleep_report.memories_consolidated} minnen, glömde {sleep_report.memories_decayed}[/]")
                if sleep_report.dreams:
                    console.print(f"  [dim]Drömde {len(sleep_report.dreams)} drömmar, {len(sleep_report.insights)} insikter[/]")
                    for insight in sleep_report.insights[:2]:
                        console.print(f"    [italic]💡 {sleep_engine.narrate_dream(insight)}[/]")
                log_event(f"SLEEP consolidated={sleep_report.memories_consolidated} decayed={sleep_report.memories_decayed} dreams={len(sleep_report.dreams)} insights={len(sleep_report.insights)}")
                progress.setdefault("sleep_stats", {"total_nights": 0, "total_consolidated": 0, "total_dreams": 0, "total_insights": 0})
                progress["sleep_stats"]["total_consolidated"] += sleep_report.memories_consolidated
                progress["sleep_stats"]["total_dreams"] += len(sleep_report.dreams)
                progress["sleep_stats"]["total_insights"] += len(sleep_report.insights)
                circadian.advance_batch(events_this_batch=0)
                circadian.save_state()
                save_progress(progress)
                continue

            # === VAKEN: Normal träning med circadian-påverkan ===

            # === TERMINAL BATCH: var 10:e batch kör terminal-uppgifter ===
            if batch_num % 10 == 0:
                # Terminal tasks: cap at 5 initially, scale up as terminal_stats improve
                term_solve_rate = progress.get("terminal_stats", {}).get("solve_rate", 0)
                term_max = 5 if term_solve_rate < 0.7 else 7 if term_solve_rate < 0.9 else 9
                term_diff = max(1, min(term_max, progress.get("current_difficulty", 3)))
                console.print(f"[bold white on green] Batch {batch_num} {circ_state.emoji} — 🖥️ TERMINAL Nivå {term_diff} [/]")
                _send_terminal_event({"type": "terminal_batch_start", "batch": batch_num, "difficulty": term_diff, "num_tasks": 5})
                term_batch_solved = 0
                for ti in range(5):
                    if not running:
                        break
                    try:
                        ttask = generate_terminal_task(term_diff)
                        console.print(f"  [green]🖥️ {ttask.id}[/] {ttask.title}", end=" ")
                        _send_terminal_event({"type": "terminal_task_start", "task_id": ttask.id, "title": ttask.title, "difficulty": ttask.difficulty, "category": ttask.category, "task_num": ti + 1, "total_tasks": 5})

                        def _step_cb(step_num, command, result):
                            _send_terminal_event({
                                "type": "terminal_step",
                                "task_id": ttask.id,
                                "step": step_num,
                                "command": command[:200],
                                "output": (result.stdout or "")[:200],
                                "error": (result.stderr or "")[:200] if result.exit_code != 0 else "",
                                "exit_code": result.exit_code,
                            })

                        tresult = terminal_agent.solve_task(ttask, verbose=False, step_callback=_step_cb)
                        session_attempted += 1
                        progress["total_tasks_attempted"] = progress.get("total_tasks_attempted", 0) + 1

                        if tresult.score >= 1.0:
                            session_solved += 1
                            term_batch_solved += 1
                            progress["total_tasks_solved"] = progress.get("total_tasks_solved", 0) + 1
                            console.print(f"[green]✅ {tresult.passed}/{tresult.total}[/] [dim]{tresult.total_time_ms:.0f}ms, {tresult.total_steps} steg[/]")
                            log_event(f"TERMINAL_SOLVED {ttask.id} steps={tresult.total_steps} time={tresult.total_time_ms:.0f}ms")
                        else:
                            console.print(f"[red]❌ {tresult.score:.0%}[/] [dim]{tresult.total_steps} steg[/]")
                            log_event(f"TERMINAL_FAILED {ttask.id} score={tresult.score:.0%} steps={tresult.total_steps}")

                        _send_terminal_event({
                            "type": "terminal_task_done",
                            "task_id": ttask.id, "title": ttask.title,
                            "score": tresult.score, "passed": tresult.passed, "total": tresult.total,
                            "steps": tresult.total_steps, "time_ms": round(tresult.total_time_ms, 1),
                            "feedback": tresult.feedback[:200],
                            "difficulty": ttask.difficulty, "category": ttask.category,
                            "task_num": ti + 1, "total_tasks": 5,
                            "batch_solved": term_batch_solved,
                        })

                        progress["history"].append({
                            "id": ttask.id,
                            "task_id": ttask.id,
                            "score": tresult.score,
                            "difficulty": ttask.difficulty,
                            "category": f"terminal_{ttask.category}",
                            "timestamp": time.time(),
                            "time_ms": round(tresult.total_time_ms, 1),
                            "attempts": tresult.total_steps,
                            "first_try": tresult.score >= 1.0,
                            "strategy": "terminal_agent",
                            "feedback": tresult.feedback[:300],
                            "circadian_phase": circ_state.phase,
                            "circadian_day": circ_state.day_number,
                            "fatigue": round(circ_state.fatigue, 3),
                            "terminal": True,
                        })
                        progress["history"] = progress["history"][-1000:]
                    except Exception as terr:
                        console.print(f"[red]⚠ Terminal error: {terr}[/]")
                        log_event(f"TERMINAL_ERROR {terr}")
                        _send_terminal_event({"type": "terminal_task_error", "error": str(terr), "task_num": ti + 1})

                # Terminal stats
                tstats = terminal_agent.get_stats()
                progress.setdefault("terminal_stats", {})
                progress["terminal_stats"] = {
                    "total_tasks": tstats["total_tasks"],
                    "total_solved": tstats["total_solved"],
                    "solve_rate": round(tstats["solve_rate"], 3),
                    "categories_learned": tstats["categories_learned"],
                    "known_patterns": tstats["known_patterns"],
                }
                _send_terminal_event({
                    "type": "terminal_batch_done", "batch": batch_num,
                    "solved": term_batch_solved, "total": 5,
                    "solve_rate": round(tstats["solve_rate"], 3),
                    "total_solved": tstats["total_solved"], "total_tasks": tstats["total_tasks"],
                })
                circadian.advance_batch(events_this_batch=5)
                circadian.save_state()
                save_progress(progress)
                console.print()
                print_session_stats(progress, session_start, session_solved, session_attempted, agent=agent)
                console.print()
                continue

            # === FRANKENSTEIN 2.0: Nya okända uppgifter (var 7:e batch) ===
            if batch_num % 7 == 0 and batch_num % 10 != 0:
                v2_diff = max(3, min(8, progress.get("current_difficulty", 5)))
                console.print(f"[bold white on red] Batch {batch_num} {circ_state.emoji} — 🧟 FRANKENSTEIN 2.0 (bugfix/api/optimization) [/]")
                v2_solved = 0
                for vi in range(5):
                    if not running:
                        break
                    try:
                        v2task = generate_v2_task(v2_diff)
                        console.print(f"  [red]🧟 {v2task.id}[/] {v2task.title}", end=" ")
                        try:
                            v2result = agent.solve_task(v2task, verbose=False)
                        except Exception as v2err:
                            console.print(f"[red]⚠ {v2err}[/]")
                            log_event(f"V2_ERROR {v2task.id}: {v2err}")
                            continue

                        v2meta: SolveMetadata | None = getattr(v2result, "metadata", None) if v2result else None
                        v2_time_ms = v2meta.total_time_ms if v2meta else 0.0
                        session_attempted += 1
                        progress["total_tasks_attempted"] = progress.get("total_tasks_attempted", 0) + 1

                        if v2result and v2result.score >= 1.0:
                            session_solved += 1
                            v2_solved += 1
                            progress["total_tasks_solved"] = progress.get("total_tasks_solved", 0) + 1
                            console.print(f"[green]✅ {v2result.passed}/{v2result.total}[/] [dim]{v2_time_ms:.0f}ms[/]")
                            log_event(f"V2_SOLVED {v2task.id} ({v2task.category}) time={v2_time_ms:.0f}ms")
                        else:
                            score = v2result.score if v2result else 0
                            console.print(f"[red]❌ {score:.0%}[/]")
                            log_event(f"V2_FAILED {v2task.id} ({v2task.category}) score={score:.0%}")

                        progress["history"].append({
                            "id": v2task.id, "task_id": v2task.id,
                            "score": v2result.score if v2result else 0,
                            "difficulty": v2task.difficulty,
                            "category": v2task.category,
                            "timestamp": time.time(),
                            "time_ms": round(v2_time_ms, 1),
                            "attempts": 1,
                            "first_try": bool(v2result and v2result.score >= 1.0),
                            "strategy": v2meta.winning_strategy if v2meta else "",
                            "feedback": (v2result.feedback if v2result else "")[:300],
                            "v2": True,
                        })
                        progress["history"] = progress["history"][-1000:]
                    except Exception as v2gen_err:
                        console.print(f"[red]⚠ V2 gen error: {v2gen_err}[/]")

                console.print(f"  [dim]V2 batch: {v2_solved}/5 lösta[/]")
                progress.setdefault("v2_stats", {"attempted": 0, "solved": 0})
                progress["v2_stats"]["attempted"] += 5
                progress["v2_stats"]["solved"] += v2_solved
                circadian.advance_batch(events_this_batch=5)
                circadian.save_state()
                save_progress(progress)
                console.print()
                print_session_stats(progress, session_start, session_solved, session_attempted, agent=agent)
                console.print()
                continue

            # === CHAOS MONKEY: Muterade lösningar (var 15:e batch) ===
            if batch_num % 15 == 0 and batch_num % 10 != 0:
                console.print(f"[bold white on dark_red] Batch {batch_num} {circ_state.emoji} — 🐒 CHAOS MONKEY (bugg-injektion) [/]")
                chaos_solved = 0
                for ci in range(5):
                    if not running:
                        break
                    try:
                        # Generate a normal task, solve it deterministically, then mutate
                        base_task = generate_task(random.randint(3, 7))
                        det_code = solve_code_deterministic(base_task)
                        if not det_code:
                            continue
                        chaos = create_chaos_task(base_task, det_code)
                        if not chaos:
                            # Try refactor task instead
                            refactor = generate_refactor_task(base_task, det_code)
                            if refactor:
                                console.print(f"  [yellow]🔧 {refactor.id}[/] {refactor.title}", end=" ")
                                try:
                                    rresult = agent.solve_task(refactor, verbose=False)
                                except Exception:
                                    console.print("[red]⚠[/]")
                                    continue
                                session_attempted += 1
                                progress["total_tasks_attempted"] = progress.get("total_tasks_attempted", 0) + 1
                                if rresult and rresult.score >= 1.0:
                                    session_solved += 1
                                    chaos_solved += 1
                                    progress["total_tasks_solved"] = progress.get("total_tasks_solved", 0) + 1
                                    console.print(f"[green]✅[/]")
                                else:
                                    console.print(f"[red]❌ {rresult.score if rresult else 0:.0%}[/]")
                            continue

                        # Solve the chaos task (broken code → agent must fix)
                        fix_task = chaos.original_task._replace(
                            id=f"chaos-{chaos.mutation_type}-{chaos.original_task.id}",
                            title=f"Fixa: {chaos.original_task.title} ({chaos.mutation_type})",
                            description=(
                                f"{chaos.original_task.description}\n\n"
                                f"OBS: Följande kod har en bugg ({chaos.mutation_description}).\n"
                                f"Fixa den:\n```python\n{chaos.broken_code}\n```"
                            ),
                        ) if hasattr(chaos.original_task, '_replace') else chaos.original_task

                        console.print(f"  [red]🐒 chaos-{chaos.mutation_type}[/] {chaos.mutation_description}", end=" ")
                        try:
                            cresult = agent.solve_task(chaos.original_task, verbose=False)
                        except Exception:
                            console.print("[red]⚠[/]")
                            continue
                        session_attempted += 1
                        progress["total_tasks_attempted"] = progress.get("total_tasks_attempted", 0) + 1
                        if cresult and cresult.score >= 1.0:
                            session_solved += 1
                            chaos_solved += 1
                            progress["total_tasks_solved"] = progress.get("total_tasks_solved", 0) + 1
                            console.print(f"[green]✅[/]")
                        else:
                            console.print(f"[red]❌ {cresult.score if cresult else 0:.0%}[/]")

                        progress["history"].append({
                            "id": f"chaos-{chaos.mutation_type}", "task_id": chaos.original_task.id,
                            "score": cresult.score if cresult else 0,
                            "difficulty": chaos.original_task.difficulty,
                            "category": f"chaos_{chaos.mutation_type}",
                            "timestamp": time.time(),
                            "time_ms": 0, "attempts": 1,
                            "first_try": bool(cresult and cresult.score >= 1.0),
                            "strategy": "chaos_monkey",
                            "feedback": (cresult.feedback if cresult else "")[:300],
                            "chaos": True,
                        })
                        progress["history"] = progress["history"][-1000:]
                    except Exception as cerr:
                        console.print(f"[red]⚠ Chaos error: {cerr}[/]")

                console.print(f"  [dim]Chaos batch: {chaos_solved}/5[/]")
                progress.setdefault("chaos_stats", {"attempted": 0, "solved": 0})
                progress["chaos_stats"]["attempted"] += 5
                progress["chaos_stats"]["solved"] += chaos_solved
                circadian.advance_batch(events_this_batch=5)
                circadian.save_state()
                save_progress(progress)
                console.print()
                print_session_stats(progress, session_start, session_solved, session_attempted, agent=agent)
                console.print()
                continue

            # === SPACED REPETITION: Återbesök svaga kategorier (var 4:e batch) ===
            if sr_scheduler.should_inject_review(batch_num):
                sr_stats = sr_scheduler.get_stats()
                console.print(f"[bold white on dark_green] Batch {batch_num} {circ_state.emoji} — 📅 SPACED REPETITION ({sr_stats['due_for_review']} due, {sr_stats['weak_categories']} weak) [/]")
                sr_solved = 0
                for sri in range(5):
                    if not running:
                        break
                    review = sr_scheduler.pick_review_task_params()
                    if not review:
                        break
                    try:
                        sr_task = generate_task(review["difficulty"])
                        console.print(f"  [dark_green]📅 {sr_task.id}[/] {sr_task.title} [dim]({review['reason']})[/]", end=" ")
                        try:
                            sr_result = agent.solve_task(sr_task, verbose=False)
                        except Exception as sr_err:
                            console.print(f"[red]⚠ {sr_err}[/]")
                            log_event(f"SR_ERROR {sr_task.id}: {sr_err}")
                            continue

                        sr_meta: SolveMetadata | None = getattr(sr_result, "metadata", None) if sr_result else None
                        sr_time_ms = sr_meta.total_time_ms if sr_meta else 0.0
                        sr_first = sr_meta.first_try_success if sr_meta else False
                        sr_strat = sr_meta.winning_strategy if sr_meta else ""
                        session_attempted += 1
                        progress["total_tasks_attempted"] = progress.get("total_tasks_attempted", 0) + 1

                        sr_score = sr_result.score if sr_result else 0
                        sr_scheduler.record_attempt(
                            category=sr_task.category,
                            difficulty=sr_task.difficulty,
                            score=sr_score,
                            first_try=sr_first,
                            time_ms=sr_time_ms,
                        )

                        lvl = str(review["difficulty"])
                        if lvl not in progress["level_stats"]:
                            progress["level_stats"][lvl] = {"attempted": 0, "solved": 0}
                        progress["level_stats"][lvl]["attempted"] += 1

                        if sr_result and sr_score >= 1.0:
                            session_solved += 1
                            sr_solved += 1
                            progress["total_tasks_solved"] = progress.get("total_tasks_solved", 0) + 1
                            progress["level_stats"][lvl]["solved"] += 1
                            progress["current_streak"] = progress.get("current_streak", 0) + 1
                            progress["best_streak"] = max(progress.get("best_streak", 0), progress["current_streak"])
                            progress["total_solve_time_ms"] = progress.get("total_solve_time_ms", 0.0) + sr_time_ms
                            save_solution(sr_task.id, sr_result.code, sr_result.score)
                            console.print(f"[green]✅[/] [dim]{sr_time_ms:.0f}ms[/]")
                            log_event(f"SR_SOLVED {sr_task.id} reason={review['reason']} time={sr_time_ms:.0f}ms")
                        else:
                            progress["current_streak"] = 0
                            console.print(f"[red]❌ {sr_score:.0%}[/]")
                            log_event(f"SR_FAILED {sr_task.id} reason={review['reason']} score={sr_score:.0%}")

                        progress["history"].append({
                            "id": sr_task.id, "task_id": sr_task.id,
                            "score": sr_score,
                            "difficulty": review["difficulty"],
                            "category": sr_task.category,
                            "timestamp": time.time(),
                            "time_ms": round(sr_time_ms, 1),
                            "attempts": sr_meta.attempts_used if sr_meta else 1,
                            "first_try": sr_first,
                            "strategy": sr_strat,
                            "feedback": ((sr_result.feedback if sr_result else "") or "")[:300],
                            "spaced_repetition": True,
                            "sr_reason": review["reason"],
                            "circadian_phase": circ_state.phase,
                            "circadian_day": circ_state.day_number,
                        })
                        progress["history"] = progress["history"][-1000:]
                    except Exception as sr_gen_err:
                        console.print(f"[red]⚠ SR error: {sr_gen_err}[/]")

                console.print(f"  [dim]Spaced Repetition batch: {sr_solved}/5 lösta[/]")
                progress.setdefault("sr_stats", {"attempted": 0, "solved": 0, "reviews": 0})
                progress["sr_stats"]["attempted"] += 5
                progress["sr_stats"]["solved"] += sr_solved
                progress["sr_stats"]["reviews"] += 1
                progress["sr_stats"].update(sr_scheduler.get_stats())
                circadian.advance_batch(events_this_batch=5)
                circadian.save_state()
                save_progress(progress)
                console.print()
                print_session_stats(progress, session_start, session_solved, session_attempted, agent=agent)
                console.print()
                continue

            # Gap fill: var 5:e batch, träna nivåer som missats (< 5 attempts)
            gap_levels = [
                lvl for lvl in range(1, 11)
                if (progress.get("level_stats", {}).get(str(lvl), {}).get("attempted", 0)) < 5
            ]
            if batch_num % 5 == 0 and gap_levels:
                difficulty = random.choice(gap_levels)
                console.print(f"[bold white on magenta] Batch {batch_num} {circ_state.emoji} — GAP FILL Nivå {difficulty} ({progress.get('level_stats', {}).get(str(difficulty), {}).get('attempted', 0)} attempts) [/]")
            elif batch_num % 3 == 0:
                # Cyklisk variation: viktat slumpmässigt val som favoriserar svagare nivåer
                lvl_stats = progress.get("level_stats", {})
                weights = []
                for lvl in range(1, 11):
                    ls = lvl_stats.get(str(lvl), {"attempted": 0, "solved": 0})
                    att = max(ls.get("attempted", 0), 1)
                    sr = ls.get("solved", 0) / att
                    weights.append(max(0.05, 1.0 - sr))
                total_w = sum(weights)
                weights = [w / total_w for w in weights]
                difficulty = random.choices(range(1, 11), weights=weights, k=1)[0]
                console.print(f"[bold white on cyan] Batch {batch_num} {circ_state.emoji} — CYKLISK Nivå {difficulty} [/]")
            else:
                difficulty = adaptive_difficulty(progress)
                # Circadian difficulty modifier: morning_peak → svårare, afternoon_dip → lättare
                difficulty = max(1, min(10, difficulty + circ_state.difficulty_preference))

            progress["current_difficulty"] = difficulty

            if batch_num % 5 != 0 and batch_num % 3 != 0:
                console.print(f"[bold white on blue] Batch {batch_num} {circ_state.emoji} Dag {circ_state.day_number} — Svårighet {difficulty} ({circ_state.phase}) [/]")

            for i in range(10):  # 10 uppgifter per batch
                if not running:
                    break

                task = generate_task(difficulty)
                console.print(f"  [cyan]{task.id}[/] {task.title}", end=" ")

                try:
                    result = agent.solve_task(task, verbose=False)
                except Exception as task_err:
                    console.print(f"[red]⚠ {task_err}[/]")
                    log_event(f"TASK_ERROR {task.id}: {task_err}")
                    time.sleep(5)
                    continue

                # Extrahera metadata om tillgänglig
                meta: SolveMetadata | None = getattr(result, "metadata", None) if result else None
                time_ms = meta.total_time_ms if meta else 0.0
                attempts_used = meta.attempts_used if meta else 0
                first_try = meta.first_try_success if meta else False
                winning_strat = meta.winning_strategy if meta else ""
                category = task.category

                session_attempted += 1
                progress["total_tasks_attempted"] = progress.get("total_tasks_attempted", 0) + 1

                lvl = str(difficulty)
                if lvl not in progress["level_stats"]:
                    progress["level_stats"][lvl] = {"attempted": 0, "solved": 0}
                progress["level_stats"][lvl]["attempted"] += 1

                # Kategori-statistik
                if category not in progress.get("category_stats", {}):
                    progress.setdefault("category_stats", {})[category] = {
                        "attempted": 0, "solved": 0, "first_try": 0, "total_time_ms": 0.0
                    }
                cat_stat = progress["category_stats"][category]
                cat_stat["attempted"] += 1
                cat_stat["total_time_ms"] += time_ms

                if result and result.score >= 1.0:
                    session_solved += 1
                    progress["total_tasks_solved"] = progress.get("total_tasks_solved", 0) + 1
                    progress["level_stats"][lvl]["solved"] += 1
                    progress["current_streak"] = progress.get("current_streak", 0) + 1
                    progress["best_streak"] = max(progress.get("best_streak", 0), progress["current_streak"])
                    progress["total_solve_time_ms"] = progress.get("total_solve_time_ms", 0.0) + time_ms
                    cat_stat["solved"] += 1
                    save_solution(task.id, result.code, result.score)

                    if first_try:
                        progress["first_try_solves"] = progress.get("first_try_solves", 0) + 1
                        cat_stat["first_try"] += 1
                        console.print(f"[green]✅[/] [dim]{time_ms:.0f}ms[/]")
                        log_event(f"SOLVED {task.id} first_try time={time_ms:.0f}ms strat={winning_strat}")
                    else:
                        progress["retry_solves"] = progress.get("retry_solves", 0) + 1
                        console.print(f"[green]✅[/] [dim]({attempts_used} försök, {time_ms:.0f}ms)[/]")
                        log_event(f"SOLVED {task.id} attempts={attempts_used} time={time_ms:.0f}ms strat={winning_strat}")
                else:
                    progress["current_streak"] = 0
                    score = result.score if result else 0
                    console.print(f"[red]❌ {score:.0%}[/] [dim]{time_ms:.0f}ms[/]")
                    log_event(f"FAILED {task.id} score={score:.0%} attempts={attempts_used} time={time_ms:.0f}ms")

                # Spaced Repetition: registrera resultat
                sr_scheduler.record_attempt(
                    category=category,
                    difficulty=difficulty,
                    score=result.score if result else 0,
                    first_try=first_try,
                    time_ms=time_ms,
                )

                # Rik historik-post
                progress["history"].append({
                    "id": task.id,
                    "task_id": task.id,
                    "score": result.score if result else 0,
                    "difficulty": difficulty,
                    "category": category,
                    "timestamp": time.time(),
                    "time_ms": round(time_ms, 1),
                    "attempts": attempts_used,
                    "first_try": first_try,
                    "strategy": winning_strat,
                    "feedback": ((result.feedback if result else "") or "")[:300],
                    "hdc_concept": meta.hdc_concept if meta else "",
                    "hdc_new": meta.hdc_is_new if meta else False,
                    "gut_valence": round(meta.gut_valence, 3) if meta else 0,
                    "gut_rec": meta.gut_recommendation if meta else "",
                    "circadian_phase": circ_state.phase,
                    "circadian_day": circ_state.day_number,
                    "fatigue": round(circ_state.fatigue, 3),
                })
                progress["history"] = progress["history"][-1000:]

                # Uppdatera skills
                if result and result.score >= 1.0:
                    for tag in task.tags:
                        if tag not in progress["skills"]:
                            progress["skills"][tag] = {
                                "pattern": tag,
                                "example_code": result.code[:500],
                                "task_ids": [task.id],
                                "success_rate": 1.0,
                                "times_used": 1,
                            }
                        else:
                            sk = progress["skills"][tag]
                            sk["times_used"] = sk.get("times_used", 0) + 1
                            if task.id not in sk.get("task_ids", []):
                                sk["task_ids"].append(task.id)
                            sk["success_rate"] = 0.9 * sk.get("success_rate", 0.5) + 0.1

            # Circadian: avancera en batch
            batch_solved = sum(1 for h in progress["history"][-10:] if h.get("score", 0) >= 1.0)
            batch_time = sum(h.get("time_ms", 0) for h in progress["history"][-10:])
            circadian.advance_batch(events_this_batch=10, solved=batch_solved, time_ms=batch_time)
            circadian.save_state()

            # Rapport efter varje batch — inkl. Frankenstein-stack stats + trends
            stack_stats = agent.get_stats()
            progress["stack"] = {
                "hdc_concepts": stack_stats.get("hdc_concepts", 0),
                "aif_exploration": stack_stats.get("aif_exploration_weight", 0),
                "aif_surprise": stack_stats.get("aif_surprise", 0),
                "memory_active": stack_stats.get("memory_active", 0),
                "memory_stored": stack_stats.get("memory_total_stored", 0),
                "memory_decayed": stack_stats.get("memory_total_decayed", 0),
                "error_counts": stack_stats.get("error_counts", {}),
                "strategy_success_rates": stack_stats.get("strategy_success_rates", {}),
                "strategy_stats": {s: dict(st) for s, st in stack_stats.get("strategy_stats", {}).items()},
                "gut_feeling": stack_stats.get("gut_feeling", {}),
                "llm_stats": stack_stats.get("llm_stats", {}),
                "emotions": stack_stats.get("emotions", {}),
            }
            # Circadian stats
            progress["circadian"] = {
                "day_number": circ_state.day_number,
                "phase": circ_state.phase,
                "fatigue": round(circ_state.fatigue, 3),
                "analytical": round(circ_state.analytical, 3),
                "creativity": round(circ_state.creativity, 3),
                "phase_stats": circadian.phase_stats,
                "sleep_engine": sleep_engine.get_stats(),
            }
            progress["trends"] = compute_trends(progress)
            # Spaced Repetition stats
            progress["sr_stats"] = sr_scheduler.get_stats()
            save_progress(progress)
            console.print()
            print_session_stats(progress, session_start, session_solved, session_attempted, agent=agent)
            console.print()

    except KeyboardInterrupt:
        console.print("\n[yellow]⏹ Manuellt stoppad.[/]")
    except Exception as e:
        console.print(f"\n[red]⚠ Fel: {e}[/]")
        log_event(f"ERROR: {e}")
    finally:
        # Spara alltid vid avslut
        elapsed = time.time() - session_start
        progress["total_training_seconds"] = progress.get("total_training_seconds", 0) + elapsed
        save_progress(progress)

        console.print(f"\n[bold]💾 Progression sparad till {PROGRESS_FILE}[/]")
        print_session_stats(progress, session_start, session_solved, session_attempted, agent=agent)


def run_forever():
    """Kör träning 24/7 — startar om automatiskt vid fel."""
    while True:
        try:
            run_continuous()
        except KeyboardInterrupt:
            console.print("\n[bold green]✓ Träning stoppad av användare.[/]")
            break
        except Exception as e:
            console.print(f"\n[red]⚠ Krasch: {e}[/]")
            log_event(f"CRASH: {e}")
            console.print("[yellow]🔄 Startar om om 10 sekunder...[/]")
            time.sleep(10)


if __name__ == "__main__":
    run_forever()
