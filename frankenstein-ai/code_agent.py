"""
FrankensteinCodeAgent — Full Frankenstein-stack integration.

Hela flödet styrs av Frankenstein-stacken:

1. PERCEPTION: Uppgiftsbeskrivning → feature-vektor (text → numerisk)
2. KOGNITION (HDC): Feature-vektor → hypervektor → matcha mot kända mönster
3. AGENTSKAP (Active Inference): Överraskning + EFE → välj strategi
4. MINNE (Ebbinghaus): Lagra lösningar, förstärk bra, glöm dåliga
5. GENERERING (LLM): Bygg prompt med HDC-minnen → generera kod
6. EVALUERING: Kör kod mot testfall → feedback → uppdatera alla moduler

Frankenstein-stacken styr HUR agenten lär sig.
LLM (Gemini) är bara "händerna" som skriver kod.
"""

import json
import time
import re
import os
import hashlib
import numpy as np
import torch
import requests
from dataclasses import dataclass, field
from pathlib import Path

from programming_env import Task, EvalResult, evaluate_solution
from code_solver import solve_deterministic as solve_code_deterministic
from curriculum import get_curriculum, get_tasks_by_level
from cognition import NeuroSymbolicBridge, hdc_bind, hdc_permute
from agency import ActiveInferenceAgent
from memory import EbbinghausMemory, ShortTermBuffer
from gut_feeling import GutFeelingEngine, GutFeelingResult
from emotions import EkmanEmotionEngine
from promotion_pipeline import PromotionPipeline
from symbolic_regression import SymbolicRegressionEngine
from cross_domain_bridge import CrossDomainBridge
from reflection_loop import ReflectionEngine
from archon_client import ArchonClient

# Ladda API-nycklar från bridge/.env
_env_path = Path(__file__).parent.parent / "bridge" / ".env"
_env_vars: dict[str, str] = {}
if _env_path.exists():
    for line in _env_path.read_text().splitlines():
        if "=" in line and not line.startswith("#"):
            k, v = line.split("=", 1)
            _env_vars[k.strip()] = v.strip()

GEMINI_API_KEY = _env_vars.get("GEMINI_API_KEY", os.environ.get("GEMINI_API_KEY", ""))
XAI_API_KEY = _env_vars.get("XAI_API_KEY", os.environ.get("XAI_API_KEY", ""))

# Runtime config (module toggles — läses från config.json varje solve_task)
_CONFIG_PATH = Path(__file__).parent / "training_data" / "config.json"

def _read_module_config() -> dict[str, bool]:
    """Läs vilka moduler som är aktiverade. Returnerar {module_name: enabled}."""
    defaults = {"hdc": True, "aif": True, "ebbinghaus": True, "gut_feeling": True, "emotions": True, "stm": True, "symbolic_regression": True, "cross_domain_bridge": True, "reflection_loop": True}
    try:
        if _CONFIG_PATH.exists():
            data = json.loads(_CONFIG_PATH.read_text(encoding="utf-8"))
            modules = data.get("modules", {})
            return {k: modules.get(k, {}).get("enabled", True) for k in defaults}
    except Exception:
        pass
    return defaults

# Dimensioner
TASK_FEATURE_DIM = 64   # Feature-vektor för uppgiftsbeskrivningar
HDC_DIM = 4096          # Hypervektor-dimension (lägre = snabbare, fortfarande robust)

# Strategier som Active Inference väljer mellan
STRATEGIES = ["direct", "with_hints", "from_memory", "step_by_step"]
NUM_STRATEGIES = len(STRATEGIES)

# Observations-typer för Active Inference
# 0=solved_first_try, 1=solved_with_retry, 2=failed_logic
# 3=failed_syntax, 4=failed_timeout, 5=partial_solve
# 6=new_pattern, 7=known_pattern
NUM_OBSERVATIONS = 8
NUM_STATES = 12


@dataclass
class Attempt:
    """Ett försök att lösa en uppgift."""
    task_id: str
    code: str
    score: float
    feedback: str
    strategy: str
    attempt_num: int
    hdc_observation: int = 0
    surprise: float = 0.0
    timestamp: float = field(default_factory=time.time)


@dataclass
class SolveMetadata:
    """Metadata från ett solve_task-anrop — för mätbarhet."""
    total_time_ms: float = 0.0
    attempts_used: int = 0
    strategies_tried: list[str] = field(default_factory=list)
    winning_strategy: str = ""
    hdc_concept: str = ""
    hdc_confidence: float = 0.0
    hdc_is_new: bool = False
    aif_surprise: float = 0.0
    category: str = ""
    difficulty: int = 0
    first_try_success: bool = False
    # Gut Feeling
    gut_valence: float = 0.0
    gut_confidence: float = 0.0
    gut_recommendation: str = ""
    gut_signals: dict = field(default_factory=dict)


@dataclass
class SkillMemory:
    """Minne av en inlärd färdighet/mönster."""
    pattern: str
    example_code: str
    task_ids: list[str]
    success_rate: float
    times_used: int = 0


