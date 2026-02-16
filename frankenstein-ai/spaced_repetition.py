"""
Spaced Repetition Scheduler for Frankenstein AI.

Implements Ebbinghaus-driven task scheduling that systematically revisits
weak areas with increasing intervals, accelerating S2→S1→S0 promotion.

Core principles:
1. Track per-category performance (solve rate, recency, difficulty)
2. Prioritize tasks in the "learning zone" (30-70% solve rate)
3. Use exponential backoff intervals — revisit sooner when failing
4. Integrate with Ebbinghaus memory retention for scheduling weight

Scheduling formula:
    priority = weakness_score × urgency × learning_zone_bonus

Where:
    weakness_score = 1.0 - solve_rate  (higher = weaker = more priority)
    urgency = e^(-time_since_last / interval)  (decays over time)
    learning_zone_bonus = 2.0 if 0.3 ≤ solve_rate ≤ 0.7 else 1.0

Interval calculation (SM-2 inspired):
    interval_n = interval_{n-1} × easiness_factor
    easiness_factor = max(1.3, 2.5 - 0.8 × (5 - quality))
    quality = solve_rate × 5  (0-5 scale)
"""

import json
import math
import time
import random
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional


STATE_PATH = Path(__file__).parent / "training_data" / "spaced_repetition_state.json"


@dataclass
class CategoryRecord:
    """Tracks spaced repetition state for a single task category."""
    category: str
    difficulty: int = 5
    # Performance
    attempted: int = 0
    solved: int = 0
    first_try: int = 0
    consecutive_successes: int = 0
    consecutive_failures: int = 0
    # Timing
    last_attempted: float = 0.0
    last_solved: float = 0.0
    last_failed: float = 0.0
    # SM-2 scheduling
    interval_seconds: float = 300.0  # Start: 5 minutes
    easiness_factor: float = 2.5
    repetition_count: int = 0
    # History of recent scores (last 20)
    recent_scores: list[float] = field(default_factory=list)

    @property
    def solve_rate(self) -> float:
        if self.attempted == 0:
            return 0.0
        return self.solved / self.attempted

    @property
    def recent_solve_rate(self) -> float:
        """Solve rate from last 20 attempts — more responsive than lifetime."""
        if not self.recent_scores:
            return 0.0
        return sum(1 for s in self.recent_scores if s >= 1.0) / len(self.recent_scores)

    @property
    def in_learning_zone(self) -> bool:
        """True if solve rate is 30-70% — the optimal learning zone."""
        rate = self.recent_solve_rate if len(self.recent_scores) >= 5 else self.solve_rate
        return 0.3 <= rate <= 0.7

    @property
    def is_weak(self) -> bool:
        """True if solve rate < 70% with enough data."""
        if self.attempted < 3:
            return False
        rate = self.recent_solve_rate if len(self.recent_scores) >= 5 else self.solve_rate
        return rate < 0.7

    @property
    def is_mastered(self) -> bool:
        """True if solve rate > 90% with enough data."""
        if self.attempted < 10:
            return False
        rate = self.recent_solve_rate if len(self.recent_scores) >= 10 else self.solve_rate
        return rate > 0.9

    def to_dict(self) -> dict:
        return {
            "category": self.category,
            "difficulty": self.difficulty,
            "attempted": self.attempted,
            "solved": self.solved,
            "first_try": self.first_try,
            "consecutive_successes": self.consecutive_successes,
            "consecutive_failures": self.consecutive_failures,
            "last_attempted": self.last_attempted,
            "last_solved": self.last_solved,
            "last_failed": self.last_failed,
            "interval_seconds": self.interval_seconds,
            "easiness_factor": self.easiness_factor,
            "repetition_count": self.repetition_count,
            "recent_scores": self.recent_scores[-20:],
        }

    @classmethod
    def from_dict(cls, d: dict) -> "CategoryRecord":
        return cls(
            category=d["category"],
            difficulty=d.get("difficulty", 5),
            attempted=d.get("attempted", 0),
            solved=d.get("solved", 0),
            first_try=d.get("first_try", 0),
            consecutive_successes=d.get("consecutive_successes", 0),
            consecutive_failures=d.get("consecutive_failures", 0),
            last_attempted=d.get("last_attempted", 0.0),
            last_solved=d.get("last_solved", 0.0),
            last_failed=d.get("last_failed", 0.0),
            interval_seconds=d.get("interval_seconds", 300.0),
            easiness_factor=d.get("easiness_factor", 2.5),
            repetition_count=d.get("repetition_count", 0),
            recent_scores=d.get("recent_scores", [])[-20:],
        )


