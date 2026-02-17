"""
Meta-Learning Engine for Frankenstein AI.

Analyzes Frankenstein's own learning curve and automatically adjusts
hyperparameters for optimal training:

1. LEARNING RATE ANALYSIS: Detects plateaus, regressions, breakthroughs
2. CATEGORY WEAKNESS DETECTION: Identifies weak spots and adjusts training focus
3. STRATEGY OPTIMIZATION: Learns which strategies work for which task types
4. PARAMETER AUTO-TUNING: Adjusts HDC dimensions, AIF exploration, Ebbinghaus decay
5. TRAINING SCHEDULE OPTIMIZATION: Adjusts batch composition for maximum learning
"""

import json
import math
from dataclasses import dataclass, field
from pathlib import Path
from collections import Counter


@dataclass
class LearningPhase:
    """Detected phase in the learning curve."""
    phase: str  # "improving", "plateau", "regression", "breakthrough"
    confidence: float  # 0-1
    duration: int  # how many tasks this phase has lasted
    metric: str  # which metric triggered this detection
    recommendation: str  # what to do about it


@dataclass
class CategoryInsight:
    """Insight about a specific category's performance."""
    category: str
    solve_rate: float
    first_try_rate: float
    avg_time_ms: float
    trend: str  # "improving", "stable", "declining"
    best_strategy: str
    weakness_score: float  # 0=strong, 1=very weak
    recommended_difficulty: int
    sample_count: int


@dataclass
class ParameterRecommendation:
    """Recommended parameter adjustment."""
    parameter: str
    current_value: float
    recommended_value: float
    reason: str
    confidence: float


@dataclass
class TrainingScheduleRecommendation:
    """Recommended changes to training schedule."""
    v4_ratio: float  # How often to inject v4 tasks (0-1)
    weak_category_focus: list[str]  # Categories to focus on
    difficulty_range: tuple[int, int]  # Recommended difficulty range
    batch_size: int  # Recommended batch size
    reasons: list[str]


