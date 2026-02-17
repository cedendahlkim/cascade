"""
Multi-LLM Router for Frankenstein AI.

Intelligently routes tasks to the best LLM based on:
1. Task category and difficulty
2. Historical performance per LLM per category
3. Cost optimization (cheaper models for easy tasks)
4. Fallback chains on failure
5. Active Inference integration — AIF can influence LLM choice

Supported providers:
- gemini-flash: Fast, free tier, good for simple tasks
- gemini-pro: Slower, better reasoning, for complex tasks  
- grok: Alternative provider, good for creative/unusual tasks
"""

import time
import random
from dataclasses import dataclass, field
from collections import defaultdict


@dataclass
class LLMProfile:
    """Profile for an LLM provider."""
    name: str
    model_id: str
    provider: str  # "gemini" or "grok"
    cost_tier: int  # 1=free/cheap, 2=moderate, 3=expensive
    speed_tier: int  # 1=fast, 2=moderate, 3=slow
    reasoning_tier: int  # 1=basic, 2=good, 3=excellent
    strengths: list[str] = field(default_factory=list)
    weaknesses: list[str] = field(default_factory=list)


# Available LLM profiles
LLM_PROFILES = {
    "gemini-flash": LLMProfile(
        name="gemini-flash",
        model_id="gemini-2.0-flash",
        provider="gemini",
        cost_tier=1, speed_tier=1, reasoning_tier=2,
        strengths=["fast", "arithmetic", "string", "pattern", "list", "simple_algorithms"],
        weaknesses=["complex_reasoning", "multi_step", "system_design"],
    ),
    "grok-fast": LLMProfile(
        name="grok-fast",
        model_id="grok-3-mini-fast",
        provider="grok",
        cost_tier=1, speed_tier=1, reasoning_tier=2,
        strengths=["creative", "unusual_patterns", "text_processing", "regex"],
        weaknesses=["strict_formatting", "math_precision"],
    ),
}


@dataclass
class RoutingDecision:
    """Result of routing decision."""
    primary: str  # Primary LLM name
    fallback: str | None  # Fallback LLM name
    reason: str
    confidence: float
    cost_estimate: int  # 1-3


@dataclass
class LLMPerformanceRecord:
    """Track performance of an LLM on a category."""
    total: int = 0
    solved: int = 0
    first_try: int = 0
    total_time_ms: float = 0.0
    rate_limits: int = 0
    failures: int = 0

    @property
    def solve_rate(self) -> float:
        return self.solved / max(self.total, 1)

    @property
    def avg_time_ms(self) -> float:
        return self.total_time_ms / max(self.total, 1)

    @property
    def reliability(self) -> float:
        """How reliable is this LLM (1.0 = no failures)."""
        if self.total == 0:
            return 0.5
        return 1.0 - (self.rate_limits + self.failures) / self.total


