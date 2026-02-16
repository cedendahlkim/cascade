"""
Gut Feeling System — Sub-symbolisk intuitionsmodul för Frankenstein AI

Beräknar en snabb "magkänsla" INNAN det dyra LLM-anropet genom att
aggregera signaler från hela den kognitiva stacken:

  HDC (familiarity) + Historik (track record) + Momentum (streak) +
  Komplexitet (textanalys) + Ebbinghaus (minnesstyrka) + AIF (energi)

Output: GutFeelingResult med valence (-1 till +1), confidence, och
en rekommendation som påverkar strategival, antal försök och prompt.

Inspirerat av Damasios Somatic Marker Hypothesis — emotioner som
snabba genvägar för beslutsfattande.
"""

import math
import time
from dataclasses import dataclass, field
from collections import deque
from typing import Optional


# === Complexity keywords ===
# Nyckelord som indikerar hög algoritmisk komplexitet
_HARD_KEYWORDS = frozenset([
    "rekursion", "rekursiv", "dynamisk", "dp", "graf", "graph", "träd", "tree",
    "dfs", "bfs", "shortest", "path", "kombinatorik", "permutation", "subset",
    "backtrack", "memoize", "cache", "optimal", "minimum", "maximum",
    "longest", "increasing", "subsequence", "knapsack", "coin", "change",
    "adjacen", "component", "topolog", "sort", "merge", "heap", "priority",
    "linked", "list", "stack", "queue", "binary", "search",
])

_EASY_KEYWORDS = frozenset([
    "summa", "sum", "medel", "average", "max", "min", "print", "skriv",
    "läs", "read", "input", "output", "hello", "enkel", "simple",
    "addition", "subtraktion", "multiplikation", "division",
    "uppercase", "lowercase", "reverse", "length", "count",
])


@dataclass
class GutSignal:
    """En enskild signal som bidrar till magkänslan."""
    name: str
    value: float       # -1.0 till +1.0
    weight: float      # Hur mycket denna signal påverkar totalen
    source: str        # Vilken modul signalen kommer från
    detail: str = ""   # Kort förklaring


@dataclass
class GutFeelingResult:
    """Resultat från gut feeling-beräkningen."""
    valence: float          # -1.0 (dålig känsla) till +1.0 (bra känsla)
    confidence: float       # 0.0 till 1.0 — hur säker magkänslan är
    signals: list[GutSignal] = field(default_factory=list)
    recommendation: str = "neutral"  # "confident" / "cautious" / "uncertain"
    compute_time_ms: float = 0.0

    @property
    def emoji(self) -> str:
        """Visuell representation av magkänslan."""
        if self.valence > 0.5:
            return "😎"  # Stark positiv
        elif self.valence > 0.15:
            return "🙂"  # Svagt positiv
        elif self.valence > -0.15:
            return "😐"  # Neutral
        elif self.valence > -0.5:
            return "😟"  # Svagt negativ
        else:
            return "😰"  # Stark negativ

    def to_dict(self) -> dict:
        """Serialisera för JSON/progress."""
        return {
            "valence": round(self.valence, 3),
            "confidence": round(self.confidence, 3),
            "recommendation": self.recommendation,
            "emoji": self.emoji,
            "signals": {s.name: round(s.value, 3) for s in self.signals},
            "compute_time_ms": round(self.compute_time_ms, 2),
        }


