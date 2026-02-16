"""
FrankensteinSwarm — Biologisk Kognition × Kollektiv Intelligens

Kombinerar Frankenstein AI:s kognitiva stack (HDC, AIF, Ebbinghaus, Gut Feeling,
Emotioner) med Swarm Intelligence (Mycelium Protocol, konsensus, specialisering).

Arkitektur:
  - 3 specialiserade FrankensteinAgenter med olika kognitiva profiler
  - Delat HDC-konceptminne (kollektiv mönsterigenkänning)
  - Mycelium-protokoll: insight-propagation mellan agenter
  - Konsensus via viktad röstning + confidence scoring
  - Emergensanalys: mäter kollektiv IQ vs individuell

Kör: python frankenstein_swarm.py [bridge_url]
"""

import json
import time
import sys
import os
import io
import copy
import hashlib
import requests
import numpy as np
import torch
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional

# Fix Windows encoding
if hasattr(sys.stdout, "buffer") and not isinstance(sys.stdout, io.TextIOWrapper):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "buffer") and not isinstance(sys.stderr, io.TextIOWrapper):
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

from programming_env import Task, EvalResult, evaluate_solution
from task_generator import generate_task
from code_agent import FrankensteinCodeAgent, _read_module_config
from cognition import NeuroSymbolicBridge


# ---------------------------------------------------------------------------
# Kognitiva profiler — varje svärm-nod har en unik "personlighet"
# ---------------------------------------------------------------------------

@dataclass
class CognitiveProfile:
    id: str
    label: str
    emoji: str
    description: str
    # Vilka moduler som är aktiva för denna nod
    modules: dict[str, bool]
    # Strategipreferens (override)
    preferred_strategy: str
    # Temperature-bias (adderas till bas-temperature)
    temperature_bias: float
    # Influence-vikt i konsensus (0.0 - 2.0)
    influence: float


PROFILES: dict[str, CognitiveProfile] = {
    "analytiker": CognitiveProfile(
        id="analytiker",
        label="Analytiker",
        emoji="🔬",
        description="Full kognitiv stack, systematisk approach, föredrar with_hints",
        modules={"hdc": True, "aif": True, "ebbinghaus": True, "gut_feeling": True, "emotions": True, "stm": True},
        preferred_strategy="with_hints",
        temperature_bias=-0.1,
        influence=1.0,
    ),
    "kreativist": CognitiveProfile(
        id="kreativist",
        label="Kreativist",
        emoji="🎨",
        description="Hög temperatur, stänger av AIF (fri strategi), litar på gut feeling",
        modules={"hdc": True, "aif": False, "ebbinghaus": True, "gut_feeling": True, "emotions": True, "stm": False},
        preferred_strategy="direct",
        temperature_bias=0.2,
        influence=0.9,
    ),
    "kritiker": CognitiveProfile(
        id="kritiker",
        label="Kritiker",
        emoji="📊",
        description="Alla moduler, låg temperatur, föredrar step_by_step, extra försök",
        modules={"hdc": True, "aif": True, "ebbinghaus": True, "gut_feeling": True, "emotions": False, "stm": True},
        preferred_strategy="step_by_step",
        temperature_bias=-0.15,
        influence=1.2,
    ),
}


# ---------------------------------------------------------------------------
# Svärm-resultat
# ---------------------------------------------------------------------------

@dataclass
class SwarmAttempt:
    profile_id: str
    code: str
    score: float
    feedback: str
    time_ms: float
    confidence: float  # Baserat på gut feeling + HDC confidence


@dataclass
class SwarmTaskResult:
    task_id: str
    difficulty: int
    category: str
    title: str
    # Per-nod resultat
    attempts: list[SwarmAttempt]
    # Konsensus
    consensus_code: str
    consensus_score: float
    consensus_method: str  # "best", "vote", "merge"
    # Emergence
    individual_best_score: float
    collective_improvement: float  # consensus_score - individual_best_score
    time_ms: float


# ---------------------------------------------------------------------------
# Mycelium Protocol (Python-version)
# ---------------------------------------------------------------------------

