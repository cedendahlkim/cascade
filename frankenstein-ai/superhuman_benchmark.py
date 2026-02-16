"""
Superhuman Benchmark: Frankenstein AI vs Gemini 2.0 Flash

Testar ÖVERMÄNSKLIGA uppgifter (difficulty 11-14):
- chain_reasoning: Multi-step kedjeproblem
- security_audit: Hitta sårbarheter i kod
- devops_debug: Infrastruktur-debugging
- massive_scale: Storskalig analys & optimering
- cross_domain: Problem som kräver 3+ domäner
- adversarial: Subtilt trasig kod, edge cases
- real_world_auto: Komplex automation

Resultat sparas lokalt + laddas upp till Bridge för mobil.

Kör: python superhuman_benchmark.py [--tasks-per-category 3] [--bridge-url http://localhost:3031]
"""

import json
import time
import sys
import os
import re
import base64
import random
import requests
from pathlib import Path
from dataclasses import dataclass, asdict
from datetime import datetime

# Fix Windows terminal encoding
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

from programming_env import Task, EvalResult, evaluate_solution
from task_generator_v3 import generate_v3_task, V3_CATEGORIES, V3_GENERATORS
from code_agent import FrankensteinCodeAgent, SolveMetadata

# Load API keys from bridge .env
_env_path = Path(__file__).parent.parent / "bridge" / ".env"
_env_vars: dict[str, str] = {}
if _env_path.exists():
    for line in _env_path.read_text().splitlines():
        if "=" in line and not line.startswith("#"):
            k, v = line.split("=", 1)
            _env_vars[k.strip()] = v.strip()

GEMINI_API_KEY = _env_vars.get("GEMINI_API_KEY", os.environ.get("GEMINI_API_KEY", ""))


