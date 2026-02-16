"""
A/B-test: Frankenstein AI vs Ren LLM (Bare Agent)

Bevisar att Frankenstein-stacken (HDC + AIF + Ebbinghaus) faktiskt
förbättrar resultatet jämfört med att bara använda LLM rakt av.

Kör: python ab_test.py [antal_uppgifter]
     python ab_test.py 30 --bridge-url http://localhost:3031 --modules '{"hdc":true,"aif":true}'
"""

import json
import time
import sys
import os
import re
import io
import requests

# Fix Windows terminal encoding (only if not already wrapped/redirected)
if hasattr(sys.stdout, "buffer") and not isinstance(sys.stdout, io.TextIOWrapper):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "buffer") and not isinstance(sys.stderr, io.TextIOWrapper):
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")
from pathlib import Path
from dataclasses import dataclass, field

from programming_env import Task, EvalResult, evaluate_solution
from task_generator import generate_task
from code_agent import FrankensteinCodeAgent

# Ladda API-nycklar
_env_path = Path(__file__).parent.parent / "bridge" / ".env"
_env_vars: dict[str, str] = {}
if _env_path.exists():
    for line in _env_path.read_text().splitlines():
        if "=" in line and not line.startswith("#"):
            k, v = line.split("=", 1)
            _env_vars[k.strip()] = v.strip()

GEMINI_API_KEY = _env_vars.get("GEMINI_API_KEY", os.environ.get("GEMINI_API_KEY", ""))
XAI_API_KEY = _env_vars.get("XAI_API_KEY", os.environ.get("XAI_API_KEY", ""))


class BareLLMAgent:
    """Ren LLM-agent utan Frankenstein-stack.
    
    Samma LLM, samma prompt-format, samma retry-logik,
    men INGEN HDC, INGEN Active Inference, INGET Ebbinghaus-minne.
    Alltid "direct" strategi. Ingen mönsterigenkänning.
    """

    def __init__(self, max_attempts: int = 3):
        self.max_attempts = max_attempts
        self.total_tasks = 0
        self.total_solved = 0

    def _call_llm(self, prompt: str) -> str | None:
        if GEMINI_API_KEY:
            try:
                resp = requests.post(
                    f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={GEMINI_API_KEY}",
                    json={"contents": [{"parts": [{"text": prompt}]}]},
                    timeout=30,
                )
                if resp.status_code == 200:
                    data = resp.json()
                    candidates = data.get("candidates", [])
                    if candidates:
                        parts = candidates[0].get("content", {}).get("parts", [])
                        if parts:
                            return parts[0].get("text", "")
            except Exception:
                pass

        if XAI_API_KEY:
            try:
                resp = requests.post(
                    "https://api.x.ai/v1/chat/completions",
                    headers={"Authorization": f"Bearer {XAI_API_KEY}"},
                    json={
                        "model": "grok-3-mini-fast",
                        "messages": [{"role": "user", "content": prompt}],
                        "max_tokens": 1000,
                        "temperature": 0.3,
                    },
                    timeout=30,
                )
                if resp.status_code == 200:
                    data = resp.json()
                    choices = data.get("choices", [])
                    if choices:
                        return choices[0].get("message", {}).get("content", "")
            except Exception:
                pass
        return None

    def _extract_code(self, llm_response: str) -> str:
        pattern = r"```python\s*\n(.*?)```"
        matches = re.findall(pattern, llm_response, re.DOTALL)
        if matches:
            return matches[0].strip()
        pattern = r"```\s*\n(.*?)```"
        matches = re.findall(pattern, llm_response, re.DOTALL)
        if matches:
            return matches[0].strip()
        return llm_response.strip()

    def _build_prompt(self, task: Task, prev_attempts: list[dict] = None) -> str:
        prompt = (
            "Du ar en expert Python-programmerare. Svara BARA med Python-kod i ett ```python``` block. "
            "Ingen forklaring. Koden maste lasa fran stdin med input() och skriva till stdout med print().\n\n"
        )
        prompt += f"UPPGIFT: {task.title}\n{task.description}\n\n"

        if task.test_cases:
            prompt += "TESTFALL:\n"
            for i, tc in enumerate(task.test_cases[:3]):
                prompt += f"  Test {i+1}: Input: {tc.input_data.strip()} -> Output: {tc.expected_output}\n"
            prompt += "\n"

        if prev_attempts:
            prompt += "TIDIGARE FORSOK (misslyckade):\n"
            for att in prev_attempts[-2:]:
                prompt += f"Kod:\n```python\n{att['code']}\n```\n"
                prompt += f"Feedback: {att['feedback']}\n\n"
            prompt += "Fixa felen. Testa mentalt mot testfallen.\n\n"

        prompt += "Svara BARA med ```python``` kodblock:"
        return prompt

    def solve_task(self, task: Task, verbose: bool = False) -> EvalResult | None:
        self.total_tasks += 1
        prev_attempts = []
        best_result = None

        for attempt_num in range(self.max_attempts):
            prompt = self._build_prompt(task, prev_attempts if prev_attempts else None)
            llm_response = self._call_llm(prompt)

            if not llm_response:
                continue

            code = self._extract_code(llm_response)
            if not code:
                continue

            eval_result = evaluate_solution(task, code)

            prev_attempts.append({
                "code": code,
                "feedback": eval_result.feedback,
            })

            if best_result is None or eval_result.score > best_result.score:
                best_result = eval_result

            if eval_result.score >= 1.0:
                self.total_solved += 1
                break

        return best_result


