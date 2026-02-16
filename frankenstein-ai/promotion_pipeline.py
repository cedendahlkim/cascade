"""
S2 → S1 → S0 Promotion Pipeline for Frankenstein AI.

Reduces LLM dependency by promoting successful solution strategies:
- S2 → S1: After 3 successful uses, cache strategy in Ebbinghaus memory
- S1 → S0: After 10 consecutive successes, extract deterministic template

All promotions are logged to promotions.log with timestamps.
"""

import json
import time
import hashlib
import re
from pathlib import Path
from dataclasses import dataclass, field
from datetime import datetime


PROMOTIONS_LOG = Path(__file__).parent / "training_data" / "promotions.log"
PROMOTION_STATE_PATH = Path(__file__).parent / "training_data" / "promotion_state.json"


@dataclass
class SolutionRecord:
    """Record of a successful solution for promotion tracking."""
    task_signature: str  # category + type hash
    category: str
    code: str
    strategy: str
    score: float
    timestamp: float = field(default_factory=time.time)


@dataclass
class PromotionCandidate:
    """A strategy being tracked for promotion."""
    task_signature: str
    category: str
    source_tier: str  # "s2" or "s1"
    target_tier: str  # "s1" or "s0"
    successes: int = 0
    consecutive_successes: int = 0
    failures: int = 0
    best_code: str = ""
    codes: list = field(default_factory=list)
    first_seen: float = field(default_factory=time.time)
    last_seen: float = field(default_factory=time.time)