class GeminiAgent:
    """Ren Gemini 2.0 Flash — ingen Frankenstein-stack."""

    MODEL = "gemini-2.0-flash"

    def __init__(self, max_attempts: int = 3):
        self.max_attempts = max_attempts
        self.total_tasks = 0
        self.total_solved = 0
        self.total_first_try = 0
        self.total_time_ms = 0.0
        self.per_category: dict[str, dict] = {}

    def _call_gemini(self, prompt: str) -> str | None:
        if not GEMINI_API_KEY:
            return None
        try:
            resp = requests.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/{self.MODEL}:generateContent?key={GEMINI_API_KEY}",
                json={
                    "contents": [{"parts": [{"text": prompt}]}],
                    "generationConfig": {"temperature": 0.3, "maxOutputTokens": 4096},
                },
                timeout=60,
            )
            if resp.status_code == 200:
                data = resp.json()
                candidates = data.get("candidates", [])
                if candidates:
                    parts = candidates[0].get("content", {}).get("parts", [])
                    if parts:
                        return parts[0].get("text", "")
            elif resp.status_code == 429:
                time.sleep(5)
                return self._call_gemini(prompt)
        except Exception:
            pass
        return None

    def _extract_code(self, response: str) -> str:
        pattern = r"```python\s*\n(.*?)```"
        matches = re.findall(pattern, response, re.DOTALL)
        if matches:
            return matches[0].strip()
        pattern = r"```\s*\n(.*?)```"
        matches = re.findall(pattern, response, re.DOTALL)
        if matches:
            return matches[0].strip()
        return response.strip()

    def _build_prompt(self, task: Task, prev_attempts: list[dict] | None = None) -> str:
        prompt = (
            "Du ar en expert Python-programmerare. Svara BARA med Python-kod i ett ```python``` block. "
            "Ingen forklaring. Koden maste lasa fran stdin med input() och skriva till stdout med print().\n\n"
        )
        prompt += f"UPPGIFT: {task.title}\n{task.description}\n\n"
        if task.test_cases:
            prompt += "TESTFALL:\n"
            for i, tc in enumerate(task.test_cases[:3]):
                inp = tc.input_data.strip()[:300]
                exp = tc.expected_output[:200]
                prompt += f"  Test {i+1}: Input: {inp} -> Output: {exp}\n"
            prompt += "\n"
        if task.hints:
            prompt += f"LEDTRAD: {task.hints[0]}\n\n"
        if prev_attempts:
            prompt += "TIDIGARE FORSOK (misslyckade):\n"
            for att in prev_attempts[-2:]:
                prompt += f"Kod:\n```python\n{att['code'][:500]}\n```\n"
                prompt += f"Feedback: {att['feedback'][:200]}\n\n"
            prompt += "Fixa felen. Testa mentalt mot testfallen.\n\n"
        prompt += "Svara BARA med ```python``` kodblock:"
        return prompt

    def solve_task(self, task: Task) -> dict:
        self.total_tasks += 1
        cat = task.category
        if cat not in self.per_category:
            self.per_category[cat] = {"attempted": 0, "solved": 0, "first_try": 0, "total_ms": 0.0}
        self.per_category[cat]["attempted"] += 1

        prev_attempts = []
        best_result = None
        t_start = time.time()
        attempts_used = 0

        for attempt_num in range(self.max_attempts):
            attempts_used += 1
            prompt = self._build_prompt(task, prev_attempts if prev_attempts else None)
            response = self._call_gemini(prompt)
            if not response:
                continue

            code = self._extract_code(response)
            if not code:
                continue

            eval_result = evaluate_solution(task, code)
            prev_attempts.append({"code": code, "feedback": eval_result.feedback})

            if best_result is None or eval_result.score > best_result.score:
                best_result = eval_result

            if eval_result.score >= 1.0:
                break

        total_ms = (time.time() - t_start) * 1000
        self.total_time_ms += total_ms

        score = best_result.score if best_result else 0
        solved = score >= 1.0
        first_try = solved and attempts_used == 1

        if solved:
            self.total_solved += 1
            self.per_category[cat]["solved"] += 1
        if first_try:
            self.total_first_try += 1
            self.per_category[cat]["first_try"] += 1
        self.per_category[cat]["total_ms"] += total_ms

        return {
            "score": score,
            "solved": solved,
            "first_try": first_try,
            "attempts": attempts_used,
            "time_ms": round(total_ms, 1),
            "feedback": (best_result.feedback if best_result else "")[:200],
        }


@dataclass
class SuperhumanResult:
    """Result for a single superhuman task comparison."""
    task_id: str
    title: str
    difficulty: int
    category: str
    tags: list[str]
    # Frankenstein
    frank_score: float = 0.0
    frank_solved: bool = False
    frank_first_try: bool = False
    frank_attempts: int = 0
    frank_time_ms: float = 0.0
    frank_strategy: str = ""
    # Gemini
    gemini_score: float = 0.0
    gemini_solved: bool = False
    gemini_first_try: bool = False
    gemini_attempts: int = 0
    gemini_time_ms: float = 0.0


def _send_event(bridge_url: str | None, event: dict):
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


def _upload_to_bridge(bridge_url: str, data: dict, filename: str, description: str) -> str | None:
    try:
        json_str = json.dumps(data, indent=2, ensure_ascii=False)
        b64 = base64.b64encode(json_str.encode("utf-8")).decode("ascii")
        resp = requests.post(
            f"{bridge_url}/api/files/upload",
            json={
                "data": b64,
                "filename": filename,
                "uploadedBy": "ai",
                "description": description,
                "tags": ["benchmark", "superhuman", "frankenstein", "gemini"],
            },
            timeout=10,
        )
        if resp.status_code == 200:
            return resp.json().get("id")
    except Exception as e:
        print(f"  [!] Upload failed: {e}")
    return None