class PythonMycelium:
    """Insight-propagation mellan Frankenstein-agenter.
    
    Delar HDC-koncept och lösningsstrategier mellan noder.
    Cross-domain bonus: om en nod löser en uppgift som en annan misslyckades med,
    propageras insikten med 1.5x vikt.
    """

    def __init__(self):
        self.shared_concepts: dict[str, torch.Tensor] = {}
        self.solution_insights: list[dict] = []

    def share_concept(self, source_id: str, concept_name: str, hypervector: torch.Tensor):
        key = f"{source_id}:{concept_name}"
        self.shared_concepts[key] = hypervector.clone()

    def get_shared_concepts(self, exclude_source: str) -> list[tuple[str, torch.Tensor]]:
        return [
            (k, v) for k, v in self.shared_concepts.items()
            if not k.startswith(f"{exclude_source}:")
        ]

    def share_insight(self, source_id: str, task_id: str, code: str, score: float, strategy: str):
        self.solution_insights.append({
            "source": source_id,
            "task_id": task_id,
            "code": code,
            "score": score,
            "strategy": strategy,
            "timestamp": time.time(),
        })

    def get_insights_for_task(self, task_id: str, exclude_source: str) -> list[dict]:
        return [
            i for i in self.solution_insights
            if i["task_id"] == task_id and i["source"] != exclude_source
        ]


# ---------------------------------------------------------------------------
# Konsensus-mekanismer
# ---------------------------------------------------------------------------

def consensus_best(attempts: list[SwarmAttempt]) -> tuple[str, float, str]:
    """Enklast: välj bästa individuella lösningen."""
    best = max(attempts, key=lambda a: (a.score, a.confidence))
    return best.code, best.score, "best"


def consensus_vote(attempts: list[SwarmAttempt], task: Task) -> tuple[str, float, str]:
    """Viktad röstning: kör alla lösningar, vikta med confidence × influence."""
    if not attempts:
        return "", 0.0, "vote"

    # Samla unika lösningar
    unique_codes: dict[str, float] = {}
    for a in attempts:
        code_hash = hashlib.md5(a.code.encode()).hexdigest()
        if code_hash not in unique_codes:
            unique_codes[code_hash] = 0.0
        # Vikta med score × confidence
        profile = PROFILES.get(a.profile_id)
        influence = profile.influence if profile else 1.0
        unique_codes[code_hash] += a.score * a.confidence * influence

    # Välj koden med högst viktad poäng
    best_hash = max(unique_codes, key=unique_codes.get)
    best_code = next(a.code for a in attempts if hashlib.md5(a.code.encode()).hexdigest() == best_hash)
    result = evaluate_solution(task, best_code)
    return best_code, result.score, "vote"


def consensus_merge(attempts: list[SwarmAttempt], task: Task, llm_fn) -> tuple[str, float, str]:
    """Merge: LLM syntetiserar bästa delarna från alla lösningar."""
    # Filtrera till lösningar med score > 0
    good_attempts = [a for a in attempts if a.score > 0]
    if not good_attempts:
        return consensus_best(attempts)

    # Bygg merge-prompt
    prompt = (
        "Du är en expert Python-programmerare. Nedan finns flera lösningsförsök för samma uppgift. "
        "Syntetisera den BÄSTA möjliga lösningen genom att kombinera de starkaste delarna.\n\n"
        f"UPPGIFT: {task.title}\n{task.description}\n\n"
    )
    for i, a in enumerate(good_attempts[:3]):
        prompt += f"LÖSNING {i+1} (score: {a.score:.0%}, agent: {a.profile_id}):\n```python\n{a.code}\n```\n\n"

    prompt += (
        "Syntetisera den bästa lösningen. Svara BARA med ```python``` kodblock. "
        "Koden måste läsa från stdin med input() och skriva till stdout med print()."
    )

    try:
        response = llm_fn(prompt)
        if response:
            import re
            pattern = r"```python\s*\n(.*?)```"
            matches = re.findall(pattern, response, re.DOTALL)
            if matches:
                merged_code = matches[0].strip()
                result = evaluate_solution(task, merged_code)
                if result.score >= max(a.score for a in attempts):
                    return merged_code, result.score, "merge"
    except Exception:
        pass

    # Fallback till best
    return consensus_best(attempts)