class MultiLLMRouter:
    """Routes tasks to the best available LLM."""

    def __init__(self, available_providers: list[str] | None = None):
        """
        Args:
            available_providers: List of provider names that have API keys.
                                 e.g. ["gemini", "grok"]
        """
        self.available_providers = available_providers or ["gemini"]
        
        # Filter profiles to only available ones
        self.profiles = {
            name: profile for name, profile in LLM_PROFILES.items()
            if profile.provider in self.available_providers
        }
        
        # Performance tracking: llm_name -> category -> LLMPerformanceRecord
        self.performance: dict[str, dict[str, LLMPerformanceRecord]] = defaultdict(
            lambda: defaultdict(LLMPerformanceRecord)
        )
        
        # Category -> best LLM mapping (learned over time)
        self.category_preference: dict[str, str] = {}
        
        # Global stats
        self.total_routed = 0
        self.routing_overrides = 0

    def route(self, category: str, difficulty: int, tags: list[str] = None,
              aif_suggestion: str | None = None) -> RoutingDecision:
        """Decide which LLM to use for a task.
        
        Args:
            category: Task category (e.g., "algorithm", "regex", "system_design")
            difficulty: Task difficulty (1-10)
            tags: Task tags for more specific matching
            aif_suggestion: Optional AIF-suggested LLM name
        """
        self.total_routed += 1
        tags = tags or []

        if len(self.profiles) == 0:
            return RoutingDecision("gemini-flash", None, "No profiles available", 0.5, 1)

        if len(self.profiles) == 1:
            name = list(self.profiles.keys())[0]
            return RoutingDecision(name, None, "Only one LLM available", 1.0, 1)

        # Score each LLM
        scores: dict[str, float] = {}
        for name, profile in self.profiles.items():
            score = self._score_llm(name, profile, category, difficulty, tags)
            scores[name] = score

        # AIF override: if AIF suggests a specific LLM, boost its score
        if aif_suggestion and aif_suggestion in scores:
            scores[aif_suggestion] *= 1.3
            self.routing_overrides += 1

        # Sort by score
        ranked = sorted(scores.items(), key=lambda x: -x[1])
        primary = ranked[0][0]
        fallback = ranked[1][0] if len(ranked) > 1 else None

        # Confidence based on score gap
        if len(ranked) > 1:
            gap = ranked[0][1] - ranked[1][1]
            confidence = min(1.0, 0.5 + gap)
        else:
            confidence = 0.8

        reason = self._explain_routing(primary, category, difficulty, scores)
        cost = self.profiles[primary].cost_tier

        return RoutingDecision(primary, fallback, reason, confidence, cost)

    def _score_llm(self, name: str, profile: LLMProfile, category: str,
                   difficulty: int, tags: list[str]) -> float:
        """Score an LLM for a specific task."""
        score = 0.5  # Base score

        # 1. Historical performance on this category (most important)
        perf = self.performance[name].get(category)
        if perf and perf.total >= 5:
            score += perf.solve_rate * 0.4  # Up to +0.4
            score += perf.reliability * 0.1  # Up to +0.1
        elif perf and perf.total >= 2:
            score += perf.solve_rate * 0.2  # Less weight with fewer samples

        # 2. Category preference (learned mapping)
        if self.category_preference.get(category) == name:
            score += 0.15

        # 3. Difficulty-based routing
        if difficulty <= 4:
            # Easy tasks → prefer fast/cheap
            score += (3 - profile.speed_tier) * 0.1
            score += (3 - profile.cost_tier) * 0.05
        elif difficulty >= 8:
            # Hard tasks → prefer reasoning
            score += (profile.reasoning_tier - 1) * 0.15
        else:
            # Medium → balanced
            score += (profile.reasoning_tier - 1) * 0.05
            score += (3 - profile.speed_tier) * 0.05

        # 4. Strength/weakness matching
        category_lower = category.lower()
        tag_set = set(t.lower() for t in tags)
        all_terms = {category_lower} | tag_set

        for strength in profile.strengths:
            if strength in all_terms or any(strength in t for t in all_terms):
                score += 0.08

        for weakness in profile.weaknesses:
            if weakness in all_terms or any(weakness in t for t in all_terms):
                score -= 0.08

        # 5. Exploration: occasionally try non-preferred LLM
        if random.random() < 0.05:
            score += random.uniform(-0.1, 0.2)

        return max(0.0, score)

    def _explain_routing(self, chosen: str, category: str, difficulty: int,
                        scores: dict[str, float]) -> str:
        """Generate human-readable explanation for routing decision."""
        profile = self.profiles[chosen]
        perf = self.performance[chosen].get(category)

        parts = [f"{chosen}"]
        if perf and perf.total >= 5:
            parts.append(f"({perf.solve_rate:.0%} on {category})")
        elif difficulty <= 4:
            parts.append("(fast/cheap for easy task)")
        elif difficulty >= 8:
            parts.append(f"(reasoning tier {profile.reasoning_tier})")
        else:
            parts.append("(balanced choice)")

        return " ".join(parts)

    def record_result(self, llm_name: str, category: str, score: float,
                      first_try: bool, time_ms: float, was_rate_limited: bool = False,
                      was_failure: bool = False):
        """Record the result of using an LLM on a task."""
        perf = self.performance[llm_name][category]
        perf.total += 1
        if score >= 1.0:
            perf.solved += 1
        if first_try:
            perf.first_try += 1
        perf.total_time_ms += time_ms
        if was_rate_limited:
            perf.rate_limits += 1
        if was_failure:
            perf.failures += 1

        # Update category preference if this LLM is clearly better
        self._update_category_preference(category)

    def _update_category_preference(self, category: str):
        """Update which LLM is preferred for a category."""
        best_name = ""
        best_rate = 0.0
        min_samples = 5

        for name in self.profiles:
            perf = self.performance[name].get(category)
            if perf and perf.total >= min_samples:
                # Weighted score: solve_rate * reliability
                effective_rate = perf.solve_rate * perf.reliability
                if effective_rate > best_rate:
                    best_rate = effective_rate
                    best_name = name

        if best_name:
            self.category_preference[category] = best_name

    def get_stats(self) -> dict:
        """Get routing statistics."""
        stats = {
            "total_routed": self.total_routed,
            "routing_overrides": self.routing_overrides,
            "available_llms": list(self.profiles.keys()),
            "category_preferences": dict(self.category_preference),
            "per_llm": {},
        }

        for name in self.profiles:
            llm_stats = {
                "categories": {},
                "total_tasks": 0,
                "total_solved": 0,
            }
            for cat, perf in self.performance[name].items():
                if perf.total > 0:
                    llm_stats["categories"][cat] = {
                        "total": perf.total,
                        "solve_rate": round(perf.solve_rate, 3),
                        "avg_time_ms": round(perf.avg_time_ms, 1),
                        "reliability": round(perf.reliability, 3),
                    }
                    llm_stats["total_tasks"] += perf.total
                    llm_stats["total_solved"] += perf.solved
            stats["per_llm"][name] = llm_stats

        return stats

    def get_llm_for_category(self, category: str) -> str | None:
        """Get the preferred LLM for a category, if known."""
        return self.category_preference.get(category)

    def import_from_history(self, history: list[dict]) -> int:
        """Bootstrap performance data from training history."""
        imported = 0
        for h in history:
            cat = h.get("category", "")
            strat = h.get("strategy", "")
            score = h.get("score", 0)
            time_ms = h.get("time_ms", 0)
            first_try = h.get("first_try", False)

            if not cat:
                continue

            # Infer which LLM was used from strategy
            # System 0/1 don't use LLMs, skip them
            if strat in ("system0_deterministic", "system0_promoted", "system1_memory", "system1_promoted"):
                continue

            # Default to gemini-flash for historical data
            llm_name = "gemini-flash"
            self.record_result(llm_name, cat, score, first_try, time_ms)
            imported += 1

        return imported