def _generate_markdown_report(data: dict) -> str:
    s = data.get("summary", {})
    f = s.get("frankenstein", {})
    g = s.get("gemini", {})

    lines = [
        f"# SUPERHUMAN Benchmark: Frankenstein AI vs Gemini 2.0 Flash",
        f"",
        f"**Datum:** {data.get('timestamp', '?')}",
        f"**Uppgifter:** {s.get('total_tasks', 0)} (Difficulty {s.get('difficulty_range', '?')})",
        f"**Kategorier:** {', '.join(data.get('categories_tested', []))}",
        f"",
        f"## Sammanfattning",
        f"",
        f"| Metrik | Frankenstein AI | Gemini 2.0 Flash | Skillnad |",
        f"|---|---|---|---|",
        f"| Losta | {f.get('solved', 0)}/{s.get('total_tasks', 0)} ({f.get('solve_rate', 0):.0%}) | {g.get('solved', 0)}/{s.get('total_tasks', 0)} ({g.get('solve_rate', 0):.0%}) | {s.get('diff_solve_rate', 0):+.1%} |",
        f"| First-try | {f.get('first_try', 0)} ({f.get('first_try_rate', 0):.0%}) | {g.get('first_try', 0)} ({g.get('first_try_rate', 0):.0%}) | {s.get('diff_first_try_rate', 0):+.1%} |",
        f"| Snitt tid | {f.get('avg_time_ms', 0):.0f}ms | {g.get('avg_time_ms', 0):.0f}ms | |",
        f"",
        f"**{s.get('winner_text', '?')}**",
        f"",
        f"## Per kategori (Superhuman)",
        f"",
        f"| Kategori | Niva | Frank | Gemini | Diff |",
        f"|---|---|---|---|---|",
    ]

    for cat_data in sorted(data.get("per_category", {}).values(), key=lambda x: x.get("category", "")):
        cat = cat_data.get("category", "?")
        diff_lvl = cat_data.get("avg_difficulty", "?")
        fd = cat_data.get("frankenstein", {})
        gd = cat_data.get("gemini", {})
        n = fd.get("total", 0)
        fr = fd.get("rate", 0)
        gr = gd.get("rate", 0)
        d = fr - gr
        emoji = "🧟" if d > 0 else ("🤖" if d < 0 else "🤝")
        lines.append(f"| {cat} | {diff_lvl} | {fd.get('solved', 0)}/{n} ({fr:.0%}) | {gd.get('solved', 0)}/{n} ({gr:.0%}) | {d:+.0%} {emoji} |")

    # Hardest tasks section
    hardest = data.get("hardest_tasks", [])
    if hardest:
        lines += [
            f"",
            f"## Svaraste uppgifter",
            f"",
            f"| Uppgift | Niva | Frank | Gemini |",
            f"|---|---|---|---|",
        ]
        for t in hardest[:10]:
            f_status = "OK" if t.get("frank_solved") else f"FAIL ({t.get('frank_score', 0):.0%})"
            g_status = "OK" if t.get("gemini_solved") else f"FAIL ({t.get('gemini_score', 0):.0%})"
            lines.append(f"| {t.get('title', '?')[:40]} | {t.get('difficulty', '?')} | {f_status} | {g_status} |")

    # Frankenstein stack stats
    stack = data.get("frankenstein_stack", {})
    if stack:
        lines += [
            f"",
            f"## Frankenstein Stack Stats",
            f"",
            f"- **HDC Koncept:** {stack.get('hdc_concepts', 0)}",
            f"- **AIF Exploration:** {stack.get('aif_exploration', 0):.2f}",
            f"- **Ebbinghaus Minnen:** {stack.get('memory_active', 0)} aktiva / {stack.get('memory_stored', 0)} totalt",
            f"- **Strategier:** {json.dumps(stack.get('strategy_stats', {}), indent=2)}",
        ]

    lines.append("")
    return "\n".join(lines)