# ---------------------------------------------------------------------------
# FrankensteinSwarm — Huvudklass
# ---------------------------------------------------------------------------

class FrankensteinSwarm:
    """Svärm av Frankenstein-agenter med kollektiv kognition."""

    def __init__(
        self,
        profiles: list[str] | None = None,
        max_attempts_per_node: int = 2,
        bridge_url: str | None = None,
    ):
        self.bridge_url = bridge_url
        self.max_attempts = max_attempts_per_node
        self.mycelium = PythonMycelium()
        self.results: list[SwarmTaskResult] = []

        # Skapa agenter med olika kognitiva profiler
        profile_ids = profiles or ["analytiker", "kreativist", "kritiker"]
        self.agents: dict[str, FrankensteinCodeAgent] = {}
        self.profiles: dict[str, CognitiveProfile] = {}

        for pid in profile_ids:
            profile = PROFILES.get(pid)
            if not profile:
                print(f"  ⚠ Okänd profil: {pid}, hoppar över")
                continue

            # Skriv profil-specifik config
            self._write_profile_config(profile)
            agent = FrankensteinCodeAgent(max_attempts=max_attempts_per_node)
            self.agents[pid] = agent
            self.profiles[pid] = profile
            print(f"  {profile.emoji} {profile.label} initierad ({sum(v for v in profile.modules.values())}/6 moduler)")

        # Återställ config till default
        self._reset_config()

        self.total_tasks = 0
        self.total_solved = 0
        self.collective_wins = 0  # Gånger konsensus > bästa individuella

    def _write_profile_config(self, profile: CognitiveProfile):
        """Skriv modulconfig för en specifik profil."""
        config_path = Path(__file__).parent / "training_data" / "config.json"
        try:
            if config_path.exists():
                cfg = json.loads(config_path.read_text(encoding="utf-8"))
            else:
                cfg = {"modules": {}}
            for key, enabled in profile.modules.items():
                if key in cfg.get("modules", {}):
                    cfg["modules"][key]["enabled"] = enabled
                else:
                    cfg.setdefault("modules", {})[key] = {"enabled": enabled, "label": key, "description": ""}
            config_path.write_text(json.dumps(cfg, indent=2, ensure_ascii=False), encoding="utf-8")
        except Exception:
            pass

    def _reset_config(self):
        """Återställ config till alla moduler PÅ."""
        config_path = Path(__file__).parent / "training_data" / "config.json"
        try:
            if config_path.exists():
                cfg = json.loads(config_path.read_text(encoding="utf-8"))
                for key in cfg.get("modules", {}):
                    cfg["modules"][key]["enabled"] = True
                config_path.write_text(json.dumps(cfg, indent=2, ensure_ascii=False), encoding="utf-8")
        except Exception:
            pass

    def _send_event(self, event: dict):
        if not self.bridge_url:
            return
        try:
            requests.post(
                f"{self.bridge_url}/api/frankenstein/swarm/event",
                json={"event": event},
                timeout=3,
            )
        except Exception:
            pass

    def solve_task(self, task: Task, verbose: bool = True) -> SwarmTaskResult:
        """Kör en uppgift genom svärmen.
        
        Faser:
        1. Individuell analys — varje nod löser uppgiften oberoende
        2. Insight-propagation — dela lösningar via Mycelium
        3. Förfining — noder som misslyckades får se andras lösningar
        4. Konsensus — välj/syntetisera bästa lösningen
        """
        task_start = time.time()
        self.total_tasks += 1

        if verbose:
            print(f"\n{'='*60}")
            print(f"  🧟‍♂️🐝 SWARM TASK: {task.title} (Lv{task.difficulty})")
            print(f"{'='*60}")

        self._send_event({
            "type": "swarm_task_start",
            "task_id": task.id,
            "title": task.title,
            "difficulty": task.difficulty,
            "category": task.category,
            "task_num": self.total_tasks,
        })

        # --- Fas 1: Individuell analys ---
        if verbose:
            print(f"\n  🔬 Fas 1: Individuell analys")

        attempts: list[SwarmAttempt] = []
        for pid, agent in self.agents.items():
            profile = self.profiles[pid]
            self._write_profile_config(profile)

            if verbose:
                print(f"    {profile.emoji} {profile.label}... ", end="", flush=True)

            t0 = time.time()
            try:
                result = agent.solve_task(task, verbose=False)
                elapsed = (time.time() - t0) * 1000
                score = result.score if result else 0.0
                code = ""
                feedback = ""
                if result:
                    # Hämta koden från senaste attempt
                    task_attempts = [a for a in agent.all_attempts if a.task_id == task.id]
                    if task_attempts:
                        code = task_attempts[-1].code if hasattr(task_attempts[-1], 'code') else ""
                        feedback = result.feedback

                # Beräkna confidence baserat på agentens stats
                stats = agent.get_stats()
                hdc_conf = min(stats.get("hdc_concepts", 0) / 50, 1.0)
                confidence = 0.5 + 0.3 * score + 0.2 * hdc_conf

                attempt = SwarmAttempt(
                    profile_id=pid,
                    code=code,
                    score=score,
                    feedback=feedback,
                    time_ms=elapsed,
                    confidence=confidence,
                )
                attempts.append(attempt)

                # Dela insight via Mycelium
                if code and score > 0:
                    self.mycelium.share_insight(pid, task.id, code, score, profile.preferred_strategy)

                if verbose:
                    status = "✅" if score >= 1.0 else f"❌ {score:.0%}"
                    print(f"{status} ({elapsed:.0f}ms, conf={confidence:.2f})")

                self._send_event({
                    "type": "swarm_node_done",
                    "phase": 1,
                    "profile_id": pid,
                    "label": profile.label,
                    "emoji": profile.emoji,
                    "score": score,
                    "time_ms": round(elapsed, 1),
                    "confidence": round(confidence, 2),
                })

            except Exception as e:
                elapsed = (time.time() - t0) * 1000
                if verbose:
                    print(f"⚠ {e}")
                attempts.append(SwarmAttempt(
                    profile_id=pid, code="", score=0.0,
                    feedback=str(e), time_ms=elapsed, confidence=0.0,
                ))

            time.sleep(0.5)  # Rate limit

        # --- Fas 2: Insight-propagation + Förfining ---
        failed_nodes = [a for a in attempts if a.score < 1.0]
        succeeded_nodes = [a for a in attempts if a.score >= 1.0]

        if failed_nodes and succeeded_nodes:
            if verbose:
                print(f"\n  🍄 Fas 2: Mycelium — {len(failed_nodes)} noder förfinar med insikter")

            for failed in failed_nodes:
                pid = failed.profile_id
                profile = self.profiles[pid]
                agent = self.agents[pid]
                self._write_profile_config(profile)

                # Hämta insikter från andra noder
                insights = self.mycelium.get_insights_for_task(task.id, pid)
                if not insights:
                    continue

                if verbose:
                    print(f"    {profile.emoji} {profile.label} förfinar med {len(insights)} insikter... ", end="", flush=True)

                # Ge agenten en ny chans med insikter som kontext
                # Vi modifierar uppgiftens hints med andras lösningar
                enhanced_task = Task(
                    id=task.id,
                    title=task.title,
                    description=task.description + "\n\nHINT: En annan agent löste detta med följande approach:\n" +
                        insights[0]["code"][:200] + "...",
                    difficulty=task.difficulty,
                    category=task.category,
                    test_cases=task.test_cases,
                    hints=task.hints,
                    tags=task.tags,
                )

                t0 = time.time()
                try:
                    result = agent.solve_task(enhanced_task, verbose=False)
                    elapsed = (time.time() - t0) * 1000
                    score = result.score if result else 0.0

                    if score > failed.score:
                        code = ""
                        task_attempts = [a for a in agent.all_attempts if a.task_id == task.id]
                        if task_attempts:
                            code = task_attempts[-1].code if hasattr(task_attempts[-1], 'code') else ""

                        # Uppdatera attempt
                        failed.code = code
                        failed.score = score
                        failed.feedback = result.feedback if result else ""
                        failed.time_ms += elapsed

                        if verbose:
                            status = "✅ FÖRBÄTTRAD" if score >= 1.0 else f"↑ {score:.0%}"
                            print(f"{status} ({elapsed:.0f}ms)")

                        self._send_event({
                            "type": "swarm_node_refined",
                            "profile_id": pid,
                            "label": profile.label,
                            "new_score": score,
                            "improvement": score - failed.score,
                        })
                    else:
                        if verbose:
                            print(f"→ ingen förbättring")
                except Exception as e:
                    if verbose:
                        print(f"⚠ {e}")

                time.sleep(0.5)

        # --- Fas 3: Konsensus ---
        if verbose:
            print(f"\n  🧬 Fas 3: Konsensus")

        # Välj konsensus-metod baserat på resultat
        all_solved = all(a.score >= 1.0 for a in attempts)
        any_solved = any(a.score >= 1.0 for a in attempts)

        if all_solved:
            # Alla löste — välj bästa (snabbaste med högst confidence)
            consensus_code, consensus_score, method = consensus_best(attempts)
            if verbose:
                print(f"    Alla noder löste! Väljer bästa → {method}")
        elif any_solved:
            # Några löste — viktad röstning
            consensus_code, consensus_score, method = consensus_vote(attempts, task)
            if verbose:
                print(f"    Viktad röstning bland {sum(1 for a in attempts if a.score >= 1.0)} lösningar → {method}")
        else:
            # Ingen löste — merge bästa försöken
            def llm_fn(prompt):
                # Använd första agentens LLM
                first_agent = list(self.agents.values())[0]
                return first_agent._call_llm(prompt)
            consensus_code, consensus_score, method = consensus_merge(attempts, task, llm_fn)
            if verbose:
                print(f"    Ingen löste — merge-syntes → score={consensus_score:.0%}")

        total_time = (time.time() - task_start) * 1000
        individual_best = max(a.score for a in attempts) if attempts else 0.0
        collective_improvement = consensus_score - individual_best

        if consensus_score >= 1.0:
            self.total_solved += 1
        if collective_improvement > 0:
            self.collective_wins += 1

        result = SwarmTaskResult(
            task_id=task.id,
            difficulty=task.difficulty,
            category=task.category,
            title=task.title,
            attempts=attempts,
            consensus_code=consensus_code,
            consensus_score=consensus_score,
            consensus_method=method,
            individual_best_score=individual_best,
            collective_improvement=collective_improvement,
            time_ms=total_time,
        )
        self.results.append(result)

        # Återställ config
        self._reset_config()

        if verbose:
            winner = "🧟‍♂️🐝 SVÄRMEN" if consensus_score >= 1.0 else "❌ MISSLYCKADES"
            improvement = f" (kollektiv +{collective_improvement:.0%})" if collective_improvement > 0 else ""
            print(f"\n  → {winner}: {consensus_score:.0%}{improvement} [{method}] ({total_time:.0f}ms)")

        self._send_event({
            "type": "swarm_task_done",
            "task_id": task.id,
            "title": task.title,
            "difficulty": task.difficulty,
            "consensus_score": consensus_score,
            "consensus_method": method,
            "individual_best": individual_best,
            "collective_improvement": collective_improvement,
            "time_ms": round(total_time, 1),
            "per_node": [
                {"id": a.profile_id, "score": a.score, "confidence": round(a.confidence, 2), "time_ms": round(a.time_ms, 1)}
                for a in attempts
            ],
            "task_num": self.total_tasks,
            "total_solved": self.total_solved,
        })

        return result

    def get_stats(self) -> dict:
        return {
            "total_tasks": self.total_tasks,
            "total_solved": self.total_solved,
            "solve_rate": self.total_solved / max(self.total_tasks, 1),
            "collective_wins": self.collective_wins,
            "collective_win_rate": self.collective_wins / max(self.total_tasks, 1),
            "shared_concepts": len(self.mycelium.shared_concepts),
            "shared_insights": len(self.mycelium.solution_insights),
            "per_node": {
                pid: {
                    "label": self.profiles[pid].label,
                    "emoji": self.profiles[pid].emoji,
                    "tasks": agent.total_tasks,
                    "solved": agent.total_solved,
                    "rate": agent.total_solved / max(agent.total_tasks, 1),
                }
                for pid, agent in self.agents.items()
            },
        }