class GutFeelingEngine:
    """Motor som beräknar magkänsla baserat på multipla signaler.
    
    Håller intern historik för momentum-beräkning och kalibrerar
    sig själv baserat på hur väl magkänslan förutsäger utfall.
    
    Args:
        history_window: Antal senaste resultat för momentum
        calibration_rate: Hur snabbt vikterna justeras (0-1)
    """

    def __init__(self, history_window: int = 20, calibration_rate: float = 0.05):
        self._history_window = history_window
        self._calibration_rate = calibration_rate

        # Resultathistorik: (score, difficulty, category, timestamp)
        self._results: deque[dict] = deque(maxlen=history_window * 5)

        # Per-kategori track record: category → {solved, attempted}
        self._category_record: dict[str, dict[str, int]] = {}

        # Per-svårighetsgrad track record
        self._difficulty_record: dict[int, dict[str, int]] = {}

        # Kalibrering: hur väl förutsäger gut feeling utfallet?
        # (gut_valence, actual_score) par för att justera vikter
        self._calibration_data: deque[tuple[float, float]] = deque(maxlen=100)

        # Signal-vikter (justeras via kalibrering)
        self._weights = {
            "familiarity": 0.20,
            "track_record": 0.25,
            "momentum": 0.15,
            "complexity": 0.15,
            "memory_strength": 0.15,
            "energy": 0.10,
        }

        # Statistik
        self.total_predictions = 0
        self.correct_predictions = 0  # gut > 0 och score >= 1, eller gut < 0 och score < 1

    # === Signal-beräkningar ===

    def _signal_familiarity(
        self, hdc_confidence: float, is_new: bool
    ) -> GutSignal:
        """HDC-baserad familiaritet: hur väl matchar uppgiften kända mönster?"""
        if is_new:
            value = -0.3  # Nytt mönster → lite osäker
            detail = "nytt mönster"
        elif hdc_confidence > 0.85:
            value = 0.8  # Mycket bekant
            detail = f"starkt igenkänt ({hdc_confidence:.2f})"
        elif hdc_confidence > 0.7:
            value = 0.4  # Bekant
            detail = f"igenkänt ({hdc_confidence:.2f})"
        else:
            value = -0.1  # Svag matchning
            detail = f"svag matchning ({hdc_confidence:.2f})"

        return GutSignal(
            name="familiarity",
            value=value,
            weight=self._weights["familiarity"],
            source="HDC",
            detail=detail,
        )

    def _signal_track_record(
        self, category: str, difficulty: int
    ) -> GutSignal:
        """Historisk framgång för denna kategori och svårighetsgrad."""
        cat_rec = self._category_record.get(category, {})
        cat_attempted = cat_rec.get("attempted", 0)
        cat_solved = cat_rec.get("solved", 0)

        diff_rec = self._difficulty_record.get(difficulty, {})
        diff_attempted = diff_rec.get("attempted", 0)
        diff_solved = diff_rec.get("solved", 0)

        # Beräkna rates med Bayesiansk smoothing (beta prior)
        cat_rate = (cat_solved + 1) / (cat_attempted + 2) if cat_attempted > 0 else 0.5
        diff_rate = (diff_solved + 1) / (diff_attempted + 2) if diff_attempted > 0 else 0.5

        # Vikta: kategori 60%, svårighet 40%
        combined_rate = 0.6 * cat_rate + 0.4 * diff_rate

        # Mappa till -1..+1 (0.5 → 0, 1.0 → +1, 0.0 → -1)
        value = (combined_rate - 0.5) * 2.0

        detail_parts = []
        if cat_attempted > 0:
            detail_parts.append(f"{category}: {cat_solved}/{cat_attempted}")
        if diff_attempted > 0:
            detail_parts.append(f"nv{difficulty}: {diff_solved}/{diff_attempted}")

        return GutSignal(
            name="track_record",
            value=value,
            weight=self._weights["track_record"],
            source="History",
            detail=", ".join(detail_parts) if detail_parts else "ingen historik",
        )

    def _signal_momentum(self) -> GutSignal:
        """Senaste resultatens trend — winning streak eller slump?"""
        if len(self._results) < 3:
            return GutSignal(
                name="momentum", value=0.0,
                weight=self._weights["momentum"],
                source="Momentum", detail="för lite data",
            )

        # Senaste N resultat
        recent = list(self._results)[-self._history_window:]
        scores = [r["score"] for r in recent]

        # Exponentiellt viktat medelvärde (nyare = viktigare)
        weights = [math.exp(i * 0.15) for i in range(len(scores))]
        total_w = sum(weights)
        ewma = sum(s * w for s, w in zip(scores, weights)) / total_w

        # Streak-bonus: konsekutiva lyckade/misslyckade
        streak = 0
        for s in reversed(scores):
            if s >= 1.0:
                streak += 1
            else:
                break
        if streak == 0:
            for s in reversed(scores):
                if s < 1.0:
                    streak -= 1
                else:
                    break

        # Mappa EWMA (0-1) till valence (-1 till +1), med streak-boost
        value = (ewma - 0.5) * 2.0
        streak_boost = min(0.3, streak * 0.06) if streak > 0 else max(-0.3, streak * 0.08)
        value = max(-1.0, min(1.0, value + streak_boost))

        detail = f"ewma={ewma:.2f}"
        if streak > 2:
            detail += f", 🔥{streak} streak"
        elif streak < -2:
            detail += f", ❄️{abs(streak)} miss"

        return GutSignal(
            name="momentum", value=value,
            weight=self._weights["momentum"],
            source="Momentum", detail=detail,
        )

    def _signal_complexity(
        self, title: str, description: str, difficulty: int, tags: list[str]
    ) -> GutSignal:
        """Textbaserad komplexitetsanalys av uppgiften."""
        text = f"{title} {description}".lower()
        all_words = set(text.split()) | set(t.lower() for t in tags)

        # Räkna hårda vs lätta nyckelord
        hard_count = len(all_words & _HARD_KEYWORDS)
        easy_count = len(all_words & _EASY_KEYWORDS)

        # Textlängd som proxy för komplexitet
        text_len = len(description)
        len_factor = 0.0
        if text_len > 300:
            len_factor = -0.2  # Lång beskrivning → svårare
        elif text_len < 80:
            len_factor = 0.1   # Kort → enklare

        # Svårighetsgrad-faktor
        diff_factor = (5 - difficulty) * 0.12  # nv1=+0.48, nv5=0, nv8=-0.36

        # Kombinera
        keyword_factor = (easy_count - hard_count) * 0.15
        value = max(-1.0, min(1.0, keyword_factor + len_factor + diff_factor))

        detail = f"hard={hard_count}, easy={easy_count}, len={text_len}, nv{difficulty}"

        return GutSignal(
            name="complexity", value=value,
            weight=self._weights["complexity"],
            source="TextAnalysis", detail=detail,
        )

    def _signal_memory_strength(
        self, memory_results: list[dict] | None
    ) -> GutSignal:
        """Ebbinghaus-minnesstyrka: finns starka minnen av liknande problem?"""
        if not memory_results:
            return GutSignal(
                name="memory_strength", value=-0.2,
                weight=self._weights["memory_strength"],
                source="Ebbinghaus", detail="inga minnen",
            )

        # Bästa retention bland matchande minnen
        best_retention = max(r.get("retention", 0) for r in memory_results)
        avg_retention = sum(r.get("retention", 0) for r in memory_results) / len(memory_results)

        # Kolla om minnena var framgångsrika
        successful = sum(1 for r in memory_results if r.get("metadata", {}).get("score", 0) >= 1.0)
        success_ratio = successful / len(memory_results)

        # Kombinera retention och framgång
        value = (best_retention * 0.4 + avg_retention * 0.2 + success_ratio * 0.4) * 2.0 - 1.0
        value = max(-1.0, min(1.0, value))

        detail = f"{len(memory_results)} minnen, best_ret={best_retention:.2f}, success={successful}/{len(memory_results)}"

        return GutSignal(
            name="memory_strength", value=value,
            weight=self._weights["memory_strength"],
            source="Ebbinghaus", detail=detail,
        )

    def _signal_energy(
        self, aif_surprise: float, exploration_weight: float
    ) -> GutSignal:
        """AIF-baserad energi: överraskning och osäkerhet."""
        # Hög surprise → dålig känsla (oförutsägbart)
        # Hög exploration → osäker (fortfarande lärande)
        surprise_factor = -min(1.0, aif_surprise / 3.0)  # Normalisera surprise
        exploration_factor = -(exploration_weight - 0.3)  # 0.3 = neutral, >0.3 = osäker

        value = max(-1.0, min(1.0, surprise_factor * 0.6 + exploration_factor * 0.4))

        detail = f"surprise={aif_surprise:.2f}, explore={exploration_weight:.2f}"

        return GutSignal(
            name="energy", value=value,
            weight=self._weights["energy"],
            source="ActiveInference", detail=detail,
        )

    # === Huvudberäkning ===

    def feel(
        self,
        # HDC
        hdc_confidence: float = 0.0,
        is_new_pattern: bool = True,
        # Task
        category: str = "",
        difficulty: int = 5,
        title: str = "",
        description: str = "",
        tags: list[str] | None = None,
        # Ebbinghaus
        memory_results: list[dict] | None = None,
        # AIF
        aif_surprise: float = 0.0,
        exploration_weight: float = 0.5,
    ) -> GutFeelingResult:
        """Beräkna magkänsla baserat på alla tillgängliga signaler.
        
        Snabb operation — ingen LLM, ingen I/O. Bara matematik.
        """
        t_start = time.perf_counter()

        signals = [
            self._signal_familiarity(hdc_confidence, is_new_pattern),
            self._signal_track_record(category, difficulty),
            self._signal_momentum(),
            self._signal_complexity(title, description, difficulty, tags or []),
            self._signal_memory_strength(memory_results),
            self._signal_energy(aif_surprise, exploration_weight),
        ]

        # Viktat medelvärde
        total_weight = sum(s.weight for s in signals)
        if total_weight > 0:
            valence = sum(s.value * s.weight for s in signals) / total_weight
        else:
            valence = 0.0

        valence = max(-1.0, min(1.0, valence))

        # Confidence: hur eniga är signalerna?
        # Hög enighet → hög confidence, spridda signaler → låg
        if len(signals) > 1:
            mean_val = sum(s.value for s in signals) / len(signals)
            variance = sum((s.value - mean_val) ** 2 for s in signals) / len(signals)
            # Låg varians → hög confidence
            confidence = max(0.1, min(1.0, 1.0 - math.sqrt(variance)))
        else:
            confidence = 0.5

        # Rekommendation
        if valence > 0.25 and confidence > 0.4:
            recommendation = "confident"
        elif valence < -0.25 and confidence > 0.4:
            recommendation = "cautious"
        else:
            recommendation = "uncertain"

        compute_ms = (time.perf_counter() - t_start) * 1000

        return GutFeelingResult(
            valence=valence,
            confidence=confidence,
            signals=signals,
            recommendation=recommendation,
            compute_time_ms=compute_ms,
        )

    # === Feedback & Kalibrering ===

    def record_outcome(
        self, score: float, category: str, difficulty: int,
        gut_valence: float = 0.0,
    ) -> None:
        """Registrera utfallet av en uppgift för framtida förutsägelser."""
        self._results.append({
            "score": score,
            "difficulty": difficulty,
            "category": category,
            "timestamp": time.time(),
        })

        # Uppdatera track records
        if category not in self._category_record:
            self._category_record[category] = {"attempted": 0, "solved": 0}
        self._category_record[category]["attempted"] += 1
        if score >= 1.0:
            self._category_record[category]["solved"] += 1

        if difficulty not in self._difficulty_record:
            self._difficulty_record[difficulty] = {"attempted": 0, "solved": 0}
        self._difficulty_record[difficulty]["attempted"] += 1
        if score >= 1.0:
            self._difficulty_record[difficulty]["solved"] += 1

        # Kalibrering
        self._calibration_data.append((gut_valence, score))
        self.total_predictions += 1

        # Korrekt förutsägelse?
        gut_predicted_success = gut_valence > 0
        actual_success = score >= 1.0
        if gut_predicted_success == actual_success:
            self.correct_predictions += 1

        # Auto-justera vikter baserat på kalibrering
        self._calibrate()

    def _calibrate(self) -> None:
        """Justera signal-vikter baserat på förutsägelsenoggrannhet.
        
        Enkel approach: om accuracy sjunker, öka vikten på
        de signaler som var mest korrekta nyligen.
        """
        if len(self._calibration_data) < 20:
            return

        # Beräkna accuracy över senaste 20
        recent = list(self._calibration_data)[-20:]
        correct = sum(
            1 for gut, score in recent
            if (gut > 0) == (score >= 1.0)
        )
        accuracy = correct / len(recent)

        # Om accuracy < 60%, öka exploration-vikten (mer osäker)
        if accuracy < 0.6:
            self._weights["energy"] = min(0.25, self._weights["energy"] + self._calibration_rate * 0.5)
            self._weights["track_record"] = max(0.10, self._weights["track_record"] - self._calibration_rate * 0.3)

        # Om accuracy > 80%, lita mer på track record
        elif accuracy > 0.8:
            self._weights["track_record"] = min(0.35, self._weights["track_record"] + self._calibration_rate * 0.3)

        # Normalisera vikter
        total = sum(self._weights.values())
        if total > 0:
            for k in self._weights:
                self._weights[k] /= total

    # === Stats ===

    def get_stats(self) -> dict:
        """Returnera statistik om gut feeling-systemet."""
        accuracy = (
            self.correct_predictions / max(self.total_predictions, 1)
        )
        return {
            "total_predictions": self.total_predictions,
            "accuracy": round(accuracy, 3),
            "weights": {k: round(v, 3) for k, v in self._weights.items()},
            "category_records": {
                k: f"{v['solved']}/{v['attempted']}"
                for k, v in sorted(self._category_record.items())
            },
            "difficulty_records": {
                k: f"{v['solved']}/{v['attempted']}"
                for k, v in sorted(self._difficulty_record.items())
            },
            "history_size": len(self._results),
            "calibration_size": len(self._calibration_data),
        }