def run_superhuman_benchmark(
    tasks_per_category: int = 3,
    bridge_url: str | None = None,
):
    """Run the Superhuman benchmark across all V3 categories."""

    print("=" * 72)
    print("  SUPERHUMAN BENCHMARK: Frankenstein AI vs Gemini 2.0 Flash")
    print("  Difficulty 11-14 — Beyond Human Capability")
    print("=" * 72)

    if not GEMINI_API_KEY:
        print("  [!] GEMINI_API_KEY not found — cannot run benchmark!")
        return None

    total_expected = tasks_per_category * len(V3_CATEGORIES)
    print(f"  Tasks per category: {tasks_per_category}")
    print(f"  Superhuman categories: {len(V3_CATEGORIES)}")
    print(f"  Expected total tasks: {total_expected}")
    print(f"  Categories: {', '.join(V3_CATEGORIES)}")
    print(f"  Bridge URL: {bridge_url or 'none'}")
    print("=" * 72)

    # Generate all tasks
    print("\n  Generating superhuman tasks...")
    all_tasks: list[Task] = []

    for cat_idx, cat in enumerate(V3_CATEGORIES):
        # Use the specific generator for this category
        gen_fn = V3_GENERATORS[cat_idx][1]
        for _ in range(tasks_per_category):
            try:
                task = gen_fn()
                all_tasks.append(task)
            except Exception as e:
                print(f"  [!] Failed to generate {cat} task: {e}")

    random.shuffle(all_tasks)
    print(f"  Generated {len(all_tasks)} superhuman tasks\n")

    # Create agents
    frank_agent = FrankensteinCodeAgent(max_attempts=3)
    gemini_agent = GeminiAgent(max_attempts=3)

    results: list[SuperhumanResult] = []
    frank_total_solved = 0
    gemini_total_solved = 0

    _send_event(bridge_url, {
        "type": "ab_started",
        "num_tasks": len(all_tasks),
        "benchmark_type": "superhuman",
        "categories": V3_CATEGORIES,
    })

    for i, task in enumerate(all_tasks):
        task_num = i + 1
        print(f"[{task_num}/{len(all_tasks)}] Nv{task.difficulty} {task.category}: {task.title}")

        # === FRANKENSTEIN ===
        print(f"  🧟 Frankenstein... ", end="", flush=True)
        t0 = time.time()
        try:
            frank_result = frank_agent.solve_task(task, verbose=False)
        except Exception as e:
            print(f"ERR: {e}")
            frank_result = None
        frank_ms = (time.time() - t0) * 1000

        frank_meta: SolveMetadata | None = getattr(frank_result, "metadata", None) if frank_result else None
        frank_score = frank_result.score if frank_result else 0
        frank_solved = frank_score >= 1.0
        frank_first = frank_meta.first_try_success if frank_meta else False
        frank_strat = frank_meta.winning_strategy if frank_meta else ""
        frank_att = frank_meta.attempts_used if frank_meta else 0

        if frank_solved:
            frank_total_solved += 1
            print(f"OK ({frank_att} att, {frank_ms:.0f}ms, {frank_strat})")
        else:
            print(f"FAIL {frank_score:.0%} ({frank_ms:.0f}ms)")

        time.sleep(0.5)

        # === GEMINI ===
        print(f"  🤖 Gemini 2.0...   ", end="", flush=True)
        gemini_res = gemini_agent.solve_task(task)
        gemini_score = gemini_res["score"]
        gemini_solved = gemini_res["solved"]

        if gemini_solved:
            gemini_total_solved += 1
            print(f"OK ({gemini_res['attempts']} att, {gemini_res['time_ms']:.0f}ms)")
        else:
            print(f"FAIL {gemini_score:.0%} ({gemini_res['time_ms']:.0f}ms)")

        results.append(SuperhumanResult(
            task_id=task.id,
            title=task.title,
            difficulty=task.difficulty,
            category=task.category,
            tags=task.tags or [],
            frank_score=frank_score,
            frank_solved=frank_solved,
            frank_first_try=frank_first,
            frank_attempts=frank_att,
            frank_time_ms=round(frank_ms, 1),
            frank_strategy=frank_strat,
            gemini_score=gemini_score,
            gemini_solved=gemini_solved,
            gemini_first_try=gemini_res["first_try"],
            gemini_attempts=gemini_res["attempts"],
            gemini_time_ms=gemini_res["time_ms"],
        ))

        _send_event(bridge_url, {
            "type": "ab_task_done",
            "task_num": task_num,
            "total_tasks": len(all_tasks),
            "difficulty": task.difficulty,
            "category": task.category,
            "title": task.title,
            "frank_score": frank_score,
            "frank_time_ms": round(frank_ms, 1),
            "bare_score": gemini_score,
            "bare_time_ms": gemini_res["time_ms"],
            "frank_solved": frank_total_solved,
            "bare_solved": gemini_total_solved,
            "benchmark_type": "superhuman",
        })

        time.sleep(1)

        if task_num % 5 == 0:
            print(f"\n  --- Progress {task_num}/{len(all_tasks)} ---")
            print(f"  Frankenstein: {frank_total_solved}/{task_num} ({frank_total_solved/task_num:.0%})")
            print(f"  Gemini 2.0:  {gemini_total_solved}/{task_num} ({gemini_total_solved/task_num:.0%})")
            diff = frank_total_solved - gemini_total_solved
            print(f"  Diff: {'+' if diff >= 0 else ''}{diff}\n")

    # === BUILD REPORT ===
    total = len(results)
    if total == 0:
        print("  [!] No tasks completed!")
        return None

    frank_ft = sum(1 for r in results if r.frank_first_try)
    gemini_ft = sum(1 for r in results if r.gemini_first_try)
    frank_avg_ms = sum(r.frank_time_ms for r in results) / total
    gemini_avg_ms = sum(r.gemini_time_ms for r in results) / total
    frank_rate = frank_total_solved / total
    gemini_rate = gemini_total_solved / total
    diff_rate = frank_rate - gemini_rate

    if diff_rate > 0.05:
        winner_text = f"Frankenstein AI vinner med {diff_rate:.1%} hogre losningsgrad pa SUPERHUMAN-uppgifter!"
    elif diff_rate < -0.05:
        winner_text = f"Gemini 2.0 Flash vinner med {-diff_rate:.1%} hogre losningsgrad pa SUPERHUMAN-uppgifter."
    else:
        winner_text = f"Oavgjort pa SUPERHUMAN-niva (skillnad: {diff_rate:+.1%})"

    # Per category
    per_category = {}
    for cat in V3_CATEGORIES:
        cr = [r for r in results if r.category == cat]
        if not cr:
            continue
        n = len(cr)
        fs = sum(1 for r in cr if r.frank_solved)
        gs = sum(1 for r in cr if r.gemini_solved)
        fft = sum(1 for r in cr if r.frank_first_try)
        gft = sum(1 for r in cr if r.gemini_first_try)
        avg_diff = sum(r.difficulty for r in cr) / n
        per_category[cat] = {
            "category": cat,
            "avg_difficulty": round(avg_diff, 1),
            "frankenstein": {"solved": fs, "total": n, "rate": round(fs / n, 3), "first_try": fft},
            "gemini": {"solved": gs, "total": n, "rate": round(gs / n, 3), "first_try": gft},
        }

    # Hardest tasks (both failed or lowest scores)
    hardest = sorted(results, key=lambda r: (r.frank_score + r.gemini_score, -r.difficulty))
    hardest_data = [
        {
            "title": r.title,
            "difficulty": r.difficulty,
            "category": r.category,
            "frank_solved": r.frank_solved,
            "frank_score": r.frank_score,
            "gemini_solved": r.gemini_solved,
            "gemini_score": r.gemini_score,
        }
        for r in hardest[:10]
    ]

    # Strategy distribution
    strat_counts: dict[str, int] = {}
    for r in results:
        s = r.frank_strategy or "unknown"
        strat_counts[s] = strat_counts.get(s, 0) + 1

    # Frankenstein stack stats
    stack_stats = frank_agent.get_stats()

    output = {
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "benchmark_type": "superhuman",
        "categories_tested": list(set(r.category for r in results)),
        "summary": {
            "total_tasks": total,
            "difficulty_range": f"{min(r.difficulty for r in results)}-{max(r.difficulty for r in results)}",
            "frankenstein": {
                "solved": frank_total_solved,
                "solve_rate": round(frank_rate, 3),
                "first_try": frank_ft,
                "first_try_rate": round(frank_ft / total, 3),
                "avg_time_ms": round(frank_avg_ms, 1),
            },
            "gemini": {
                "model": GeminiAgent.MODEL,
                "solved": gemini_total_solved,
                "solve_rate": round(gemini_rate, 3),
                "first_try": gemini_ft,
                "first_try_rate": round(gemini_ft / total, 3),
                "avg_time_ms": round(gemini_avg_ms, 1),
            },
            "diff_solve_rate": round(diff_rate, 3),
            "diff_first_try_rate": round((frank_ft - gemini_ft) / total, 3),
            "winner": "frankenstein" if diff_rate > 0.05 else ("gemini" if diff_rate < -0.05 else "tie"),
            "winner_text": winner_text,
        },
        "per_category": per_category,
        "hardest_tasks": hardest_data,
        "strategy_distribution": strat_counts,
        "frankenstein_stack": {
            "hdc_concepts": stack_stats.get("hdc_concepts", 0),
            "aif_exploration": stack_stats.get("aif_exploration_weight", 0),
            "aif_surprise": stack_stats.get("aif_surprise", 0),
            "memory_active": stack_stats.get("memory_active", 0),
            "memory_stored": stack_stats.get("memory_total_stored", 0),
            "memory_decayed": stack_stats.get("memory_total_decayed", 0),
            "strategy_stats": {s: dict(st) for s, st in stack_stats.get("strategy_stats", {}).items()},
            "gut_feeling": stack_stats.get("gut_feeling", {}),
            "emotions": stack_stats.get("emotions", {}),
        },
        "results": [asdict(r) for r in results],
    }

    # === PRINT REPORT ===
    print("\n" + "=" * 72)
    print("  SUPERHUMAN BENCHMARK — SLUTRAPPORT")
    print("=" * 72)
    print(f"\n  {'Metrik':<30} {'Frankenstein':>14} {'Gemini 2.0':>14} {'Diff':>10}")
    print(f"  {'-'*30} {'-'*14} {'-'*14} {'-'*10}")
    print(f"  {'Losta':<30} {f'{frank_total_solved}/{total}':>14} {f'{gemini_total_solved}/{total}':>14} {f'{diff_rate:+.1%}':>10}")
    print(f"  {'Losningsgrad':<30} {f'{frank_rate:.0%}':>14} {f'{gemini_rate:.0%}':>14} {f'{diff_rate:+.1%}':>10}")
    print(f"  {'First-try':<30} {f'{frank_ft}/{total}':>14} {f'{gemini_ft}/{total}':>14}")
    print(f"  {'Snitt tid':<30} {f'{frank_avg_ms:.0f}ms':>14} {f'{gemini_avg_ms:.0f}ms':>14}")

    print(f"\n  Per SUPERHUMAN-kategori:")
    for cat in V3_CATEGORIES:
        if cat not in per_category:
            continue
        cd = per_category[cat]
        fd = cd["frankenstein"]
        gd = cd["gemini"]
        d = fd["rate"] - gd["rate"]
        emoji = "🧟" if d > 0 else ("🤖" if d < 0 else "🤝")
        print(f"    {cat:<20} Nv{cd['avg_difficulty']}: Frank {fd['solved']}/{fd['total']} ({fd['rate']:.0%}) vs Gemini {gd['solved']}/{gd['total']} ({gd['rate']:.0%}) {emoji}")

    print(f"\n  Svaraste uppgifter (lagst sammanlagd score):")
    for t in hardest_data[:5]:
        f_s = "OK" if t["frank_solved"] else f"FAIL({t['frank_score']:.0%})"
        g_s = "OK" if t["gemini_solved"] else f"FAIL({t['gemini_score']:.0%})"
        print(f"    Nv{t['difficulty']} {t['category']}: {t['title'][:40]} — Frank:{f_s} Gemini:{g_s}")

    print(f"\n  {'='*60}")
    print(f"  {winner_text}")
    print(f"  {'='*60}")

    # === SAVE RESULTS ===
    data_dir = Path(__file__).parent / "training_data"
    data_dir.mkdir(exist_ok=True)

    ts = time.strftime("%Y%m%d_%H%M%S")

    json_path = data_dir / f"superhuman_benchmark_{ts}.json"
    json_path.write_text(json.dumps(output, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"\n  JSON: {json_path}")

    md_report = _generate_markdown_report(output)
    md_path = data_dir / f"superhuman_benchmark_{ts}.md"
    md_path.write_text(md_report, encoding="utf-8")
    print(f"  Markdown: {md_path}")

    # Upload to bridge
    if bridge_url:
        print(f"\n  Uploading to bridge...")

        json_file_id = _upload_to_bridge(
            bridge_url, output,
            f"superhuman_benchmark_{ts}.json",
            f"Superhuman Benchmark: Frankenstein AI vs Gemini 2.0 Flash — {total} tasks (Nv11-14)",
        )
        if json_file_id:
            print(f"  JSON uploaded: {bridge_url}/api/files/{json_file_id}/download")

        try:
            md_b64 = base64.b64encode(md_report.encode("utf-8")).decode("ascii")
            resp = requests.post(
                f"{bridge_url}/api/files/upload",
                json={
                    "data": md_b64,
                    "filename": f"superhuman_benchmark_{ts}.md",
                    "uploadedBy": "ai",
                    "description": "Superhuman Benchmark Report: Frankenstein AI vs Gemini 2.0 Flash",
                    "tags": ["benchmark", "superhuman", "report", "markdown"],
                },
                timeout=10,
            )
            if resp.status_code == 200:
                md_file_id = resp.json().get("id")
                print(f"  Markdown uploaded: {bridge_url}/api/files/{md_file_id}/download")
        except Exception as e:
            print(f"  [!] MD upload failed: {e}")

        _send_event(bridge_url, {
            "type": "ab_completed",
            "benchmark_type": "superhuman",
            "output": output,
        })

        try:
            msg = (
                f"🦾 **SUPERHUMAN Benchmark klar!**\n\n"
                f"Frankenstein AI: {frank_total_solved}/{total} ({frank_rate:.0%})\n"
                f"Gemini 2.0 Flash: {gemini_total_solved}/{total} ({gemini_rate:.0%})\n"
                f"Skillnad: {diff_rate:+.1%}\n\n"
                f"**{winner_text}**\n\n"
                f"Kategorier: {', '.join(V3_CATEGORIES)}\n"
                f"Ladda ner fullstandig rapport via Filer-fliken."
            )
            requests.post(
                f"{bridge_url}/api/messages",
                json={"role": "cascade", "content": msg, "type": "message"},
                timeout=5,
            )
        except Exception:
            pass

    return output


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Superhuman Benchmark: Frankenstein AI vs Gemini 2.0 Flash")
    parser.add_argument("--tasks-per-category", type=int, default=3, help="Tasks per category (default: 3)")
    parser.add_argument("--bridge-url", type=str, default=None, help="Bridge URL for result upload")
    args = parser.parse_args()

    run_superhuman_benchmark(
        tasks_per_category=args.tasks_per_category,
        bridge_url=args.bridge_url,
    )