# ---------------------------------------------------------------------------
# CLI — Kör FrankensteinSwarm som standalone
# ---------------------------------------------------------------------------

def run_swarm_session(
    num_tasks: int = 20,
    difficulties: list[int] | None = None,
    bridge_url: str | None = None,
):
    if difficulties is None:
        difficulties = [3, 4, 5, 6, 7, 8]

    print("=" * 70)
    print("  🧟‍♂️🐝 FRANKENSTEIN SWARM — Biologisk Kognition × Kollektiv Intelligens")
    print("=" * 70)
    print(f"  Noder: Analytiker 🔬 + Kreativist 🎨 + Kritiker 📊")
    print(f"  Uppgifter: {num_tasks}")
    print(f"  Svårigheter: {difficulties}")
    print("=" * 70)

    swarm = FrankensteinSwarm(bridge_url=bridge_url)

    if bridge_url:
        swarm._send_event({
            "type": "swarm_session_start",
            "num_tasks": num_tasks,
            "difficulties": difficulties,
            "profiles": list(swarm.profiles.keys()),
        })

    # Generera uppgifter
    tasks = []
    per_level = max(1, num_tasks // len(difficulties))
    for diff in difficulties:
        for _ in range(per_level):
            tasks.append(generate_task(diff))
    tasks = tasks[:num_tasks]

    for i, task in enumerate(tasks):
        print(f"\n[{i+1}/{len(tasks)}]", end="")
        swarm.solve_task(task, verbose=True)

    # Slutrapport
    stats = swarm.get_stats()
    print("\n" + "=" * 70)
    print("  📊 SLUTRAPPORT: FRANKENSTEIN SWARM")
    print("=" * 70)
    print(f"  Lösta: {stats['total_solved']}/{stats['total_tasks']} ({stats['solve_rate']:.0%})")
    print(f"  Kollektiva vinster: {stats['collective_wins']} ({stats['collective_win_rate']:.0%})")
    print(f"  Delade koncept: {stats['shared_concepts']}")
    print(f"  Delade insikter: {stats['shared_insights']}")
    print(f"\n  Per nod:")
    for pid, ns in stats["per_node"].items():
        print(f"    {ns['emoji']} {ns['label']}: {ns['solved']}/{ns['tasks']} ({ns['rate']:.0%})")
    print("=" * 70)

    # Spara resultat
    output = {
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "type": "frankenstein_swarm",
        "num_tasks": stats["total_tasks"],
        "difficulties": difficulties,
        "stats": stats,
        "results": [
            {
                "task_id": r.task_id,
                "difficulty": r.difficulty,
                "category": r.category,
                "title": r.title,
                "consensus_score": r.consensus_score,
                "consensus_method": r.consensus_method,
                "individual_best": r.individual_best_score,
                "collective_improvement": r.collective_improvement,
                "time_ms": round(r.time_ms, 1),
                "per_node": [
                    {"id": a.profile_id, "score": a.score, "confidence": round(a.confidence, 2)}
                    for a in r.attempts
                ],
            }
            for r in swarm.results
        ],
    }

    data_dir = Path(__file__).parent / "training_data"
    data_dir.mkdir(exist_ok=True)
    ts = time.strftime("%Y%m%d_%H%M%S")
    out_path = data_dir / f"swarm_session_{ts}.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)
    print(f"\n  💾 Sparat till {out_path}")

    if bridge_url:
        swarm._send_event({
            "type": "swarm_session_done",
            "stats": stats,
            "output": output,
        })

    return output


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="FrankensteinSwarm — Biologisk Kognition × Kollektiv Intelligens")
    parser.add_argument("num_tasks", nargs="?", type=int, default=20, help="Antal uppgifter")
    parser.add_argument("--bridge-url", type=str, default=None, help="Bridge URL för realtids-events")
    args = parser.parse_args()

    run_swarm_session(
        num_tasks=args.num_tasks,
        bridge_url=args.bridge_url,
    )
