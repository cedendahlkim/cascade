"""
Frankenstein Live Battle Arena

Kör en live-tävling mellan Frankenstein AI och en ren LLM.
Skickar events till bridge via HTTP för realtids-visualisering.

Kör: python battle_arena.py [bridge_url] [difficulty] [num_tasks] [category]
"""

import json
import time
import sys
import os
import re
import io
import requests
import random
from pathlib import Path
from dataclasses import dataclass, field, asdict
from typing import Optional

# Fix Windows terminal encoding
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

from programming_env import Task, EvalResult, evaluate_solution
from task_generator import generate_task
from code_agent import FrankensteinCodeAgent, SolveMetadata

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

# Exakta modellnamn
GEMINI_MODEL = "gemini-2.0-flash"
GROK_MODEL = "grok-3-mini-fast"

def get_llm_name() -> str:
    """Returnera namnet på den LLM som används."""
    if GEMINI_API_KEY:
        return GEMINI_MODEL
    if XAI_API_KEY:
        return GROK_MODEL
    return "unknown"


class BareLLMAgent:
    """Ren LLM-agent utan Frankenstein-stack."""

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
            prompt += "Fixa felen.\n\n"
        prompt += "Svara BARA med ```python``` kodblock:"
        return prompt

    def solve_task(self, task: Task, verbose: bool = False) -> tuple[EvalResult | None, dict]:
        """Returnerar (result, metadata_dict) för battle events."""
        self.total_tasks += 1
        prev_attempts = []
        best_result = None
        t_start = time.time()
        attempts_used = 0

        for attempt_num in range(self.max_attempts):
            attempts_used += 1
            prompt = self._build_prompt(task, prev_attempts if prev_attempts else None)
            llm_response = self._call_llm(prompt)

            if not llm_response:
                continue

            code = self._extract_code(llm_response)
            if not code:
                continue

            eval_result = evaluate_solution(task, code)
            prev_attempts.append({"code": code, "feedback": eval_result.feedback})

            if best_result is None or eval_result.score > best_result.score:
                best_result = eval_result

            if eval_result.score >= 1.0:
                self.total_solved += 1
                break

        total_ms = (time.time() - t_start) * 1000
        meta = {
            "time_ms": round(total_ms, 1),
            "attempts": attempts_used,
            "strategy": "direct",
            "first_try": best_result is not None and best_result.score >= 1.0 and attempts_used == 1,
        }
        return best_result, meta


def send_event(bridge_url: str, battle_id: str, event: dict):
    """Skicka ett battle event till bridge."""
    try:
        requests.post(
            f"{bridge_url}/api/frankenstein/battle/event",
            json={"battle_id": battle_id, "event": event},
            timeout=5,
        )
    except Exception:
        pass