@dataclass
class ABResult:
    task_id: str
    difficulty: int
    category: str
    frankenstein_score: float
    frankenstein_attempts: int
    frankenstein_time_ms: float
    bare_score: float
    bare_attempts: int
    bare_time_ms: float


def _send_event(bridge_url: str | None, event: dict):
    """Skicka event till bridge för realtids-UI."""
    if not bridge_url:
        return
    try:
        requests.post(
            f"{bridge_url}/api/frankenstein/ab-test/event",
            json={"event": event},
            timeout=3,
        )
    except Exception:
        pass


def run_ab_test(
    num_tasks: int = 50,
    difficulties: list[int] = None,
    module_config: dict[str, bool] | None = None,
    bridge_url: str | None = None,
):
    """Kör A/B-test med samma uppgifter för båda agenterna.
    
    Args:
        module_config: Dict med modul-nycklar -> bool. Styr vilka moduler
                       Frankenstein-agenten ska använda. None = alla på.
    """
    if difficulties is None:
        difficulties = [3, 4, 5, 6, 7, 8]

    print("=" * 70)
    print("  🧪 A/B-TEST: Frankenstein AI vs Ren LLM")
    print("=" * 70)
    print(f"  Uppgifter: {num_tasks}")
    print(f"  Svårigheter: {difficulties}")
    print(f"  Max försök per uppgift: 3")
    if module_config:
        enabled = [k for k, v in module_config.items() if v]
        disabled = [k for k, v in module_config.items() if not v]
        print(f"  Moduler PÅ:  {', '.join(enabled) if enabled else '(inga)'}")
        print(f"  Moduler AV:  {', '.join(disabled) if disabled else '(inga)'}")
    else:
        print(f"  Moduler: ALLA PÅ")
    print("=" * 70)

    # Skriv module-config till config.json så code_agent läser den
    if module_config is not None:
        config_path = Path(__file__).parent / "training_data" / "config.json"
        try:
            if config_path.exists():
                cfg = json.loads(config_path.read_text(encoding="utf-8"))
            else:
                cfg = {"modules": {}}
            for key, enabled in module_config.items():
                if key in cfg.get("modules", {}):
                    cfg["modules"][key]["enabled"] = enabled
                else:
                    cfg.setdefault("modules", {})[key] = {"enabled": enabled, "label": key, "description": ""}
            config_path.write_text(json.dumps(cfg, indent=2, ensure_ascii=False), encoding="utf-8")
        except Exception as e:
            print(f"  ⚠ Kunde inte skriva config: {e}")

    _send_event(bridge_url, {
        "type": "ab_started",
        "num_tasks": num_tasks,
        "difficulties": difficulties,
        "module_config": module_config,
    })

    # Generera uppgifter i förväg (samma för båda)
    tasks = []
    per_level = max(1, num_tasks // len(difficulties))
    for diff in difficulties:
        for _ in range(per_level):
            tasks.append(generate_task(diff))
    tasks = tasks[:num_tasks]

    print(f"\n  Genererade {len(tasks)} uppgifter")
    print(f"  Per nivå: {per_level}\n")

    # Skapa agenter
    frank_agent = FrankensteinCodeAgent(max_attempts=3)
    bare_agent = BareLLMAgent(max_attempts=3)

    results: list[ABResult] = []
    frank_solved = 0
    bare_solved = 0
    frank_first_try = 0
    bare_first_try = 0

    for i, task in enumerate(tasks):
        print(f"[{i+1}/{len(tasks)}] Nivå {task.difficulty}: {task.title}")

        # --- Frankenstein ---
        print(f"  🧟 Frankenstein... ", end="", flush=True)
        t0 = time.time()
        try:
            frank_result = frank_agent.solve_task(task, verbose=False)
        except Exception as e:
            print(f"⚠ {e}")
            frank_result = None
        frank_time = (time.time() - t0) * 1000
        frank_score = frank_result.score if frank_result else 0
        frank_att = len([a for a in frank_agent.all_attempts if a.task_id == task.id])
        if frank_score >= 1.0:
            frank_solved += 1
            if frank_att <= 1:
                frank_first_try += 1
            print(f"✅ ({frank_att} försök, {frank_time:.0f}ms)")
        else:
            print(f"❌ {frank_score:.0%} ({frank_att} försök, {frank_time:.0f}ms)")

        # Rate limit delay
        time.sleep(1)

        # --- Bare LLM ---
        print(f"  📝 Ren LLM...      ", end="", flush=True)
        t0 = time.time()
        try:
            bare_result = bare_agent.solve_task(task, verbose=False)
        except Exception as e:
            print(f"⚠ {e}")
            bare_result = None
        bare_time = (time.time() - t0) * 1000
        bare_score = bare_result.score if bare_result else 0
        bare_att = 0
        # Bare agent doesn't track attempts the same way, estimate from result
        if bare_result:
            bare_att = 1 if bare_score >= 1.0 else 3
        if bare_score >= 1.0:
            bare_solved += 1
            if bare_att <= 1:
                bare_first_try += 1
            print(f"✅ ({bare_time:.0f}ms)")
        else:
            print(f"❌ {bare_score:.0%} ({bare_time:.0f}ms)")

        results.append(ABResult(
            task_id=task.id,
            difficulty=task.difficulty,
            category=task.category,
            frankenstein_score=frank_score,
            frankenstein_attempts=frank_att,
            frankenstein_time_ms=frank_time,
            bare_score=bare_score,
            bare_attempts=bare_att,
            bare_time_ms=bare_time,
        ))

        # Skicka progress-event till bridge
        _send_event(bridge_url, {
            "type": "ab_task_done",
            "task_num": i + 1,
            "total_tasks": len(tasks),
            "difficulty": task.difficulty,
            "category": task.category,
            "title": task.title,
            "frank_score": frank_score,
            "frank_time_ms": round(frank_time, 1),
            "bare_score": bare_score,
            "bare_time_ms": round(bare_time, 1),
            "frank_solved": frank_solved,
            "bare_solved": bare_solved,
        })

        # Rate limit delay
        time.sleep(1)

        # Mellanrapport var 10:e uppgift
        if (i + 1) % 10 == 0:
            done = i + 1
            print(f"\n  --- Mellanrapport ({done}/{len(tasks)}) ---")
            print(f"  Frankenstein: {frank_solved}/{done} ({frank_solved/done:.0%})")
            print(f"  Ren LLM:     {bare_solved}/{done} ({bare_solved/done:.0%})")
            diff = frank_solved - bare_solved
            print(f"  Skillnad:    {'+' if diff >= 0 else ''}{diff} uppgifter")
            print()

    # === SLUTRAPPORT ===
    total = len(results)
    print("\n" + "=" * 70)
    print("  📊 SLUTRAPPORT: A/B-TEST")
    print("=" * 70)

    print(f"\n  {'Metrik':<30} {'Frankenstein':>14} {'Ren LLM':>14} {'Diff':>10}")
    print(f"  {'-'*30} {'-'*14} {'-'*14} {'-'*10}")

    frank_rate = frank_solved / max(total, 1)
    bare_rate = bare_solved / max(total, 1)
    diff_rate = frank_rate - bare_rate
    print(f"  {'Lösta uppgifter':<30} {f'{frank_solved}/{total}':>14} {f'{bare_solved}/{total}':>14} {f'{diff_rate:+.1%}':>10}")

    print(f"  {'Lösningsgrad':<30} {f'{frank_rate:.0%}':>14} {f'{bare_rate:.0%}':>14} {f'{diff_rate:+.1%}':>10}")

    frank_ft = frank_first_try / max(total, 1)
    bare_ft = bare_first_try / max(total, 1)
    diff_ft = frank_ft - bare_ft
    print(f"  {'First-try rate':<30} {f'{frank_ft:.0%}':>14} {f'{bare_ft:.0%}':>14} {f'{diff_ft:+.1%}':>10}")

    frank_avg_time = sum(r.frankenstein_time_ms for r in results) / max(total, 1)
    bare_avg_time = sum(r.bare_time_ms for r in results) / max(total, 1)
    print(f"  {'Snitt tid/uppgift':<30} {f'{frank_avg_time:.0f}ms':>14} {f'{bare_avg_time:.0f}ms':>14}")

    # Per nivå
    print(f"\n  Per svårighetsnivå:")
    for diff in sorted(set(r.difficulty for r in results)):
        level_results = [r for r in results if r.difficulty == diff]
        n = len(level_results)
        fs = sum(1 for r in level_results if r.frankenstein_score >= 1.0)
        bs = sum(1 for r in level_results if r.bare_score >= 1.0)
        fr = fs / max(n, 1)
        br = bs / max(n, 1)
        d = fr - br
        winner = "🧟" if d > 0 else ("📝" if d < 0 else "🤝")
        print(f"    Nivå {diff}: Frankenstein {fs}/{n} ({fr:.0%}) vs Ren LLM {bs}/{n} ({br:.0%}) {winner} {d:+.0%}")

    # Frankenstein-specifik stats
    frank_stats = frank_agent.get_stats()
    print(f"\n  Frankenstein Stack:")
    print(f"    HDC Koncept:      {frank_stats['hdc_concepts']}")
    print(f"    AIF Exploration:  {frank_stats['aif_exploration_weight']:.2f}")
    print(f"    AIF Surprise:     {frank_stats['aif_surprise']:.2f}")
    print(f"    Minnen aktiva:    {frank_stats['memory_active']}")
    print(f"    Strategier:       {frank_stats['strategy_success_rates']}")

    # Slutsats
    print(f"\n  {'='*60}")
    if diff_rate > 0.05:
        print(f"  ✅ FRANKENSTEIN VINNER med {diff_rate:.1%} högre lösningsgrad!")
        print(f"     Bio-inspirerad meta-learning förbättrar resultatet.")
    elif diff_rate < -0.05:
        print(f"  ❌ REN LLM VINNER med {-diff_rate:.1%} högre lösningsgrad.")
        print(f"     Frankenstein-stacken behöver justeras.")
    else:
        print(f"  🤝 OAVGJORT (skillnad: {diff_rate:+.1%})")
        print(f"     Behöver fler uppgifter eller svårare nivåer för att skilja.")
    print(f"  {'='*60}")

    # Spara resultat
    output = {
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "num_tasks": total,
        "difficulties": difficulties,
        "module_config": module_config,
        "frankenstein": {
            "solved": frank_solved,
            "total": total,
            "solve_rate": round(frank_rate, 3),
            "first_try_rate": round(frank_ft, 3),
            "avg_time_ms": round(frank_avg_time, 1),
            "stack_stats": frank_stats,
        },
        "bare_llm": {
            "solved": bare_solved,
            "total": total,
            "solve_rate": round(bare_rate, 3),
            "first_try_rate": round(bare_ft, 3),
            "avg_time_ms": round(bare_avg_time, 1),
        },
        "difference": {
            "solve_rate": round(diff_rate, 3),
            "first_try_rate": round(diff_ft, 3),
            "winner": "frankenstein" if diff_rate > 0.05 else ("bare_llm" if diff_rate < -0.05 else "tie"),
        },
        "per_level": {},
        "results": [
            {
                "task_id": r.task_id,
                "difficulty": r.difficulty,
                "category": r.category,
                "frankenstein_score": r.frankenstein_score,
                "bare_score": r.bare_score,
                "frankenstein_time_ms": round(r.frankenstein_time_ms, 1),
                "bare_time_ms": round(r.bare_time_ms, 1),
            }
            for r in results
        ],
    }

    for diff in sorted(set(r.difficulty for r in results)):
        level_results = [r for r in results if r.difficulty == diff]
        n = len(level_results)
        fs = sum(1 for r in level_results if r.frankenstein_score >= 1.0)
        bs = sum(1 for r in level_results if r.bare_score >= 1.0)
        output["per_level"][str(diff)] = {
            "frankenstein": {"solved": fs, "total": n, "rate": round(fs/max(n,1), 3)},
            "bare_llm": {"solved": bs, "total": n, "rate": round(bs/max(n,1), 3)},
        }

    data_dir = Path(__file__).parent / "training_data"
    data_dir.mkdir(exist_ok=True)

    # Spara individuellt test med tidsstämpel
    ts = time.strftime("%Y%m%d_%H%M%S")
    run_path = data_dir / f"ab_test_{ts}.json"
    with open(run_path, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)
    print(f"\n  💾 Test #{ts} sparat till {run_path}")

    # Aggregera alla tester till en sammanställning
    all_runs = []
    for p in sorted(data_dir.glob("ab_test_2*.json")):
        try:
            all_runs.append(json.loads(p.read_text(encoding="utf-8")))
        except Exception:
            pass

    if all_runs:
        total_tasks = sum(r["num_tasks"] for r in all_runs)
        total_frank = sum(r["frankenstein"]["solved"] for r in all_runs)
        total_bare = sum(r["bare_llm"]["solved"] for r in all_runs)
        agg = {
            "num_runs": len(all_runs),
            "total_tasks": total_tasks,
            "timestamp": all_runs[-1]["timestamp"],
            "frankenstein": {
                "solved": total_frank,
                "total": total_tasks,
                "solve_rate": round(total_frank / max(total_tasks, 1), 3),
                "first_try_rate": round(sum(r["frankenstein"].get("first_try_rate", 0) * r["num_tasks"] for r in all_runs) / max(total_tasks, 1), 3),
                "avg_time_ms": round(sum(r["frankenstein"].get("avg_time_ms", 0) * r["num_tasks"] for r in all_runs) / max(total_tasks, 1), 1),
            },
            "bare_llm": {
                "solved": total_bare,
                "total": total_tasks,
                "solve_rate": round(total_bare / max(total_tasks, 1), 3),
                "first_try_rate": round(sum(r["bare_llm"].get("first_try_rate", 0) * r["num_tasks"] for r in all_runs) / max(total_tasks, 1), 3),
                "avg_time_ms": round(sum(r["bare_llm"].get("avg_time_ms", 0) * r["num_tasks"] for r in all_runs) / max(total_tasks, 1), 1),
            },
            "difference": {
                "solve_rate": round((total_frank - total_bare) / max(total_tasks, 1), 3),
                "winner": "frankenstein" if total_frank > total_bare + total_tasks * 0.05 else ("bare_llm" if total_bare > total_frank + total_tasks * 0.05 else "tie"),
            },
            "per_level": {},
            "runs": [{"timestamp": r["timestamp"], "num_tasks": r["num_tasks"], "frank_rate": r["frankenstein"]["solve_rate"], "bare_rate": r["bare_llm"]["solve_rate"]} for r in all_runs],
        }
        # Aggregera per nivå
        all_levels = set()
        for r in all_runs:
            all_levels.update(r.get("per_level", {}).keys())
        for lvl in sorted(all_levels):
            fs = sum(r.get("per_level", {}).get(lvl, {}).get("frankenstein", {}).get("solved", 0) for r in all_runs)
            bs = sum(r.get("per_level", {}).get(lvl, {}).get("bare_llm", {}).get("solved", 0) for r in all_runs)
            n = sum(r.get("per_level", {}).get(lvl, {}).get("frankenstein", {}).get("total", 0) for r in all_runs)
            agg["per_level"][lvl] = {
                "frankenstein": {"solved": fs, "total": n, "rate": round(fs / max(n, 1), 3)},
                "bare_llm": {"solved": bs, "total": n, "rate": round(bs / max(n, 1), 3)},
            }

        agg_path = data_dir / "ab_test_results.json"
        with open(agg_path, "w", encoding="utf-8") as f:
            json.dump(agg, f, indent=2, ensure_ascii=False)
        print(f"  � Aggregerat {len(all_runs)} tester → {agg_path}")
        print(f"     Totalt: Frankenstein {total_frank}/{total_tasks} ({total_frank/max(total_tasks,1):.0%}) vs Ren LLM {total_bare}/{total_tasks} ({total_bare/max(total_tasks,1):.0%})")

    # Skicka completion-event till bridge
    _send_event(bridge_url, {
        "type": "ab_completed",
        "output": output,
    })

    return output


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="A/B-test: Frankenstein AI vs Ren LLM")
    parser.add_argument("num_tasks", nargs="?", type=int, default=30, help="Antal uppgifter")
    parser.add_argument("--bridge-url", type=str, default=None, help="Bridge URL för realtids-events")
    parser.add_argument("--modules", type=str, default=None, help='JSON dict med modul-toggles, t.ex. {"hdc":true,"aif":false}')
    args = parser.parse_args()

    mcfg = None
    if args.modules:
        mcfg = json.loads(args.modules)

    run_ab_test(
        num_tasks=args.num_tasks,
        module_config=mcfg,
        bridge_url=args.bridge_url,
    )