class PromotionPipeline:
    """Manages promotion of solution strategies between tiers."""

    S2_TO_S1_THRESHOLD = 3   # successes needed for S2 → S1
    S1_TO_S0_THRESHOLD = 10  # consecutive successes needed for S1 → S0

    def __init__(self):
        self.candidates: dict[str, PromotionCandidate] = {}
        self.promoted_s1: dict[str, str] = {}  # signature → best_code
        self.promoted_s0: dict[str, str] = {}  # signature → template_code
        self.response_cache: dict[str, tuple[str, float]] = {}  # hash → (code, timestamp)
        self.cache_ttl = 86400  # 24h
        self._load_state()

    def _task_signature(self, category: str, description: str = "") -> str:
        """Create a signature for a task type (not instance)."""
        # Use category + first 100 chars of description hash
        desc_hash = hashlib.md5(description[:100].encode()).hexdigest()[:8]
        return f"{category}:{desc_hash}"

    def _cache_key(self, task_signature: str, strategy: str) -> str:
        """Create a cache key for response caching."""
        return f"{task_signature}:{strategy}"

    def record_success(self, category: str, description: str, code: str,
                       strategy: str, source_tier: str) -> str | None:
        """Record a successful solution. Returns promotion message if promoted."""
        sig = self._task_signature(category, description)

        # Update response cache
        cache_key = self._cache_key(sig, strategy)
        self.response_cache[cache_key] = (code, time.time())

        # Skip if already promoted to S0
        if sig in self.promoted_s0:
            return None

        # Track for S2 → S1 promotion
        if source_tier == "s2" and sig not in self.promoted_s1:
            if sig not in self.candidates:
                self.candidates[sig] = PromotionCandidate(
                    task_signature=sig, category=category,
                    source_tier="s2", target_tier="s1",
                )
            cand = self.candidates[sig]
            cand.successes += 1
            cand.consecutive_successes += 1
            cand.last_seen = time.time()
            cand.codes.append(code)
            if len(code) > len(cand.best_code) or not cand.best_code:
                cand.best_code = code

            if cand.successes >= self.S2_TO_S1_THRESHOLD:
                # Promote to S1!
                self.promoted_s1[sig] = cand.best_code
                msg = f"PROMOTED S2→S1: {category} (sig={sig}, {cand.successes} successes)"
                self._log_promotion(msg, "s2", "s1", category, sig)
                del self.candidates[sig]
                # Start tracking for S1 → S0
                self.candidates[sig] = PromotionCandidate(
                    task_signature=sig, category=category,
                    source_tier="s1", target_tier="s0",
                )
                self._save_state()
                return msg

        # Track for S1 → S0 promotion
        elif source_tier in ("s1", "s2") and sig in self.promoted_s1:
            if sig not in self.candidates:
                self.candidates[sig] = PromotionCandidate(
                    task_signature=sig, category=category,
                    source_tier="s1", target_tier="s0",
                )
            cand = self.candidates[sig]
            cand.successes += 1
            cand.consecutive_successes += 1
            cand.last_seen = time.time()
            if len(code) > len(cand.best_code) or not cand.best_code:
                cand.best_code = code

            if cand.consecutive_successes >= self.S1_TO_S0_THRESHOLD:
                # Promote to S0!
                template = self._extract_template(cand.codes if cand.codes else [code])
                self.promoted_s0[sig] = template or cand.best_code
                msg = f"PROMOTED S1→S0: {category} (sig={sig}, {cand.consecutive_successes} consecutive)"
                self._log_promotion(msg, "s1", "s0", category, sig)
                del self.candidates[sig]
                self._save_state()
                return msg

        self._save_state()
        return None

    def record_failure(self, category: str, description: str, source_tier: str):
        """Record a failure — resets consecutive success counter."""
        sig = self._task_signature(category, description)
        if sig in self.candidates:
            self.candidates[sig].failures += 1
            self.candidates[sig].consecutive_successes = 0

    def get_cached_solution(self, category: str, description: str,
                            strategy: str) -> str | None:
        """Check response cache for a matching solution. TTL: 24h."""
        sig = self._task_signature(category, description)
        cache_key = self._cache_key(sig, strategy)

        if cache_key in self.response_cache:
            code, ts = self.response_cache[cache_key]
            if time.time() - ts < self.cache_ttl:
                return code
            else:
                del self.response_cache[cache_key]
        return None

    def get_s1_solution(self, category: str, description: str) -> str | None:
        """Check if this task type has been promoted to S1."""
        sig = self._task_signature(category, description)
        return self.promoted_s1.get(sig)

    def get_s0_template(self, category: str, description: str) -> str | None:
        """Check if this task type has been promoted to S0."""
        sig = self._task_signature(category, description)
        return self.promoted_s0.get(sig)

    def _extract_template(self, codes: list[str]) -> str | None:
        """Extract common solution structure from multiple successful codes."""
        if not codes:
            return None
        if len(codes) == 1:
            return codes[0]

        # Find the longest code (likely most complete)
        return max(codes, key=len)

    def _log_promotion(self, message: str, source: str, target: str,
                       category: str, signature: str):
        """Log a promotion event."""
        timestamp = datetime.now().isoformat()
        log_line = f"[{timestamp}] {message}\n"
        try:
            PROMOTIONS_LOG.parent.mkdir(parents=True, exist_ok=True)
            with open(PROMOTIONS_LOG, "a", encoding="utf-8") as f:
                f.write(log_line)
        except Exception:
            pass

    def get_stats(self) -> dict:
        """Return promotion pipeline statistics."""
        return {
            "candidates_tracking": len(self.candidates),
            "promoted_to_s1": len(self.promoted_s1),
            "promoted_to_s0": len(self.promoted_s0),
            "cache_entries": len(self.response_cache),
            "candidates": {
                sig: {
                    "category": c.category,
                    "source": c.source_tier,
                    "target": c.target_tier,
                    "successes": c.successes,
                    "consecutive": c.consecutive_successes,
                    "failures": c.failures,
                }
                for sig, c in list(self.candidates.items())[:20]
            },
        }

    def _save_state(self):
        """Persist promotion state to disk."""
        state = {
            "promoted_s1": self.promoted_s1,
            "promoted_s0": self.promoted_s0,
            "candidates": {
                sig: {
                    "task_signature": c.task_signature,
                    "category": c.category,
                    "source_tier": c.source_tier,
                    "target_tier": c.target_tier,
                    "successes": c.successes,
                    "consecutive_successes": c.consecutive_successes,
                    "failures": c.failures,
                    "best_code": c.best_code,
                    "first_seen": c.first_seen,
                    "last_seen": c.last_seen,
                }
                for sig, c in self.candidates.items()
            },
        }
        try:
            PROMOTION_STATE_PATH.parent.mkdir(parents=True, exist_ok=True)
            PROMOTION_STATE_PATH.write_text(
                json.dumps(state, indent=2, ensure_ascii=False),
                encoding="utf-8",
            )
        except Exception:
            pass

    def _load_state(self):
        """Load promotion state from disk."""
        try:
            if PROMOTION_STATE_PATH.exists():
                state = json.loads(PROMOTION_STATE_PATH.read_text(encoding="utf-8"))
                self.promoted_s1 = state.get("promoted_s1", {})
                self.promoted_s0 = state.get("promoted_s0", {})
                for sig, data in state.get("candidates", {}).items():
                    self.candidates[sig] = PromotionCandidate(
                        task_signature=data["task_signature"],
                        category=data["category"],
                        source_tier=data["source_tier"],
                        target_tier=data["target_tier"],
                        successes=data.get("successes", 0),
                        consecutive_successes=data.get("consecutive_successes", 0),
                        failures=data.get("failures", 0),
                        best_code=data.get("best_code", ""),
                        first_seen=data.get("first_seen", time.time()),
                        last_seen=data.get("last_seen", time.time()),
                    )
        except Exception:
            pass