class SpacedRepetitionScheduler:
    """Ebbinghaus-driven task scheduler that prioritizes weak areas.

    Integrates with continuous_train.py to inject spaced repetition tasks
    into the normal training loop.
    """

    # Minimum interval: 2 minutes (don't hammer the same category)
    MIN_INTERVAL = 120.0
    # Maximum interval: 24 hours (even mastered categories get reviewed)
    MAX_INTERVAL = 86400.0
    # How many recent scores to keep per category
    HISTORY_SIZE = 20

    def __init__(self):
        self.records: dict[str, CategoryRecord] = {}
        self._load_state()

    # ── Recording ──────────────────────────────────────────────

    def record_attempt(self, category: str, difficulty: int, score: float,
                       first_try: bool = False, time_ms: float = 0.0):
        """Record the result of a task attempt."""
        now = time.time()
        rec = self._get_or_create(category, difficulty)

        rec.attempted += 1
        rec.last_attempted = now
        rec.recent_scores.append(score)
        rec.recent_scores = rec.recent_scores[-self.HISTORY_SIZE:]

        if score >= 1.0:
            rec.solved += 1
            rec.last_solved = now
            rec.consecutive_successes += 1
            rec.consecutive_failures = 0
            if first_try:
                rec.first_try += 1
            # SM-2: update interval on success
            self._update_interval_success(rec)
        else:
            rec.last_failed = now
            rec.consecutive_failures += 1
            rec.consecutive_successes = 0
            # SM-2: reset interval on failure
            self._update_interval_failure(rec)

        self._save_state()

    # ── Scheduling ─────────────────────────────────────────────

    def get_next_categories(self, n: int = 5, exclude: set[str] | None = None) -> list[dict]:
        """Get the top N categories that should be reviewed next.

        Returns list of {category, difficulty, priority, reason, solve_rate, interval}.
        """
        if not self.records:
            return []

        now = time.time()
        exclude = exclude or set()
        scored: list[tuple[float, str, str]] = []

        for cat, rec in self.records.items():
            if cat in exclude or rec.attempted < 2:
                continue

            priority, reason = self._compute_priority(rec, now)
            if priority > 0:
                scored.append((priority, cat, reason))

        # Sort by priority descending
        scored.sort(key=lambda x: x[0], reverse=True)

        results = []
        for priority, cat, reason in scored[:n]:
            rec = self.records[cat]
            results.append({
                "category": cat,
                "difficulty": rec.difficulty,
                "priority": round(priority, 3),
                "reason": reason,
                "solve_rate": round(rec.recent_solve_rate, 3),
                "interval": round(rec.interval_seconds, 0),
                "attempted": rec.attempted,
                "last_attempted_ago": round(now - rec.last_attempted, 0) if rec.last_attempted else 0,
            })

        return results

    def should_inject_review(self, batch_num: int) -> bool:
        """Should we inject a spaced repetition batch at this point?

        Injects every 4th batch, but only if there are categories due for review.
        """
        if batch_num % 4 != 0:
            return False
        due = self.get_due_categories()
        return len(due) > 0

    def get_due_categories(self) -> list[str]:
        """Get categories that are past their review interval."""
        now = time.time()
        due = []
        for cat, rec in self.records.items():
            if rec.attempted < 2:
                continue
            time_since = now - rec.last_attempted
            if time_since >= rec.interval_seconds and not rec.is_mastered:
                due.append(cat)
        return due

    def pick_review_task_params(self) -> Optional[dict]:
        """Pick the best category + difficulty for a review task.

        Returns {category, difficulty, reason} or None.
        """
        candidates = self.get_next_categories(n=5)
        if not candidates:
            return None

        # Weighted random from top 5 — higher priority = more likely
        weights = [c["priority"] for c in candidates]
        total = sum(weights)
        if total <= 0:
            return candidates[0]

        weights = [w / total for w in weights]
        chosen = random.choices(candidates, weights=weights, k=1)[0]
        return {
            "category": chosen["category"],
            "difficulty": chosen["difficulty"],
            "reason": chosen["reason"],
        }

    # ── Stats ──────────────────────────────────────────────────

    def get_stats(self) -> dict:
        """Get scheduler statistics for dashboard/logging."""
        total_cats = len(self.records)
        weak = [c for c in self.records.values() if c.is_weak]
        learning = [c for c in self.records.values() if c.in_learning_zone]
        mastered = [c for c in self.records.values() if c.is_mastered]
        due = self.get_due_categories()

        return {
            "total_categories": total_cats,
            "weak_categories": len(weak),
            "learning_zone_categories": len(learning),
            "mastered_categories": len(mastered),
            "due_for_review": len(due),
            "weak_list": [{"cat": c.category, "rate": round(c.recent_solve_rate, 2)} for c in weak],
            "due_list": due[:10],
            "top_priorities": self.get_next_categories(n=5),
        }

    def get_category_stats(self) -> list[dict]:
        """Get per-category stats sorted by weakness."""
        cats = []
        for rec in self.records.values():
            cats.append({
                "category": rec.category,
                "difficulty": rec.difficulty,
                "attempted": rec.attempted,
                "solved": rec.solved,
                "solve_rate": round(rec.solve_rate, 3),
                "recent_solve_rate": round(rec.recent_solve_rate, 3),
                "in_learning_zone": rec.in_learning_zone,
                "is_weak": rec.is_weak,
                "is_mastered": rec.is_mastered,
                "interval": round(rec.interval_seconds, 0),
                "easiness": round(rec.easiness_factor, 2),
            })
        cats.sort(key=lambda x: x["recent_solve_rate"])
        return cats

    # ── Bulk import from progress.json ─────────────────────────

    def import_from_progress(self, progress: dict):
        """Import historical data from progress.json to bootstrap the scheduler."""
        history = progress.get("history", [])
        if not history:
            return

        # Group by category
        by_cat: dict[str, list[dict]] = {}
        for h in history:
            cat = h.get("category", "unknown")
            if cat == "unknown":
                continue
            by_cat.setdefault(cat, []).append(h)

        imported = 0
        for cat, entries in by_cat.items():
            if cat in self.records and self.records[cat].attempted >= len(entries):
                continue  # Already imported

            rec = self._get_or_create(cat, entries[-1].get("difficulty", 5))
            for h in entries:
                score = h.get("score", 0)
                rec.attempted += 1
                rec.recent_scores.append(score)
                if score >= 1.0:
                    rec.solved += 1
                    if h.get("first_try", False):
                        rec.first_try += 1
                ts = h.get("timestamp", 0)
                if ts:
                    rec.last_attempted = max(rec.last_attempted, ts)
                    if score >= 1.0:
                        rec.last_solved = max(rec.last_solved, ts)
                    else:
                        rec.last_failed = max(rec.last_failed, ts)

            rec.recent_scores = rec.recent_scores[-self.HISTORY_SIZE:]
            # Compute initial interval based on solve rate
            rate = rec.solve_rate
            quality = rate * 5.0
            rec.easiness_factor = max(1.3, 2.5 - 0.8 * (5.0 - quality))
            rec.interval_seconds = max(
                self.MIN_INTERVAL,
                300.0 * rec.easiness_factor ** max(0, rec.solved // 5)
            )
            rec.interval_seconds = min(rec.interval_seconds, self.MAX_INTERVAL)
            imported += 1

        if imported > 0:
            self._save_state()

        return imported

    # ── Internal ───────────────────────────────────────────────

    def _get_or_create(self, category: str, difficulty: int = 5) -> CategoryRecord:
        if category not in self.records:
            self.records[category] = CategoryRecord(category=category, difficulty=difficulty)
        return self.records[category]

    def _compute_priority(self, rec: CategoryRecord, now: float) -> tuple[float, str]:
        """Compute review priority for a category.

        Returns (priority_score, reason_string).
        """
        rate = rec.recent_solve_rate if len(rec.recent_scores) >= 5 else rec.solve_rate

        # 1. Weakness score: weaker categories get higher priority
        weakness = 1.0 - rate

        # 2. Urgency: how overdue is this category?
        time_since = now - rec.last_attempted if rec.last_attempted else 3600.0
        overdue_ratio = time_since / max(rec.interval_seconds, 1.0)
        # Sigmoid-like urgency: ramps up as we pass the interval
        urgency = 1.0 / (1.0 + math.exp(-2.0 * (overdue_ratio - 1.0)))

        # 3. Learning zone bonus: categories at 30-70% get 2x priority
        zone_bonus = 2.0 if rec.in_learning_zone else 1.0

        # 4. Consecutive failure bonus: failing repeatedly = urgent
        fail_bonus = 1.0 + min(rec.consecutive_failures * 0.3, 1.5)

        # 5. Staleness penalty: if never attempted, low priority
        if rec.attempted < 3:
            staleness = 0.5
        else:
            staleness = 1.0

        priority = weakness * urgency * zone_bonus * fail_bonus * staleness

        # Determine reason
        if rec.in_learning_zone:
            reason = f"learning_zone ({rate:.0%})"
        elif rec.consecutive_failures >= 3:
            reason = f"consecutive_failures ({rec.consecutive_failures})"
        elif overdue_ratio > 1.5:
            reason = f"overdue ({time_since/60:.0f}min > {rec.interval_seconds/60:.0f}min)"
        elif rate < 0.5:
            reason = f"weak ({rate:.0%})"
        else:
            reason = f"review ({rate:.0%})"

        return priority, reason

    def _update_interval_success(self, rec: CategoryRecord):
        """SM-2 inspired interval update on success."""
        rate = rec.recent_solve_rate if len(rec.recent_scores) >= 5 else rec.solve_rate
        quality = rate * 5.0  # 0-5 scale

        # Update easiness factor
        rec.easiness_factor = max(1.3, rec.easiness_factor + 0.1 - (5.0 - quality) * (0.08 + (5.0 - quality) * 0.02))

        # Update interval
        rec.repetition_count += 1
        if rec.repetition_count == 1:
            rec.interval_seconds = 300.0  # 5 min
        elif rec.repetition_count == 2:
            rec.interval_seconds = 600.0  # 10 min
        else:
            rec.interval_seconds *= rec.easiness_factor

        rec.interval_seconds = max(self.MIN_INTERVAL, min(rec.interval_seconds, self.MAX_INTERVAL))

    def _update_interval_failure(self, rec: CategoryRecord):
        """Reset interval on failure — review sooner."""
        rec.repetition_count = 0
        # Shrink interval: review sooner, but not immediately
        rec.interval_seconds = max(self.MIN_INTERVAL, rec.interval_seconds * 0.4)

    def _load_state(self):
        """Load scheduler state from disk."""
        try:
            if STATE_PATH.exists():
                data = json.loads(STATE_PATH.read_text(encoding="utf-8"))
                for cat_data in data.get("records", []):
                    rec = CategoryRecord.from_dict(cat_data)
                    self.records[rec.category] = rec
        except Exception:
            pass

    def _save_state(self):
        """Save scheduler state to disk."""
        try:
            STATE_PATH.parent.mkdir(parents=True, exist_ok=True)
            data = {
                "records": [rec.to_dict() for rec in self.records.values()],
                "last_saved": time.time(),
            }
            STATE_PATH.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
        except Exception:
            pass