def _text_to_features(text: str, dim: int = TASK_FEATURE_DIM):
    """Konvertera text till en deterministisk feature-vektor.
    
    Använder character n-gram hashing för att skapa en numerisk
    representation av uppgiftsbeskrivningen. Deterministisk — samma
    text ger alltid samma vektor.
    """
    features = torch.zeros(dim)
    text_lower = text.lower()

    # Character-level n-grams (2-gram och 3-gram)
    for n in [2, 3]:
        for i in range(len(text_lower) - n + 1):
            ngram = text_lower[i:i+n]
            h = int(hashlib.md5(ngram.encode()).hexdigest(), 16)
            idx = h % dim
            sign = 1.0 if (h // dim) % 2 == 0 else -1.0
            features[idx] += sign

    # Keyword-boosting: starka signaler för programmeringskoncept
    keywords = {
        "loop": 0, "for": 0, "while": 0, "range": 1,
        "if": 2, "else": 2, "elif": 2,
        "list": 3, "array": 3, "sort": 4,
        "string": 5, "str": 5, "char": 5,
        "dict": 6, "map": 6, "count": 7,
        "function": 8, "def": 8, "return": 8,
        "recursion": 9, "recursive": 9,
        "math": 10, "sum": 10, "product": 10,
        "prime": 11, "divisor": 11, "gcd": 11,
        "matrix": 12, "2d": 12, "grid": 12,
        "stack": 13, "queue": 13, "bracket": 13,
        "binary": 14, "search": 14,
        "reverse": 15, "palindrome": 15,
        # Nivå 5-8 koncept
        "graph": 16, "node": 16, "edge": 16, "adjacen": 16,
        "bfs": 17, "dfs": 17, "path": 17, "component": 17,
        "dp": 18, "dynamic": 18, "memoiz": 18, "subproblem": 18,
        "permut": 19, "combin": 19, "subset": 19,
        "anagram": 20, "caesar": 20, "cipher": 20, "compress": 20,
        "linked": 21, "cycle": 21, "duplicate": 21,
        "filter": 22, "reduce": 22, "flatten": 22, "zip": 22,
        "kadane": 23, "subarray": 23, "longest": 23, "increasing": 23,
        "coin": 24, "change": 24, "stair": 24, "climb": 24,
        "bubble": 25, "insertion": 25, "merge": 25,
    }
    for word, slot in keywords.items():
        if word in text_lower:
            features[slot % dim] += 3.0

    # L2-normalisera
    norm = features.norm()
    if norm > 0:
        features = features / norm

    return features


class FrankensteinCodeAgent:
    """Full Frankenstein-stack kodagent.
    
    Arkitektur:
    ┌─────────────┐     ┌──────────┐     ┌────────────────┐
    │  Text→Features│ → │   HDC    │ → │ Active Inference │
    │  (Perception) │   │(Kognition)│   │   (Agentskap)   │
    └─────────────┘     └──────────┘     └───────┬────────┘
                                                  │
                              ┌────────────────────▼─────────┐
                              │     Ebbinghaus Memory        │
                              │  (Episodiskt + Korttidsminne)│
                              └──────────────────────────────┘
                                          │
                                    ┌─────▼─────┐
                                    │  LLM API  │
                                    │ (Gemini)  │
                                    └───────────┘
    """

    def __init__(self, max_attempts: int = 3):
        self.max_attempts = max_attempts

        # --- FRANKENSTEIN STACK ---

        # HDC Kognition: Kodar uppgifter som hypervektorer, matchar mönster
        self.hdc = NeuroSymbolicBridge(
            lnn_output_dim=TASK_FEATURE_DIM,
            hdc_dim=HDC_DIM,
        )

        # Active Inference: Styr strategival via EFE-minimering
        # 8 observationer, 12 states, 4 strategier
        self.aif = ActiveInferenceAgent(
            num_observations=NUM_OBSERVATIONS,
            num_states=NUM_STATES,
            num_actions=NUM_STRATEGIES,
            preference_obs=[0, 1],  # Föredrar "solved" observationer
            exploration_weight=0.6,  # Börja nyfiket
        )

        # Ebbinghaus Episodiskt Minne: Lagrar lösningar med glömskekurva
        # decay_threshold=0.02 (sänkt från 0.05 — behåll minnen längre)
        self.episodic_memory = EbbinghausMemory(
            decay_threshold=0.02,
            collection_name="code_solutions",
        )

        # Korttidsminne: Senaste försöken för omedelbar kontext
        self.stm = ShortTermBuffer(capacity=50)

        # Gut Feeling: Sub-symbolisk intuition — snabb magkänsla före LLM-anrop
        self.gut = GutFeelingEngine(history_window=20, calibration_rate=0.05)

        # Ekman Emotioner: Persistent emotionellt tillstånd (6 grundemotioner)
        self.emotions = EkmanEmotionEngine(decay_rate=1.0, reactivity=0.7)

        # Promotion Pipeline: S2→S1→S0 automatisk promotion
        self.promotion = PromotionPipeline()

        # --- ASI MODULES ---

        # Symbolisk Regression: Steg-för-steg bevisbyggare för matematik
        self.symbolic = SymbolicRegressionEngine()

        # Cross-Domain Bridge: Mappar regler mellan domäner i separat minnesutrymme
        self.cross_domain = CrossDomainBridge()

        # Reflektions-loop: Självkritik vid långsamma/misslyckade lösningar
        self.reflection = ReflectionEngine(threshold_ms=10_000)

        # --- ARCHON KNOWLEDGE BASE ---
        try:
            self.archon = ArchonClient()
            self._archon_available = True
        except Exception:
            self.archon = None  # type: ignore[assignment]
            self._archon_available = False

        # --- AGENT STATE ---
        self.solved: dict[str, Attempt] = {}
        self.skills: dict[str, SkillMemory] = {}
        self.all_attempts: list[Attempt] = []
        self.total_tasks = 0
        self.total_solved = 0
        self.current_level = 1

        # HDC concept → code mapping (concept_name → best code)
        self.concept_code: dict[str, str] = {}

        # Felanalys-tracker: vilka feltyper uppstår mest
        self.error_counts: dict[str, int] = {
            "syntax": 0, "logic": 0, "timeout": 0, "runtime": 0,
        }
        # Strategi-framgångshistorik
        self.strategy_stats: dict[str, dict] = {
            s: {"attempts": 0, "successes": 0} for s in STRATEGIES
        }

        # LLM-anropsstatistik
        self.llm_stats: dict[str, int | float] = {
            "calls": 0, "successes": 0, "failures": 0,
            "rate_limits": 0, "timeouts": 0, "empty_responses": 0,
            "total_latency_ms": 0.0, "retries": 0,
        }

    # ===== PERCEPTION: Text → Features =====

    def _perceive_task(self, task: Task) -> torch.Tensor:
        """Konvertera uppgift till feature-vektor och sedan hypervektor."""
        # Kombinera titel, beskrivning och tags till en text
        text = f"{task.title} {task.description} {' '.join(task.tags)}"
        features = _text_to_features(text, TASK_FEATURE_DIM)
        return features

    # ===== KOGNITION (HDC): Mönsterigenkänning =====

    def _recognize_pattern(self, task: Task) -> tuple[str, float, bool]:
        """Använd HDC för att matcha uppgift mot kända mönster.
        
        Returns:
            concept_name: Namn på matchat koncept
            confidence: Cosine similarity (0-1)
            is_new: True om detta är ett nytt, okänt mönster
        """
        features = self._perceive_task(task)
        hv = self.hdc.encode(features)

        if self.hdc.num_concepts == 0:
            return "unknown", 0.0, True

        best_idx, confidence, concept_name = self.hdc.classify(hv)

        # Dynamisk tröskel: anpassas efter antal koncept
        threshold = self.hdc.get_dynamic_threshold()
        is_new = confidence < threshold
        return concept_name, confidence, is_new

    def _learn_pattern(self, task: Task, concept_name: str) -> None:
        """Lär HDC ett nytt mönster via one-shot learning."""
        features = self._perceive_task(task)
        hv = self.hdc.encode(features)
        self.hdc.learn_concept(concept_name, hv)

    # ===== AGENTSKAP (Active Inference): Strategival =====

    def _classify_error(self, feedback: str) -> str:
        """Klassificera feltyp från feedback."""
        fb = feedback.lower()
        if "syntax" in fb or "indentation" in fb or "unexpected" in fb:
            return "syntax"
        if "timeout" in fb or "timed out" in fb:
            return "timeout"
        if "runtime" in fb or "exception" in fb or "error" in fb:
            return "runtime"
        return "logic"

    def _choose_strategy(self, task: Task, attempt_num: int, is_new_pattern: bool, prev_feedback: str = "") -> str:
        """Active Inference väljer strategi baserat på överraskning och EFE.
        
        Observation mappas till:
        - 0: solved_first_try
        - 1: solved_with_retry
        - 2: failed_logic
        - 3: failed_syntax
        - 4: failed_timeout
        - 5: partial_solve (>0 men <1)
        - 6: new_pattern
        - 7: known_pattern
        """
        if attempt_num > 0:
            # Retry — klassificera felet
            error_type = self._classify_error(prev_feedback)
            if error_type == "syntax":
                observation = 3
            elif error_type == "timeout":
                observation = 4
            else:
                # Kolla om det var partiellt löst
                recent = self.stm.get_recent(1)
                if recent and 0 < recent[0].get("score", 0) < 1.0:
                    observation = 5  # partial
                else:
                    observation = 2  # logic fail
        elif is_new_pattern:
            observation = 6  # new_pattern
        else:
            recent = self.stm.get_recent(1)
            if recent and recent[0].get("score", 0) >= 1.0:
                if recent[0].get("attempts", 1) == 1:
                    observation = 0  # solved_first_try
                else:
                    observation = 1  # solved_with_retry
            else:
                observation = 7  # known_pattern

        # Active Inference: minimera EFE → välj handling
        action_idx = self.aif.step(observation)
        strategy = STRATEGIES[action_idx % NUM_STRATEGIES]

        # Smart overrides baserat på kontext
        if strategy == "from_memory" and not self._find_similar_from_memory(task):
            strategy = "with_hints"

        # Vid syntax-fel, tvinga step_by_step (mer strukturerad)
        if attempt_num > 0 and self._classify_error(prev_feedback) == "syntax":
            strategy = "step_by_step"

        # Vid retry #2+, alltid inkludera hints
        if attempt_num >= 2 and strategy == "direct":
            strategy = "with_hints"

        # Prestanda-override: om en strategi har <20% success efter 50+ försök, byt
        st = self.strategy_stats.get(strategy, {})
        if st.get("attempts", 0) >= 50:
            rate = st.get("successes", 0) / st["attempts"]
            if rate < 0.20 and strategy != "with_hints":
                strategy = "with_hints"

        self.strategy_stats[strategy]["attempts"] += 1
        return strategy

    # ===== MINNE (Ebbinghaus): Lagra & Hämta =====

    def _find_similar_from_memory(self, task: Task) -> str | None:
        """Sök i Ebbinghaus-minnet efter liknande lösta uppgifter.
        
        Använder HDC-hypervektor som sökvektor i ChromaDB.
        Minnen med hög retention (ofta använda, nyligen) prioriteras.
        """
        features = self._perceive_task(task)
        hv = self.hdc.encode(features)
        hv_np = hv.squeeze(0).detach().numpy()

        results = self.episodic_memory.recall(hv_np, n_results=3)

        if results:
            # Returnera koden från det starkaste minnet
            best = max(results, key=lambda r: r["retention"])
            concept = best.get("concept", "")
            if concept in self.concept_code:
                return self.concept_code[concept]

        # Fallback: sök i solved dict via tags
        for solved_id, attempt in self.solved.items():
            for t in get_curriculum():
                if t.id == solved_id and set(task.tags) & set(t.tags):
                    return attempt.code
        return None

    def _store_in_memory(self, task: Task, attempt: Attempt, concept_name: str) -> None:
        """Lagra lösning i Ebbinghaus-minnet.
        
        Lyckade lösningar lagras med hög styrka.
        Misslyckade lagras med låg styrka (glöms bort snabbare).
        """
        features = self._perceive_task(task)
        hv = self.hdc.encode(features)
        hv_np = hv.squeeze(0).detach().numpy()

        metadata = {
            "task_id": task.id,
            "score": attempt.score,
            "strategy": attempt.strategy,
            "category": task.category,
            "tags": ",".join(task.tags),
        }

        # NARS-inspirerad budgetstyrning: strength = base * priority * quality
        # priority: svårare uppgifter = viktigare att minnas
        priority = 0.5 + (task.difficulty / 10.0) * 0.5  # 0.55 → 1.0
        # quality: hur bra lösningen var (logiskt värde)
        quality = max(0.3, attempt.score)  # 0.3 → 1.0
        # durability: sällsynta kategorier = viktigare att behålla
        cat_count = sum(1 for a in self.all_attempts if getattr(a, 'task_id', '').startswith(f"gen-{task.category}"))
        durability = 1.5 if cat_count < 20 else 1.0  # Sällsynta kategorier förstärks

        if attempt.score >= 1.0:
            base = 10.0
            self.concept_code[concept_name] = attempt.code
        elif attempt.score > 0:
            base = 3.0
        else:
            base = 0.5
        metadata["strength"] = base * priority * quality * durability

        self.episodic_memory.store(
            embedding=hv_np,
            concept=concept_name,
            metadata=metadata,
        )

    def _update_after_result(self, task: Task, attempt: Attempt, eval_result: EvalResult) -> None:
        """Uppdatera hela stacken efter ett resultat.
        
        1. HDC: Lär/förstärk mönster
        2. Active Inference: Uppdatera preferenser
        3. Ebbinghaus: Lagra minne
        4. Skills: Uppdatera färdigheter
        5. Felanalys: Spåra feltyper
        6. Strategi-stats: Spåra framgång per strategi
        """
        concept_name, confidence, is_new = self._recognize_pattern(task)

        # 1. HDC: Lär mönstret (one-shot eller förstärk)
        if is_new:
            # Namnge konceptet baserat på tags för bättre igenkänning
            tag_name = "_".join(task.tags[:2]) if task.tags else f"pattern_{self.hdc.num_concepts}"
            concept_name = f"{tag_name}_{self.hdc.num_concepts}"
        self._learn_pattern(task, concept_name)

        # 2. Active Inference: Uppdatera preferenser baserat på resultat
        if eval_result.score >= 1.0:
            self.aif.update_preferences(0, reward=1.0)  # "solved" är bra
            # Minska exploration gradvis vid framgång
            self.aif.exploration_weight = max(0.15, self.aif.exploration_weight * 0.993)
            # Uppdatera strategi-stats
            self.strategy_stats.setdefault(attempt.strategy, {"attempts": 0, "successes": 0})
            self.strategy_stats[attempt.strategy]["successes"] += 1
        elif eval_result.score > 0:
            # Partiell lösning — liten belöning
            self.aif.update_preferences(5, reward=0.3)
            self.aif.exploration_weight = max(0.15, self.aif.exploration_weight * 0.998)
        else:
            # Misslyckande — öka exploration
            error_type = self._classify_error(eval_result.feedback)
            self.error_counts[error_type] = self.error_counts.get(error_type, 0) + 1
            self.aif.update_preferences(2, reward=-0.5)
            self.aif.exploration_weight = min(0.8, self.aif.exploration_weight * 1.008)

        # 3. Ebbinghaus: Lagra i episodiskt minne
        self._store_in_memory(task, attempt, concept_name)

        # 4. Korttidsminne
        self.stm.add({
            "task_id": task.id,
            "score": attempt.score,
            "strategy": attempt.strategy,
            "concept": concept_name,
            "confidence": confidence,
            "attempts": attempt.attempt_num + 1,
            "error_type": self._classify_error(eval_result.feedback) if eval_result.score < 1.0 else None,
            "difficulty": task.difficulty,
        })

        # 5. Skills
        if eval_result.score >= 1.0:
            for tag in task.tags:
                if tag not in self.skills:
                    self.skills[tag] = SkillMemory(
                        pattern=tag,
                        example_code=attempt.code,
                        task_ids=[task.id],
                        success_rate=1.0,
                    )
                else:
                    skill = self.skills[tag]
                    skill.times_used += 1
                    if task.id not in skill.task_ids:
                        skill.task_ids.append(task.id)
                    skill.success_rate = 0.9 * skill.success_rate + 0.1
                    # Uppdatera exempelkod om denna lösning är bättre (kortare)
                    if len(attempt.code) < len(skill.example_code):
                        skill.example_code = attempt.code

    # ===== ARCHON: Kunskapsbas-sökning =====

    def _search_archon_kb(self, task: "Task") -> str:
        """Sök i Archon Knowledge Base efter relevant dokumentation.
        
        Returnerar en kontextsträng att injicera i prompten, eller tom sträng.
        """
        if not self._archon_available or not self.archon:
            return ""
        try:
            query = f"{task.title} {task.description[:200]} {' '.join(task.tags)}"
            results = self.archon.search(query, top_k=2)
            if not results:
                return ""
            snippets = []
            for r in results:
                sim = r.get("similarity", 0)
                if sim < 0.45:
                    continue
                content = r.get("content", "")[:400]
                url = r.get("url", "")
                snippets.append(f"[{url}] {content}")
            if not snippets:
                return ""
            return "KUNSKAPSBAS (relevant dokumentation):\n" + "\n---\n".join(snippets) + "\n\n"
        except Exception:
            return ""

    # ===== LLM: Kodgenerering =====

    def _call_llm(self, prompt: str, temperature: float = 0.3, max_retries: int = 2) -> str | None:
        """Skicka prompt till LLM med retry, rate-limit-hantering och statistik.
        
        Args:
            prompt: LLM-prompt
            temperature: 0.0-1.0, lägre = mer fokuserad, högre = mer kreativ
            max_retries: Antal retry vid rate limit / transient errors
        """
        providers = []
        if GEMINI_API_KEY:
            providers.append("gemini")
        if XAI_API_KEY:
            providers.append("grok")

        # Response cache: check if we've seen this exact prompt before
        prompt_hash = hashlib.md5(prompt.encode()).hexdigest()
        cached = getattr(self, '_response_cache', {}).get(prompt_hash)
        if cached:
            cache_code, cache_ts = cached
            if time.time() - cache_ts < 86400:  # 24h TTL
                self.llm_stats["successes"] += 1
                return cache_code

        for provider in providers:
            for attempt in range(max_retries + 1):
                # Adaptive throttling: base 4s, increases after rate limits
                rate_limit_penalty = min(self.llm_stats.get("rate_limits", 0) * 0.5, 10.0)
                throttle = 4.0 + rate_limit_penalty
                last_call = getattr(self, '_last_llm_call', 0.0)
                elapsed_since_last = time.time() - last_call
                if elapsed_since_last < throttle:
                    time.sleep(throttle - elapsed_since_last)
                self._last_llm_call = time.time()

                self.llm_stats["calls"] += 1
                t0 = time.time()
                try:
                    if provider == "gemini":
                        resp = requests.post(
                            f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={GEMINI_API_KEY}",
                            json={
                                "contents": [{"parts": [{"text": prompt}]}],
                                "generationConfig": {"temperature": temperature},
                            },
                            timeout=30,
                        )
                    else:
                        resp = requests.post(
                            "https://api.x.ai/v1/chat/completions",
                            headers={"Authorization": f"Bearer {XAI_API_KEY}"},
                            json={
                                "model": "grok-3-mini-fast",
                                "messages": [{"role": "user", "content": prompt}],
                                "max_tokens": 1500,
                                "temperature": temperature,
                            },
                            timeout=30,
                        )

                    latency = (time.time() - t0) * 1000
                    self.llm_stats["total_latency_ms"] += latency

                    # Rate limit — backoff och retry
                    if resp.status_code == 429:
                        self.llm_stats["rate_limits"] += 1
                        wait = min(2 ** attempt * 2, 15)
                        time.sleep(wait)
                        self.llm_stats["retries"] += 1
                        continue

                    # Server error — retry
                    if resp.status_code >= 500:
                        self.llm_stats["failures"] += 1
                        time.sleep(2)
                        self.llm_stats["retries"] += 1
                        continue

                    if resp.status_code != 200:
                        self.llm_stats["failures"] += 1
                        break  # Client error (400, 403) — byt provider

                    # Extrahera text
                    text = None
                    if provider == "gemini":
                        data = resp.json()
                        candidates = data.get("candidates", [])
                        if candidates:
                            parts = candidates[0].get("content", {}).get("parts", [])
                            if parts:
                                text = parts[0].get("text", "")
                    else:
                        data = resp.json()
                        choices = data.get("choices", [])
                        if choices:
                            text = choices[0].get("message", {}).get("content", "")

                    if text:
                        self.llm_stats["successes"] += 1
                        # Cache response for future reuse
                        if not hasattr(self, '_response_cache'):
                            self._response_cache = {}
                        self._response_cache[prompt_hash] = (text, time.time())
                        # Limit cache size
                        if len(self._response_cache) > 500:
                            oldest = sorted(self._response_cache.items(), key=lambda x: x[1][1])[:100]
                            for k, _ in oldest:
                                del self._response_cache[k]
                        return text
                    else:
                        self.llm_stats["empty_responses"] += 1
                        break  # Tomt svar — byt provider

                except requests.exceptions.Timeout:
                    self.llm_stats["timeouts"] += 1
                    self.llm_stats["total_latency_ms"] += (time.time() - t0) * 1000
                    break  # Timeout — byt provider
                except Exception:
                    self.llm_stats["failures"] += 1
                    self.llm_stats["total_latency_ms"] += (time.time() - t0) * 1000
                    break

        return None

    def _extract_code(self, llm_response: str) -> str:
        """Extrahera Python-kod från LLM-svar — robust multi-format."""
        # 1. ```python ... ``` (vanligast)
        matches = re.findall(r"```python\s*\n(.*?)```", llm_response, re.DOTALL)
        if matches:
            return max(matches, key=len).strip()

        # 2. ``` ... ``` (utan språkmarkering)
        matches = re.findall(r"```\s*\n(.*?)```", llm_response, re.DOTALL)
        if matches:
            # Filtrera bort block som inte ser ut som Python
            py_matches = [m for m in matches if any(kw in m for kw in ["print(", "input(", "def ", "for ", "import "])]
            if py_matches:
                return max(py_matches, key=len).strip()
            return max(matches, key=len).strip()

        # 3. Heuristisk extraktion — leta efter Python-mönster
        _CODE_STARTS = {
            "print(", "input(", "def ", "for ", "while ", "if ", "import ",
            "class ", "return ", "from ", "try:", "with ", "sys.",
            "n =", "n=", "x =", "a =", "b =", "t =", "s =", "result",
            "arr ", "arr=", "lst ", "data", "ans ", "ans=",
        }
        lines = llm_response.strip().split("\n")
        code_lines: list[str] = []
        in_code = False
        for line in lines:
            stripped = line.strip()
            is_code_line = (
                any(stripped.startswith(kw) for kw in _CODE_STARTS)
                or (in_code and (line.startswith(" ") or line.startswith("\t") or stripped == ""))
                or (in_code and stripped and not any(stripped.startswith(c) for c in ["#", "//", "/*", "*"]))
            )
            # Avbryt om vi stöter på naturlig text efter kodblock
            if in_code and not is_code_line and stripped and any(c in stripped for c in [". ", "! ", "? "]):
                break
            if is_code_line:
                code_lines.append(line)
                in_code = True

        if code_lines:
            return "\n".join(code_lines).strip()

        return llm_response.strip()

    def _build_prompt(self, task: Task, strategy: str, prev_attempts: list[Attempt] = None,
                      gut_recommendation: str = "") -> str:
        """Bygg prompt — berikas med HDC-minnen, AIF-kontext, felanalys och gut feeling."""
        prompt = (
            "Du ar en expert Python-programmerare. Svara BARA med Python-kod i ett ```python``` block. "
            "Ingen forklaring. Koden maste lasa fran stdin med input() och skriva till stdout med print().\n\n"
        )

        # Gut feeling → prompt-tonalitet
        if gut_recommendation == "cautious":
            prompt += (
                "VARNING: Denna uppgift ar troligen svar. Var EXTRA noggrann:\n"
                "- Hantera ALLA edge cases (tom input, noll, negativa tal, stora tal)\n"
                "- Valj en BEVISAD algoritm, inte den forsta ideen\n"
                "- Dubbelkolla output-formatet mot testfallen\n"
                "- Testa mentalt med minst 3 fall innan du svarar\n\n"
            )
        elif gut_recommendation == "confident":
            prompt += "Denna uppgift matchar kanda monster. Skriv en ren, effektiv losning.\n\n"

        prompt += f"UPPGIFT: {task.title}\n{task.description}\n\n"

        # Domänspecifika tips för kända svåra kategorier
        title_lower = task.title.lower()
        if "knapsack" in title_lower:
            prompt += (
                "ALGORITM-TIPS: Anvand 0/1 Knapsack med DP-tabell.\n"
                "dp = [[0]*(W+1) for _ in range(N+1)]\n"
                "for i in range(1,N+1): for w in range(W+1): dp[i][w] = dp[i-1][w] if wt[i-1]<=w: dp[i][w]=max(dp[i][w], dp[i-1][w-wt[i-1]]+val[i-1])\n"
                "Svar: dp[N][W]. OBS: Hantera W=0 (svar=0).\n\n"
            )
        elif "edit distance" in title_lower or "levenshtein" in title_lower:
            prompt += (
                "ALGORITM-TIPS: Klassisk Edit Distance DP.\n"
                "dp[i][j] = 0 om i==0: j, om j==0: i, om s1[i-1]==s2[j-1]: dp[i-1][j-1], annars 1+min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1])\n\n"
            )
        elif "k:te minsta" in title_lower or "kth_smallest" in title_lower or "kth smallest" in title_lower:
            prompt += (
                "ALGORITM-TIPS: K:te minsta i sorterad matris.\n"
                "Anvand binary search pa varden (inte index).\n"
                "lo, hi = matrix[0][0], matrix[-1][-1]\n"
                "For varje mid: rakna antal element <= mid i varje rad (bisect_right).\n"
                "Om count < k: lo = mid+1, annars hi = mid.\n"
                "Svar: lo. OBS: Importera bisect.\n\n"
            )
        elif "binary" in title_lower or "binar" in title_lower:
            prompt += (
                "ALGORITM-TIPS: Binary search.\n"
                "lo, hi = 0, len(arr)-1 (eller 0, N beroende pa problem).\n"
                "while lo <= hi: mid = (lo+hi)//2, jamfor, justera lo/hi.\n"
                "OBS: Var noga med off-by-one. Testa med 1 element och 2 element.\n"
                "For 'find first/last': anvand lo < hi med hi = mid eller lo = mid+1.\n\n"
            )

        # ASI: Symbolisk Regression — steg-för-steg bevisbyggare
        if hasattr(self, '_asi_symbolic') and self._asi_symbolic:
            prompt += self._asi_symbolic + "\n"

        # ASI: Cross-Domain Bridge — regler från multipla domäner
        if hasattr(self, '_asi_cross_domain') and self._asi_cross_domain:
            prompt += self._asi_cross_domain + "\n"

        # Archon Knowledge Base: Injicera relevant dokumentation
        kb_context = self._search_archon_kb(task)
        if kb_context:
            prompt += kb_context

        # Visa ALLA testfall (inte bara första) för bättre precision
        if task.test_cases:
            # Cautious: visa fler testfall för bättre precision
            max_tests = 5 if gut_recommendation == "cautious" else 3
            prompt += "TESTFALL:\n"
            for i, tc in enumerate(task.test_cases[:max_tests]):
                prompt += f"  Test {i+1}: Input: {tc.input_data.strip()} -> Output: {tc.expected_output}\n"
            prompt += "\n"

        if strategy == "with_hints" and task.hints:
            prompt += f"TIPS: {'; '.join(task.hints)}\n\n"

        if strategy == "from_memory":
            similar_code = self._find_similar_from_memory(task)
            if similar_code:
                prompt += "LIKNANDE LOST UPPGIFT (anvand som inspiration, anpassa till denna uppgift):\n"
                prompt += f"```python\n{similar_code}\n```\n\n"

        if strategy == "step_by_step":
            prompt += (
                "Los steg for steg:\n"
                "1. Las ALL input forst (med input())\n"
                "2. Bearbeta data\n"
                "3. Skriv ut EXAKT det forvantade formatet med print()\n"
                "VIKTIGT: Matcha output-formatet EXAKT (mellanslag, radbrytningar).\n\n"
            )

        if prev_attempts:
            n_prev = len(prev_attempts)
            # Adaptive Prompt Escalation: mer detaljer vid varje retry
            if n_prev >= 3:
                prompt += (
                    "KRITISK ESKALERING — 3+ misslyckade forsok. SKRIV OM FRAN SCRATCH.\n"
                    "Ignorera alla tidigare losningar. Borja om helt.\n"
                    "Fokusera pa:\n"
                    "1. Las input EXAKT som beskrivet\n"
                    "2. Anvand enklast mojliga algoritm\n"
                    "3. Testa mentalt med VARJE testfall\n"
                    "4. Matcha output-format TECKEN FOR TECKEN\n\n"
                )
            elif n_prev >= 2:
                prompt += (
                    "ESKALERING — 2 misslyckade forsok. Byt strategi HELT.\n"
                    "Om du anvande en komplex losning, prova en enklare.\n"
                    "Om du anvande en enkel losning, prova en mer strukturerad.\n\n"
                )

            prompt += "TIDIGARE FORSOK (misslyckade) — ANALYSERA FELEN:\n"
            for att in prev_attempts[-2:]:
                error_type = self._classify_error(att.feedback)
                prompt += f"Feltyp: {error_type.upper()}\n"
                prompt += f"Kod:\n```python\n{att.code}\n```\n"
                prompt += f"Feedback: {att.feedback}\n"
                if error_type == "syntax":
                    prompt += "-> Fixa syntaxfelet (kolla indentation, parenteser, kolon)\n"
                elif error_type == "logic":
                    prompt += "-> Output matchar inte. Kolla logiken och output-formatet noggrant.\n"
                    prompt += "-> TIPS: Kor koden mentalt med testfallets input. Skriv ner varje variabels varde.\n"
                elif error_type == "timeout":
                    prompt += "-> Koden ar for langsam. Optimera algoritmen.\n"
                    prompt += "-> TIPS: Byt O(n^2) mot O(n log n) eller O(n). Anvand dict/set for snabb lookup.\n"
                elif error_type == "runtime":
                    prompt += "-> Runtime error. Kolla edge cases (tom input, noll, negativa tal).\n"
                    prompt += "-> TIPS: Lagg till try/except eller if-guards for alla konverteringar.\n"
                prompt += "\n"
            prompt += "Fixa ALLA fel ovan. Testa mentalt mot testfallen.\n\n"

        prompt += "Svara BARA med ```python``` kodblock:"
        return prompt

    # ===== HUVUDLOOP =====

    def solve_task(self, task: Task, verbose: bool = True) -> EvalResult | None:
        """Lös en uppgift med full Frankenstein-stack.
        
        Flöde per försök:
        1. HDC: Känner igen mönster
        2. AIF: Väljer strategi
        3. LLM: Genererar kod
        4. Eval: Kör tester
        5. Stack: Uppdaterar alla moduler
        
        Returnerar EvalResult med .metadata (SolveMetadata) bifogad.
        """
        task_start = time.time()
        self.total_tasks += 1
        attempts: list[Attempt] = []
        best_result: EvalResult | None = None
        strategies_tried: list[str] = []

        # Läs runtime-config (vilka moduler är aktiva?)
        mcfg = _read_module_config()

        # HDC: Analysera uppgiften (kan bypassas)
        if mcfg["hdc"]:
            concept_name, confidence, is_new = self._recognize_pattern(task)
        else:
            concept_name, confidence, is_new = "disabled", 0.0, True

        # AIF: Hämta surprise (kan bypassas)
        if mcfg["aif"]:
            surprise = self.aif.get_surprise()
        else:
            surprise = 0.0

        # Ebbinghaus: Hämta liknande minnen (kan bypassas)
        memory_results: list[dict] = []
        if mcfg["hdc"]:
            features = self._perceive_task(task)
            hv = self.hdc.encode(features)
            hv_np = hv.squeeze(0).detach().numpy()
            if mcfg["ebbinghaus"]:
                memory_results = self.episodic_memory.recall(hv_np, n_results=3)
        else:
            features = self._perceive_task(task)
            hv = self.hdc.encode(features)
            hv_np = hv.squeeze(0).detach().numpy()

        # GUT FEELING: Snabb magkänsla INNAN LLM-anrop (kan bypassas)
        if mcfg["gut_feeling"]:
            gut = self.gut.feel(
                hdc_confidence=confidence,
                is_new_pattern=is_new,
                category=task.category,
                difficulty=task.difficulty,
                title=task.title,
                description=task.description,
                tags=task.tags,
                memory_results=memory_results,
                aif_surprise=surprise,
                exploration_weight=self.aif.exploration_weight if mcfg["aif"] else 0.5,
            )
        else:
            gut = GutFeelingResult(valence=0.0, confidence=0.5, recommendation="neutral")

        # Gut feeling påverkar beteende:
        effective_max = self.max_attempts
        # ASI: Extra attempts för superhuman tasks (difficulty >= 10)
        if task.difficulty >= 10 and effective_max < 4:
            effective_max = 4
        if mcfg["gut_feeling"] and gut.recommendation == "cautious" and effective_max < 5:
            effective_max = effective_max + 1

        # EKMAN EMOTIONER: Hämta beteendemodifieringar (kan bypassas)
        emo_mods = {"temperature_mod": 0.0, "extra_attempts": 0, "strategy_preference": None,
                    "exploration_mod": 0.0, "persistence_mod": 1.0, "prompt_tone": ""}
        if mcfg["emotions"]:
            emo_mods = self.emotions.get_behavioral_modifiers()
            effective_max += emo_mods["extra_attempts"]

        # === SYSTEM 0: DETERMINISTIC SOLVER ===
        # Instant, guaranteed-correct solutions for known task patterns
        # No LLM needed — fastest path to 100%
        system0_used = False
        det_code = solve_code_deterministic(task)
        if det_code:
            s0_result = evaluate_solution(task, det_code)
            if s0_result.score >= 1.0:
                system0_used = True
                self.total_solved += 1
                s0_attempt = Attempt(
                    task_id=task.id, code=det_code, score=1.0,
                    feedback="", strategy="system0_deterministic",
                    attempt_num=0, hdc_observation=0, surprise=surprise,
                )
                attempts.append(s0_attempt)
                self.all_attempts.append(s0_attempt)
                self.solved[task.id] = s0_attempt
                self.strategy_stats.setdefault("system0_deterministic", {"attempts": 0, "successes": 0})
                self.strategy_stats["system0_deterministic"]["attempts"] += 1
                best_result = s0_result
                self._update_after_result(task, s0_attempt, s0_result)
                if verbose:
                    print(f"  [S0] Deterministisk solver → OK {s0_result.passed}/{s0_result.total} (0ms)")

        # === PROMOTED S0: Patterns promoted from S1→S0 via pipeline ===
        if not system0_used:
            promoted_code = self.promotion.get_s0_template(task.category, task.description)
            if promoted_code:
                p_result = evaluate_solution(task, promoted_code)
                if p_result.score >= 1.0:
                    system0_used = True
                    self.total_solved += 1
                    p_attempt = Attempt(
                        task_id=task.id, code=promoted_code, score=1.0,
                        feedback="", strategy="system0_promoted",
                        attempt_num=0, hdc_observation=0, surprise=surprise,
                    )
                    attempts.append(p_attempt)
                    self.all_attempts.append(p_attempt)
                    self.solved[task.id] = p_attempt
                    self.strategy_stats.setdefault("system0_promoted", {"attempts": 0, "successes": 0})
                    self.strategy_stats["system0_promoted"]["attempts"] += 1
                    best_result = p_result
                    self._update_after_result(task, p_attempt, p_result)
                    if verbose:
                        print(f"  [S0p] Promoted template → OK {p_result.passed}/{p_result.total}")

        # === PROMOTED S1: Patterns promoted from S2→S1 via pipeline ===
        if not system0_used:
            promoted_s1_code = self.promotion.get_s1_solution(task.category, task.description)
            if promoted_s1_code:
                ps1_result = evaluate_solution(task, promoted_s1_code)
                if ps1_result.score >= 1.0:
                    system0_used = True  # treat as resolved
                    self.total_solved += 1
                    ps1_attempt = Attempt(
                        task_id=task.id, code=promoted_s1_code, score=1.0,
                        feedback="", strategy="system1_promoted",
                        attempt_num=0, hdc_observation=0, surprise=surprise,
                    )
                    attempts.append(ps1_attempt)
                    self.all_attempts.append(ps1_attempt)
                    self.solved[task.id] = ps1_attempt
                    self.strategy_stats.setdefault("system1_promoted", {"attempts": 0, "successes": 0})
                    self.strategy_stats["system1_promoted"]["attempts"] += 1
                    best_result = ps1_result
                    self._update_after_result(task, ps1_attempt, ps1_result)
                    self.promotion.record_success(task.category, task.description, promoted_s1_code, "system1_promoted", "s1")
                    if verbose:
                        print(f"  [S1p] Promoted memory → OK {ps1_result.passed}/{ps1_result.total}")

        # === SYSTEM 1 BYPASS (Dual-process) ===
        # Om Gut Feeling = confident + HDC har stark match + lagrad kod finns
        # → försök lösa direkt utan LLM (sparar ~3s + inga rate limits)
        system1_used = False
        if (not system0_used
                and mcfg["gut_feeling"] and mcfg["hdc"] and mcfg["ebbinghaus"]
                and gut.recommendation == "confident"
                and not is_new
                and confidence >= 0.5
                and concept_name in self.concept_code):
            cached_code = self.concept_code[concept_name]
            s1_result = evaluate_solution(task, cached_code)
            if s1_result.score >= 1.0:
                # System 1 lyckades! Registrera som from_memory
                system1_used = True
                self.total_solved += 1
                s1_attempt = Attempt(
                    task_id=task.id, code=cached_code, score=1.0,
                    feedback="", strategy="system1_memory",
                    attempt_num=0, hdc_observation=0, surprise=surprise,
                )
                attempts.append(s1_attempt)
                self.all_attempts.append(s1_attempt)
                self.solved[task.id] = s1_attempt
                self.strategy_stats.setdefault("system1_memory", {"attempts": 0, "successes": 0})
                self.strategy_stats["system1_memory"]["attempts"] += 1
                # successes räknas i _update_after_result → undvik dubbelbokföring
                best_result = s1_result
                self._update_after_result(task, s1_attempt, s1_result)
                if verbose:
                    print(f"  [S1] Procedurellt minne → OK {s1_result.passed}/{s1_result.total} (0ms LLM)")

        # === ASI: PRE-COMPUTE SYMBOLIC + CROSS-DOMAIN CONTEXT ===
        self._asi_symbolic = ""
        self._asi_cross_domain = ""
        if not (system0_used or system1_used):
            # Symbolisk Regression: Bygg steg-för-steg bevisstruktur
            if mcfg.get("symbolic_regression", True) and task.difficulty >= 10:
                sym_domains = self.symbolic.analyze_task(task.title, task.description, task.tags)
                if sym_domains:
                    self._asi_symbolic = self.symbolic.build_decomposition_prompt(
                        task.title, task.description, task.tags
                    )
                    if verbose and self._asi_symbolic:
                        print(f"  [SymReg] Bevisbyggare aktiverad: {', '.join(sym_domains)}")

            # Cross-Domain Bridge: Hämta regler från multipla domäner
            if mcfg.get("cross_domain_bridge", True) and task.difficulty >= 10:
                bridge_result = self.cross_domain.analyze(task.title, task.description, task.tags)
                if bridge_result and bridge_result.confidence > 0.4:
                    self._asi_cross_domain = bridge_result.prompt_injection
                    if verbose:
                        print(f"  [Bridge] Cross-domain: {' + '.join(d.upper() for d in bridge_result.domains_detected)} "
                              f"({len(bridge_result.mappings_found)} mappningar, conf={bridge_result.confidence:.2f})")

        prev_feedback = ""
        for attempt_num in range(effective_max if not (system0_used or system1_used) else 0):
            # AIF: Välj strategi via Expected Free Energy (kan bypassas)
            if mcfg["aif"]:
                strategy = self._choose_strategy(task, attempt_num, is_new, prev_feedback)
            else:
                strategy = "direct" if attempt_num == 0 else "with_hints"

            # Gut feeling override: vid "cautious" och första försöket, föredra with_hints
            if mcfg["gut_feeling"] and attempt_num == 0 and gut.recommendation == "cautious" and strategy == "direct":
                strategy = "with_hints"
                self.strategy_stats["with_hints"]["attempts"] += 1

            # Emotion override: om emotionellt tillstånd föredrar en strategi
            if mcfg["emotions"] and attempt_num == 0 and emo_mods["strategy_preference"] and strategy == "direct":
                strategy = emo_mods["strategy_preference"]
                if strategy in self.strategy_stats:
                    self.strategy_stats[strategy]["attempts"] += 1
            strategies_tried.append(strategy)

            if verbose:
                marker = "NEW" if is_new and attempt_num == 0 else f"conf={confidence:.2f}"
                gut_tag = f" {gut.emoji}" if attempt_num == 0 and mcfg["gut_feeling"] else ""
                emo_tag = f" {self.emotions.state.emoji}" if attempt_num == 0 and mcfg["emotions"] else ""
                print(
                    f"  [{marker}] "
                    f"Forsok {attempt_num + 1}/{effective_max} "
                    f"(AIF:{strategy}, surp={surprise:.2f}{gut_tag}{emo_tag})...",
                    end=" ", flush=True,
                )

            # LLM: Generera kod (gut feeling + emotioner påverkar prompt + temperature)
            emo_tone = emo_mods["prompt_tone"] if mcfg["emotions"] else ""
            combined_gut = gut.recommendation if mcfg["gut_feeling"] else ""
            if emo_tone and combined_gut:
                combined_gut = f"{combined_gut}|{emo_tone}"
            elif emo_tone:
                combined_gut = emo_tone
            prompt = self._build_prompt(task, strategy, attempts, gut_recommendation=combined_gut)
            # Dynamisk temperature: gut + emotion modifier
            base_temp = 0.3
            if mcfg["gut_feeling"]:
                base_temp = 0.2 if gut.recommendation == "confident" else 0.5 if gut.recommendation == "cautious" else 0.3
            if mcfg["emotions"]:
                base_temp += emo_mods["temperature_mod"]
            temp = min(max(0.1, base_temp + attempt_num * 0.15), 0.9)
            llm_response = self._call_llm(prompt, temperature=temp)

            if not llm_response:
                if verbose:
                    print("X LLM timeout")
                continue

            code = self._extract_code(llm_response)
            if not code:
                if verbose:
                    print("X Ingen kod")
                continue

            # Eval: Kör tester
            eval_result = evaluate_solution(task, code)

            attempt = Attempt(
                task_id=task.id,
                code=code,
                score=eval_result.score,
                feedback=eval_result.feedback,
                strategy=strategy,
                attempt_num=attempt_num,
                hdc_observation=0 if eval_result.score >= 1.0 else 2,
                surprise=surprise,
            )
            attempts.append(attempt)
            self.all_attempts.append(attempt)
            prev_feedback = eval_result.feedback

            # Stack: Uppdatera alla moduler
            self._update_after_result(task, attempt, eval_result)
            if mcfg["aif"]:
                surprise = self.aif.get_surprise()

            if verbose:
                if eval_result.score >= 1.0:
                    print(f"OK {eval_result.passed}/{eval_result.total} ({eval_result.execution_time_ms:.0f}ms)")
                else:
                    print(f"FAIL {eval_result.passed}/{eval_result.total} -- {eval_result.feedback[:60]}")

            if best_result is None or eval_result.score > best_result.score:
                best_result = eval_result

            if eval_result.score >= 1.0:
                self.total_solved += 1
                self.solved[task.id] = attempt
                # Promotion Pipeline: registrera framgångsrik S2-lösning
                promo_msg = self.promotion.record_success(
                    task.category, task.description, code, strategy, "s2"
                )
                if promo_msg and verbose:
                    print(f"  [Promotion] {promo_msg}")
                break
            else:
                # Promotion Pipeline: registrera misslyckande
                self.promotion.record_failure(task.category, task.description, "s2")

                # === ASI: REFLECTION LOOP ===
                # Om lösningen tog >10s eller är partiell, aktivera självkritik
                attempt_elapsed = (time.time() - task_start) * 1000
                if mcfg.get("reflection_loop", True) and self.reflection.should_reflect(
                    attempt_elapsed, eval_result.score, attempt_num
                ):
                    tc_info = ""
                    if task.test_cases:
                        tc_info = "; ".join(
                            f"In:{tc.input_data.strip()[:80]}→Out:{tc.expected_output[:60]}"
                            for tc in task.test_cases[:2]
                        )
                    reflection = self.reflection.reflect(
                        code=code,
                        task_description=task.description[:500],
                        test_cases_info=tc_info,
                        feedback=eval_result.feedback,
                        elapsed_ms=attempt_elapsed,
                    )
                    if reflection.issues and reflection.critique_prompt:
                        if verbose:
                            crit = sum(1 for i in reflection.issues if i.severity == "critical")
                            warn = sum(1 for i in reflection.issues if i.severity == "warning")
                            print(f"  [Reflect] Självkritik: {crit} kritiska, {warn} varningar → fixar...")

                        # Extra LLM-anrop med critique-prompt
                        fix_response = self._call_llm(reflection.critique_prompt, temperature=0.2)
                        if fix_response:
                            fix_code = self._extract_code(fix_response)
                            if fix_code and fix_code != code:
                                fix_result = evaluate_solution(task, fix_code)
                                if fix_result.score > eval_result.score:
                                    self.reflection.record_fix_outcome(True)
                                    # Registrera som nytt försök
                                    fix_attempt = Attempt(
                                        task_id=task.id, code=fix_code,
                                        score=fix_result.score,
                                        feedback=fix_result.feedback,
                                        strategy=f"{strategy}+reflection",
                                        attempt_num=attempt_num,
                                        hdc_observation=0 if fix_result.score >= 1.0 else 2,
                                        surprise=surprise,
                                    )
                                    attempts.append(fix_attempt)
                                    self.all_attempts.append(fix_attempt)
                                    prev_feedback = fix_result.feedback
                                    self._update_after_result(task, fix_attempt, fix_result)

                                    if fix_result.score > (best_result.score if best_result else 0):
                                        best_result = fix_result

                                    if verbose:
                                        if fix_result.score >= 1.0:
                                            print(f"  [Reflect] FIX OK {fix_result.passed}/{fix_result.total}")
                                        else:
                                            print(f"  [Reflect] Förbättrad {eval_result.score:.0%}→{fix_result.score:.0%}")

                                    if fix_result.score >= 1.0:
                                        self.total_solved += 1
                                        self.solved[task.id] = fix_attempt
                                        self.strategy_stats.setdefault(f"{strategy}+reflection", {"attempts": 0, "successes": 0})
                                        self.strategy_stats[f"{strategy}+reflection"]["successes"] += 1
                                        promo_msg = self.promotion.record_success(
                                            task.category, task.description, fix_code, f"{strategy}+reflection", "s2"
                                        )
                                        if promo_msg and verbose:
                                            print(f"  [Promotion] {promo_msg}")
                                        # Record bridge outcome if applicable
                                        if self._asi_cross_domain:
                                            self.cross_domain.record_outcome(True)
                                        break
                                else:
                                    self.reflection.record_fix_outcome(False)

        # Periodisk garbage collection (glöm dåliga minnen)
        if mcfg["ebbinghaus"] and self.total_tasks % 20 == 0:
            removed = self.episodic_memory.garbage_collect()
            if removed > 0 and verbose:
                print(f"  [Ebbinghaus] Glomde {removed} svaga minnen")

        # Periodisk HDC concept splitting (var 50:e uppgift)
        if mcfg["hdc"] and self.total_tasks % 50 == 0:
            split = self.hdc.maybe_split_concepts(max_samples=80)
            if split > 0 and verbose:
                print(f"  [HDC] Splittade {split} breda koncept ({self.hdc.num_concepts} kvar)")

        # Gut Feeling: Registrera utfall för kalibrering
        final_score = best_result.score if best_result else 0.0
        if mcfg["gut_feeling"]:
            self.gut.record_outcome(
                score=final_score,
                category=task.category,
                difficulty=task.difficulty,
                gut_valence=gut.valence,
            )

        # EKMAN EMOTIONER: Uppdatera baserat på resultat
        # Bestäm feltyp
        error_type = ""
        was_timeout = False
        if best_result and best_result.score < 1.0:
            fb = best_result.feedback.lower()
            if "syntax" in fb:
                error_type = "syntax"
            elif "timeout" in fb or "timed out" in fb:
                error_type = "timeout"
                was_timeout = True
            elif "error" in fb or "exception" in fb:
                error_type = "runtime"
            else:
                error_type = "logic"

        prev_score = -1.0
        if len(self.all_attempts) > len(attempts) + 1:
            prev_score = self.all_attempts[-(len(attempts) + 1)].score

        current_streak = 0
        for a in reversed(self.all_attempts):
            if a.score >= 1.0:
                current_streak += 1
            else:
                break
        if current_streak == 0:
            for a in reversed(self.all_attempts):
                if a.score < 1.0:
                    current_streak -= 1
                else:
                    break

        if mcfg["emotions"]:
            self.emotions.process_result(
                score=final_score,
                difficulty=task.difficulty,
                attempts_used=len(attempts),
                max_attempts=effective_max,
                is_new_pattern=is_new,
                error_type=error_type,
                was_timeout=was_timeout,
                previous_score=prev_score,
                streak=current_streak,
            )

            if verbose and self.emotions.state.dominant()[1] > 0.2:
                mood = self.emotions.get_mood_summary()
                print(f"  [Emotion] {mood}")

        # Bifoga metadata för mätbarhet
        total_time_ms = (time.time() - task_start) * 1000
        solved = best_result is not None and best_result.score >= 1.0
        meta = SolveMetadata(
            total_time_ms=total_time_ms,
            attempts_used=len(attempts),
            strategies_tried=strategies_tried,
            winning_strategy=attempts[-1].strategy if attempts and solved else "",
            hdc_concept=concept_name,
            hdc_confidence=confidence,
            hdc_is_new=is_new,
            aif_surprise=surprise,
            category=task.category,
            difficulty=task.difficulty,
            first_try_success=solved and len(attempts) == 1,
            gut_valence=gut.valence,
            gut_confidence=gut.confidence,
            gut_recommendation=gut.recommendation,
            gut_signals={s.name: round(s.value, 3) for s in gut.signals},
        )
        if best_result is not None:
            best_result.metadata = meta  # type: ignore[attr-defined]
        return best_result

    def get_stats(self) -> dict:
        """Returnera full stack-statistik."""
        mem_stats = self.episodic_memory.get_stats()
        aif_stats = self.aif.get_stats()
        # Beräkna strategi-framgångsgrader
        strat_rates = {}
        for s, st in self.strategy_stats.items():
            if st["attempts"] > 0:
                strat_rates[s] = round(st["successes"] / st["attempts"], 2)
        return {
            "total_tasks": self.total_tasks,
            "total_solved": self.total_solved,
            "solve_rate": self.total_solved / max(self.total_tasks, 1),
            "skills_learned": len(self.skills),
            "skill_names": list(self.skills.keys()),
            "total_attempts": len(self.all_attempts),
            "current_level": self.current_level,
            # HDC
            "hdc_concepts": self.hdc.num_concepts,
            "hdc_concept_names": self.hdc.get_concept_names()[:20],
            # Active Inference
            "aif_exploration_weight": self.aif.exploration_weight,
            "aif_surprise": aif_stats.get("current_surprise", 0),
            "aif_mean_efe": aif_stats.get("mean_efe", 0),
            # Ebbinghaus Memory
            "memory_active": mem_stats.get("active_memories", 0),
            "memory_total_stored": mem_stats.get("total_stored", 0),
            "memory_total_decayed": mem_stats.get("total_decayed", 0),
            "memory_backend": mem_stats.get("backend", "unknown"),
            # Felanalys
            "error_counts": dict(self.error_counts),
            # Strategi-framgång
            "strategy_success_rates": strat_rates,
            "strategy_stats": {s: dict(st) for s, st in self.strategy_stats.items()},
            # Gut Feeling
            "gut_feeling": self.gut.get_stats(),
            # LLM
            "llm_stats": {
                **self.llm_stats,
                "avg_latency_ms": round(
                    self.llm_stats["total_latency_ms"] / max(self.llm_stats["calls"], 1), 1
                ),
                "success_rate": round(
                    self.llm_stats["successes"] / max(self.llm_stats["calls"], 1), 3
                ),
            },
            # Ekman Emotioner
            "emotions": self.emotions.get_stats(),
            # Promotion Pipeline
            "promotion": self.promotion.get_stats(),
            # ASI Modules
            "symbolic_regression": self.symbolic.get_stats(),
            "cross_domain_bridge": self.cross_domain.get_stats(),
            "reflection_loop": self.reflection.get_stats(),
        }


# Bakåtkompatibilitet — continuous_train.py importerar CodeLearningAgent
CodeLearningAgent = FrankensteinCodeAgent