def run_battle(
    bridge_url: str = "http://localhost:4000",
    difficulty: int = 0,
    num_tasks: int = 5,
    category: str = "",
    battle_id: str = "",
):
    """Kör en live battle mellan Frankenstein och ren LLM."""
    if not battle_id:
        battle_id = f"battle-{int(time.time())}"

    # Bestäm svårighetsgrader
    if difficulty > 0:
        difficulties = [difficulty]
    else:
        difficulties = [4, 5, 6, 7, 8]

    # Generera uppgifter
    tasks: list[Task] = []
    if category:
        # Försök generera uppgifter av specifik kategori
        for _ in range(num_tasks * 3):
            diff = random.choice(difficulties)
            t = generate_task(diff)
            if t.category == category or category in t.tags:
                tasks.append(t)
            if len(tasks) >= num_tasks:
                break
    if len(tasks) < num_tasks:
        per_level = max(1, (num_tasks - len(tasks)) // len(difficulties))
        for diff in difficulties:
            for _ in range(per_level):
                tasks.append(generate_task(diff))
        tasks = tasks[:num_tasks]

    random.shuffle(tasks)

    # Skicka start-event
    llm_name = get_llm_name()
    send_event(bridge_url, battle_id, {
        "type": "battle_start",
        "battle_id": battle_id,
        "num_tasks": len(tasks),
        "difficulties": difficulties,
        "category": category or "mixed",
        "frankenstein_model": f"Frankenstein AI (HDC + AIF + Ebbinghaus + {llm_name})",
        "bare_model": f"Ren {llm_name}",
        "llm_name": llm_name,
        "timestamp": time.time(),
    })

    print(f"=== BATTLE ARENA: {battle_id} ===")
    print(f"Tasks: {len(tasks)}, Difficulty: {difficulties}, Category: {category or 'mixed'}")

    # Skapa agenter
    frank_agent = FrankensteinCodeAgent(max_attempts=3)
    bare_agent = BareLLMAgent(max_attempts=3)

    frank_score = 0
    bare_score = 0
    frank_total_ms = 0.0
    bare_total_ms = 0.0

    for i, task in enumerate(tasks):
        round_num = i + 1
        print(f"\n--- Round {round_num}/{len(tasks)}: {task.title} (Nv{task.difficulty}, {task.category}) ---")

        # Skicka round_start
        send_event(bridge_url, battle_id, {
            "type": "round_start",
            "round": round_num,
            "total_rounds": len(tasks),
            "task": {
                "id": task.id,
                "title": task.title,
                "difficulty": task.difficulty,
                "category": task.category,
                "description": task.description[:200],
            },
            "timestamp": time.time(),
        })

        # === FRANKENSTEIN ===
        send_event(bridge_url, battle_id, {
            "type": "agent_thinking",
            "round": round_num,
            "agent": "frankenstein",
            "timestamp": time.time(),
        })

        frank_start = time.time()
        frank_result = frank_agent.solve_task(task, verbose=False)
        frank_ms = (time.time() - frank_start) * 1000

        frank_meta: SolveMetadata | None = getattr(frank_result, "metadata", None) if frank_result else None
        frank_solved = frank_result is not None and frank_result.score >= 1.0
        if frank_solved:
            frank_score += 1
        frank_total_ms += frank_ms

        frank_event = {
            "type": "agent_result",
            "round": round_num,
            "agent": "frankenstein",
            "solved": frank_solved,
            "score": frank_result.score if frank_result else 0,
            "time_ms": round(frank_ms, 1),
            "attempts": frank_meta.attempts_used if frank_meta else 0,
            "strategy": frank_meta.winning_strategy if frank_meta else "",
            "first_try": frank_meta.first_try_success if frank_meta else False,
            "hdc_concept": frank_meta.hdc_concept if frank_meta else "",
            "hdc_is_new": frank_meta.hdc_is_new if frank_meta else False,
            "hdc_confidence": round(frank_meta.hdc_confidence, 2) if frank_meta else 0,
            "aif_surprise": round(frank_meta.aif_surprise, 2) if frank_meta else 0,
            "timestamp": time.time(),
        }
        send_event(bridge_url, battle_id, frank_event)
        print(f"  FRANK: {'SOLVED' if frank_solved else 'FAILED'} ({frank_ms:.0f}ms, strat={frank_meta.winning_strategy if frank_meta else '?'})")

        # === BARE LLM ===
        send_event(bridge_url, battle_id, {
            "type": "agent_thinking",
            "round": round_num,
            "agent": "bare_llm",
            "timestamp": time.time(),
        })

        bare_result, bare_meta = bare_agent.solve_task(task, verbose=False)
        bare_solved = bare_result is not None and bare_result.score >= 1.0
        if bare_solved:
            bare_score += 1
        bare_total_ms += bare_meta["time_ms"]

        bare_event = {
            "type": "agent_result",
            "round": round_num,
            "agent": "bare_llm",
            "solved": bare_solved,
            "score": bare_result.score if bare_result else 0,
            "time_ms": bare_meta["time_ms"],
            "attempts": bare_meta["attempts"],
            "strategy": "direct",
            "first_try": bare_meta["first_try"],
            "timestamp": time.time(),
        }
        send_event(bridge_url, battle_id, bare_event)
        print(f"  BARE:  {'SOLVED' if bare_solved else 'FAILED'} ({bare_meta['time_ms']:.0f}ms)")

        # Skicka round_end med ställning
        send_event(bridge_url, battle_id, {
            "type": "round_end",
            "round": round_num,
            "total_rounds": len(tasks),
            "frank_score": frank_score,
            "bare_score": bare_score,
            "frank_total_ms": round(frank_total_ms, 1),
            "bare_total_ms": round(bare_total_ms, 1),
            "timestamp": time.time(),
        })

    # === BATTLE SLUT ===
    # Hämta Frankenstein stack stats
    stack_stats = frank_agent.get_stats()

    final_event = {
        "type": "battle_end",
        "battle_id": battle_id,
        "num_tasks": len(tasks),
        "frank_score": frank_score,
        "bare_score": bare_score,
        "frank_rate": round(frank_score / max(len(tasks), 1), 3),
        "bare_rate": round(bare_score / max(len(tasks), 1), 3),
        "frank_avg_ms": round(frank_total_ms / max(len(tasks), 1), 1),
        "bare_avg_ms": round(bare_total_ms / max(len(tasks), 1), 1),
        "winner": "frankenstein" if frank_score > bare_score else "bare_llm" if bare_score > frank_score else "tie",
        "stack": {
            "hdc_concepts": stack_stats.get("hdc_concepts", 0),
            "aif_surprise": stack_stats.get("aif_surprise", 0),
            "aif_exploration": stack_stats.get("aif_exploration_weight", 0),
            "memory_active": stack_stats.get("memory_active", 0),
            "memory_stored": stack_stats.get("memory_total_stored", 0),
            "strategy_stats": stack_stats.get("strategy_stats", {}),
        },
        "timestamp": time.time(),
    }
    send_event(bridge_url, battle_id, final_event)

    print(f"\n{'='*50}")
    print(f"  RESULTAT: Frankenstein {frank_score} - {bare_score} Bare LLM")
    print(f"  Vinnare: {final_event['winner'].upper()}")
    print(f"  Frank avg: {final_event['frank_avg_ms']:.0f}ms, Bare avg: {final_event['bare_avg_ms']:.0f}ms")
    print(f"{'='*50}")


if __name__ == "__main__":
    bridge = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:4000"
    diff = int(sys.argv[2]) if len(sys.argv) > 2 else 0
    num = int(sys.argv[3]) if len(sys.argv) > 3 else 5
    cat = sys.argv[4] if len(sys.argv) > 4 else ""
    run_battle(bridge_url=bridge, difficulty=diff, num_tasks=num, category=cat)