class MetaLearningEngine:
    """Analyzes training history and recommends optimizations."""

    def __init__(self, history_window: int = 200):
        self.history_window = history_window
        self._last_analysis = None
        self._analysis_interval = 50  # Analyze every N tasks

    def analyze(self, progress: dict) -> dict:
        """Full meta-learning analysis. Returns insights and recommendations."""
        history = progress.get("history", [])
        if len(history) < 20:
            return {"status": "insufficient_data", "tasks_needed": 20 - len(history)}

        recent = history[-self.history_window:]

        phase = self._detect_learning_phase(recent)
        categories = self._analyze_categories(recent)
        strategies = self._analyze_strategies(recent)
        params = self._recommend_parameters(progress, recent, phase, categories)
        schedule = self._recommend_schedule(progress, categories, phase)

        return {
            "status": "analyzed",
            "total_analyzed": len(recent),
            "learning_phase": {
                "phase": phase.phase,
                "confidence": round(phase.confidence, 3),
                "duration": phase.duration,
                "metric": phase.metric,
                "recommendation": phase.recommendation,
            },
            "category_insights": [
                {
                    "category": c.category,
                    "solve_rate": round(c.solve_rate, 3),
                    "first_try_rate": round(c.first_try_rate, 3),
                    "avg_time_ms": round(c.avg_time_ms, 1),
                    "trend": c.trend,
                    "best_strategy": c.best_strategy,
                    "weakness_score": round(c.weakness_score, 3),
                    "recommended_difficulty": c.recommended_difficulty,
                    "sample_count": c.sample_count,
                }
                for c in categories
            ],
            "strategy_insights": strategies,
            "parameter_recommendations": [
                {
                    "parameter": p.parameter,
                    "current": round(p.current_value, 4),
                    "recommended": round(p.recommended_value, 4),
                    "reason": p.reason,
                    "confidence": round(p.confidence, 3),
                }
                for p in params
            ],
            "schedule_recommendation": {
                "v4_ratio": round(schedule.v4_ratio, 2),
                "weak_categories": schedule.weak_category_focus,
                "difficulty_range": list(schedule.difficulty_range),
                "batch_size": schedule.batch_size,
                "reasons": schedule.reasons,
            },
        }

    def _detect_learning_phase(self, history: list[dict]) -> LearningPhase:
        """Detect current learning phase from recent history."""
        if len(history) < 20:
            return LearningPhase("warming_up", 0.5, len(history), "solve_rate", "Continue training")

        # Compare recent windows
        window = min(50, len(history) // 2)
        recent = history[-window:]
        older = history[-2 * window:-window] if len(history) >= 2 * window else history[:window]

        recent_rate = sum(1 for h in recent if h.get("score", 0) >= 1.0) / len(recent)
        older_rate = sum(1 for h in older if h.get("score", 0) >= 1.0) / len(older)

        recent_ft = sum(1 for h in recent if h.get("first_try", False)) / len(recent)
        older_ft = sum(1 for h in older if h.get("first_try", False)) / len(older)

        recent_time = [h.get("time_ms", 0) for h in recent if h.get("time_ms", 0) > 0]
        older_time = [h.get("time_ms", 0) for h in older if h.get("time_ms", 0) > 0]
        avg_recent_time = sum(recent_time) / max(len(recent_time), 1)
        avg_older_time = sum(older_time) / max(len(older_time), 1)

        rate_delta = recent_rate - older_rate
        ft_delta = recent_ft - older_ft

        # Breakthrough: significant improvement
        if rate_delta > 0.15 or (rate_delta > 0.08 and ft_delta > 0.1):
            return LearningPhase(
                "breakthrough", min(1.0, abs(rate_delta) * 3),
                window, "solve_rate",
                "Breakthrough detected! Push difficulty higher to capitalize."
            )

        # Regression: getting worse
        if rate_delta < -0.10:
            return LearningPhase(
                "regression", min(1.0, abs(rate_delta) * 3),
                window, "solve_rate",
                "Performance declining. Consider lowering difficulty or focusing on weak categories."
            )

        # Plateau: stable but not improving
        if abs(rate_delta) < 0.05 and abs(ft_delta) < 0.05:
            if recent_rate > 0.85:
                return LearningPhase(
                    "plateau_high", 0.7, window, "solve_rate",
                    "High plateau. Increase difficulty or introduce new task types (V4)."
                )
            elif recent_rate > 0.5:
                return LearningPhase(
                    "plateau_mid", 0.6, window, "solve_rate",
                    "Mid plateau. Focus on weak categories and use spaced repetition."
                )
            else:
                return LearningPhase(
                    "plateau_low", 0.6, window, "solve_rate",
                    "Low plateau. Lower difficulty, increase hints, review fundamentals."
                )

        # Improving: steady progress
        if rate_delta > 0.03:
            return LearningPhase(
                "improving", min(1.0, rate_delta * 5),
                window, "solve_rate",
                "Steady improvement. Continue current approach."
            )

        return LearningPhase("stable", 0.5, window, "solve_rate", "Stable performance.")

    def _analyze_categories(self, history: list[dict]) -> list[CategoryInsight]:
        """Analyze performance per category."""
        cat_data: dict[str, list[dict]] = {}
        for h in history:
            cat = h.get("category", "unknown")
            cat_data.setdefault(cat, []).append(h)

        insights = []
        for cat, entries in cat_data.items():
            if len(entries) < 3:
                continue

            solved = sum(1 for e in entries if e.get("score", 0) >= 1.0)
            first_try = sum(1 for e in entries if e.get("first_try", False))
            times = [e.get("time_ms", 0) for e in entries if e.get("time_ms", 0) > 0]
            avg_time = sum(times) / max(len(times), 1)

            solve_rate = solved / len(entries)
            ft_rate = first_try / len(entries)

            # Trend: compare first half vs second half
            mid = len(entries) // 2
            if mid >= 2:
                first_half_rate = sum(1 for e in entries[:mid] if e.get("score", 0) >= 1.0) / mid
                second_half_rate = sum(1 for e in entries[mid:] if e.get("score", 0) >= 1.0) / (len(entries) - mid)
                if second_half_rate - first_half_rate > 0.1:
                    trend = "improving"
                elif first_half_rate - second_half_rate > 0.1:
                    trend = "declining"
                else:
                    trend = "stable"
            else:
                trend = "unknown"

            # Best strategy for this category
            strat_counts: dict[str, dict] = {}
            for e in entries:
                s = e.get("strategy", "unknown")
                if not s:
                    continue
                strat_counts.setdefault(s, {"total": 0, "solved": 0})
                strat_counts[s]["total"] += 1
                if e.get("score", 0) >= 1.0:
                    strat_counts[s]["solved"] += 1

            best_strategy = "unknown"
            best_rate = 0
            for s, sc in strat_counts.items():
                if sc["total"] >= 2:
                    r = sc["solved"] / sc["total"]
                    if r > best_rate:
                        best_rate = r
                        best_strategy = s

            # Weakness score: 0=strong, 1=very weak
            weakness = 1.0 - solve_rate
            if trend == "declining":
                weakness = min(1.0, weakness + 0.15)
            elif trend == "improving":
                weakness = max(0.0, weakness - 0.1)

            # Recommended difficulty based on solve rate
            avg_diff = sum(e.get("difficulty", 5) for e in entries) / len(entries)
            if solve_rate > 0.85:
                rec_diff = min(10, int(avg_diff) + 1)
            elif solve_rate < 0.3:
                rec_diff = max(1, int(avg_diff) - 1)
            else:
                rec_diff = int(avg_diff)

            insights.append(CategoryInsight(
                category=cat,
                solve_rate=solve_rate,
                first_try_rate=ft_rate,
                avg_time_ms=avg_time,
                trend=trend,
                best_strategy=best_strategy,
                weakness_score=weakness,
                recommended_difficulty=rec_diff,
                sample_count=len(entries),
            ))

        # Sort by weakness (weakest first)
        insights.sort(key=lambda x: -x.weakness_score)
        return insights

    def _analyze_strategies(self, history: list[dict]) -> dict:
        """Analyze strategy effectiveness."""
        strat_data: dict[str, dict] = {}
        for h in history:
            s = h.get("strategy", "")
            if not s:
                continue
            strat_data.setdefault(s, {"total": 0, "solved": 0, "first_try": 0, "times": []})
            strat_data[s]["total"] += 1
            if h.get("score", 0) >= 1.0:
                strat_data[s]["solved"] += 1
            if h.get("first_try", False):
                strat_data[s]["first_try"] += 1
            if h.get("time_ms", 0) > 0:
                strat_data[s]["times"].append(h["time_ms"])

        result = {}
        for s, sd in strat_data.items():
            if sd["total"] < 3:
                continue
            result[s] = {
                "total": sd["total"],
                "solve_rate": round(sd["solved"] / sd["total"], 3),
                "first_try_rate": round(sd["first_try"] / sd["total"], 3),
                "avg_time_ms": round(sum(sd["times"]) / max(len(sd["times"]), 1), 1),
                "efficiency": round(
                    (sd["solved"] / sd["total"]) / max(sum(sd["times"]) / max(len(sd["times"]), 1) / 1000, 0.1),
                    3
                ),
            }

        return result

    def _recommend_parameters(self, progress: dict, history: list[dict],
                              phase: LearningPhase, categories: list[CategoryInsight]) -> list[ParameterRecommendation]:
        """Recommend parameter adjustments based on analysis."""
        recs = []
        stack = progress.get("stack", {})

        # 1. AIF Exploration weight
        current_exploration = stack.get("aif_exploration", 0.3)
        if phase.phase == "plateau_high":
            recs.append(ParameterRecommendation(
                "aif_exploration_weight", current_exploration,
                min(0.6, current_exploration + 0.1),
                "High plateau — increase exploration to discover new strategies",
                0.7
            ))
        elif phase.phase == "regression":
            recs.append(ParameterRecommendation(
                "aif_exploration_weight", current_exploration,
                min(0.5, current_exploration + 0.05),
                "Regression — slightly increase exploration to escape local minimum",
                0.6
            ))
        elif phase.phase == "breakthrough":
            recs.append(ParameterRecommendation(
                "aif_exploration_weight", current_exploration,
                max(0.15, current_exploration - 0.05),
                "Breakthrough — reduce exploration to exploit current approach",
                0.6
            ))

        # 2. Max attempts based on solve rate
        overall_rate = sum(1 for h in history if h.get("score", 0) >= 1.0) / max(len(history), 1)
        current_max = 3
        if overall_rate < 0.4:
            recs.append(ParameterRecommendation(
                "max_attempts", current_max, 5,
                "Low solve rate — more attempts give more chances to learn from errors",
                0.7
            ))
        elif overall_rate > 0.85:
            recs.append(ParameterRecommendation(
                "max_attempts", current_max, 2,
                "High solve rate — fewer attempts needed, saves API calls",
                0.5
            ))

        # 3. Batch size based on time efficiency
        times = [h.get("time_ms", 0) for h in history[-50:] if h.get("time_ms", 0) > 0]
        if times:
            avg_time = sum(times) / len(times)
            if avg_time > 15000:
                recs.append(ParameterRecommendation(
                    "batch_size", 10, 5,
                    f"Average solve time {avg_time:.0f}ms is high — smaller batches for faster feedback",
                    0.6
                ))
            elif avg_time < 3000:
                recs.append(ParameterRecommendation(
                    "batch_size", 10, 15,
                    f"Average solve time {avg_time:.0f}ms is low — larger batches for efficiency",
                    0.5
                ))

        # 4. Difficulty adjustment
        current_diff = progress.get("current_difficulty", 5)
        weak_cats = [c for c in categories if c.weakness_score > 0.6]
        strong_cats = [c for c in categories if c.weakness_score < 0.2]

        if len(weak_cats) > len(strong_cats) * 2:
            recs.append(ParameterRecommendation(
                "difficulty", current_diff, max(1, current_diff - 1),
                f"Too many weak categories ({len(weak_cats)}) — lower difficulty to build foundations",
                0.7
            ))
        elif len(strong_cats) > len(categories) * 0.7 and current_diff < 10:
            recs.append(ParameterRecommendation(
                "difficulty", current_diff, min(10, current_diff + 1),
                f"Most categories strong ({len(strong_cats)}/{len(categories)}) — increase difficulty",
                0.6
            ))

        return recs

    def _recommend_schedule(self, progress: dict, categories: list[CategoryInsight],
                           phase: LearningPhase) -> TrainingScheduleRecommendation:
        """Recommend training schedule adjustments."""
        reasons = []

        # V4 ratio: how often to inject new task types
        v4_ratio = 0.15  # Default: 15% of batches
        if phase.phase in ("plateau_high", "plateau_mid"):
            v4_ratio = 0.30
            reasons.append(f"Plateau detected — increase V4 task ratio to {v4_ratio:.0%}")
        elif phase.phase == "regression":
            v4_ratio = 0.10
            reasons.append("Regression — reduce V4 tasks, focus on fundamentals")

        # Weak categories to focus on
        weak = [c.category for c in categories if c.weakness_score > 0.5][:5]
        if weak:
            reasons.append(f"Focus on weak categories: {', '.join(weak)}")

        # Difficulty range
        current_diff = progress.get("current_difficulty", 5)
        if phase.phase == "regression":
            diff_range = (max(1, current_diff - 2), current_diff)
        elif phase.phase == "breakthrough":
            diff_range = (current_diff, min(10, current_diff + 2))
        else:
            diff_range = (max(1, current_diff - 1), min(10, current_diff + 1))
        reasons.append(f"Difficulty range: {diff_range[0]}-{diff_range[1]}")

        # Batch size
        batch_size = 10
        total_tasks = progress.get("total_tasks_attempted", 0)
        if total_tasks > 1000:
            batch_size = 15  # More experienced → larger batches
            reasons.append("Experienced agent — larger batches")
        elif total_tasks < 100:
            batch_size = 5  # New agent → smaller batches for faster feedback
            reasons.append("New agent — smaller batches for faster learning")

        return TrainingScheduleRecommendation(
            v4_ratio=v4_ratio,
            weak_category_focus=weak,
            difficulty_range=diff_range,
            batch_size=batch_size,
            reasons=reasons,
        )

    def should_analyze(self, task_count: int) -> bool:
        """Check if it's time for a meta-learning analysis."""
        return task_count % self._analysis_interval == 0

    def get_category_strategy_map(self, history: list[dict]) -> dict[str, str]:
        """Build a map of best strategy per category from history."""
        cat_strats: dict[str, dict[str, dict]] = {}
        for h in history:
            cat = h.get("category", "")
            strat = h.get("strategy", "")
            if not cat or not strat:
                continue
            cat_strats.setdefault(cat, {}).setdefault(strat, {"total": 0, "solved": 0})
            cat_strats[cat][strat]["total"] += 1
            if h.get("score", 0) >= 1.0:
                cat_strats[cat][strat]["solved"] += 1

        result = {}
        for cat, strats in cat_strats.items():
            best_strat = ""
            best_rate = 0
            for s, sd in strats.items():
                if sd["total"] >= 3:
                    rate = sd["solved"] / sd["total"]
                    if rate > best_rate:
                        best_rate = rate
                        best_strat = s
            if best_strat:
                result[cat] = best_strat

        return result
