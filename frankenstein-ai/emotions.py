"""
Ekman Emotion Engine — Grundläggande emotioner för Frankenstein AI

Implementerar Paul Ekmans 6 universella grundemotioner som ett persistent
emotionellt tillstånd som påverkar AI:ns beteende över tid:

  JOY (Glädje)      — Framgång, lösta uppgifter, streaks
  SADNESS (Sorg)     — Upprepade misslyckanden, regression
  ANGER (Ilska)      — Frustration: nära men inte löst, timeout, samma fel
  FEAR (Rädsla)      — Okänt territorium, hög svårighet, nya mönster
  DISGUST (Avsky)    — Dålig kodkvalitet, syntax errors, slarv
  SURPRISE (Förvåning) — Oväntat resultat (positivt eller negativt)

Varje emotion har:
  - intensity: 0.0-1.0 (styrka just nu)
  - decay_rate: hur snabbt den avtar per steg
  - triggers: vad som aktiverar den

Emotionerna påverkar:
  - Strategi: Ilska → mer aggressiv, Rädsla → mer försiktig
  - Temperature: Glädje → lägre (fokuserad), Sorg → högre (kreativ)
  - Exploration: Förvåning → mer utforskande
  - Persistence: Ilska → fler retries, Rädsla → färre

Inspirerat av:
  - Ekman (1992): Basic Emotions
  - Ortony, Clore & Collins (1988): OCC-modellen
  - Picard (1997): Affective Computing
"""

import math
import time
from dataclasses import dataclass, field
from collections import deque
from typing import Optional


# === Ekman's 6 Basic Emotions ===

EMOTIONS = ("joy", "sadness", "anger", "fear", "disgust", "surprise")

# Emoji-representation per emotion
EMOTION_EMOJI = {
    "joy": "😊",
    "sadness": "😢",
    "anger": "😠",
    "fear": "😨",
    "disgust": "🤢",
    "surprise": "😲",
}

# Svenska namn
EMOTION_NAMES_SV = {
    "joy": "Glädje",
    "sadness": "Sorg",
    "anger": "Ilska",
    "fear": "Rädsla",
    "disgust": "Avsky",
    "surprise": "Förvåning",
}


@dataclass
class EmotionState:
    """Aktuellt emotionellt tillstånd — alla 6 emotioner samtidigt."""
    joy: float = 0.0
    sadness: float = 0.0
    anger: float = 0.0
    fear: float = 0.0
    disgust: float = 0.0
    surprise: float = 0.0

    def dominant(self) -> tuple[str, float]:
        """Returnera den starkaste emotionen och dess intensitet."""
        vals = {
            "joy": self.joy, "sadness": self.sadness,
            "anger": self.anger, "fear": self.fear,
            "disgust": self.disgust, "surprise": self.surprise,
        }
        best = max(vals, key=vals.get)  # type: ignore[arg-type]
        return best, vals[best]

    def as_dict(self) -> dict[str, float]:
        """Alla emotioner som dict."""
        return {
            "joy": round(self.joy, 3),
            "sadness": round(self.sadness, 3),
            "anger": round(self.anger, 3),
            "fear": round(self.fear, 3),
            "disgust": round(self.disgust, 3),
            "surprise": round(self.surprise, 3),
        }

    @property
    def emoji(self) -> str:
        name, intensity = self.dominant()
        if intensity < 0.1:
            return "😐"  # Neutral
        return EMOTION_EMOJI.get(name, "😐")

    @property
    def valence(self) -> float:
        """Övergripande positiv/negativ känsla (-1 till +1)."""
        positive = self.joy + self.surprise * 0.3
        negative = self.sadness + self.anger + self.fear + self.disgust * 0.5
        total = positive + negative
        if total == 0:
            return 0.0
        return max(-1.0, min(1.0, (positive - negative) / max(total, 0.01)))

    @property
    def arousal(self) -> float:
        """Aktiveringsgrad (0=lugn, 1=upprörd). Anger/Fear/Surprise = hög arousal."""
        high_arousal = self.anger + self.fear + self.surprise + self.joy * 0.5
        low_arousal = self.sadness + self.disgust * 0.3
        return max(0.0, min(1.0, (high_arousal - low_arousal * 0.3)))


@dataclass
class EmotionEvent:
    """En händelse som påverkade emotionellt tillstånd."""
    timestamp: float
    trigger: str
    emotion: str
    delta: float
    detail: str = ""


class EkmanEmotionEngine:
    """Motor som beräknar och uppdaterar emotionellt tillstånd.

    Emotioner:
    - Triggas av träningsresultat, mönsterigenkänning, fel-typer
    - Avtar exponentiellt över tid (decay)
    - Påverkar beteende via get_behavioral_modifiers()
    - Kalibrerar sig baserat på om emotionella reaktioner leder till bättre resultat

    Args:
        decay_rate: Bas-decay per steg (0-1). Lägre = längre emotionellt minne.
        reactivity: Hur starkt emotioner triggas (0-1). Högre = mer emotionell.
        history_size: Max antal events att spara.
    """

    # Decay-rates per emotion (vissa varar längre)
    _DECAY_RATES = {
        "joy": 0.15,       # Glädje avtar måttligt
        "sadness": 0.08,   # Sorg varar länge
        "anger": 0.20,     # Ilska avtar snabbt
        "fear": 0.12,      # Rädsla varar medellänge
        "disgust": 0.18,   # Avsky avtar snabbt
        "surprise": 0.30,  # Förvåning avtar snabbast
    }

    def __init__(
        self,
        decay_rate: float = 1.0,
        reactivity: float = 0.7,
        history_size: int = 200,
    ):
        self._decay_multiplier = decay_rate
        self._reactivity = reactivity

        # Aktuellt tillstånd
        self.state = EmotionState()

        # Historik
        self._events: deque[EmotionEvent] = deque(maxlen=history_size)

        # Beteende-effektivitet: spårar om emotionella modifieringar hjälper
        self._modifier_outcomes: deque[tuple[str, bool]] = deque(maxlen=100)

        # Statistik
        self.total_updates = 0
        self._emotion_totals: dict[str, float] = {e: 0.0 for e in EMOTIONS}

    # === Decay ===

    def _decay(self) -> None:
        """Applicera exponentiell decay på alla emotioner."""
        for emotion in EMOTIONS:
            current = getattr(self.state, emotion)
            if current > 0.001:
                rate = self._DECAY_RATES[emotion] * self._decay_multiplier
                new_val = current * (1.0 - rate)
                setattr(self.state, emotion, max(0.0, new_val))
            else:
                setattr(self.state, emotion, 0.0)

    def _activate(self, emotion: str, intensity: float, trigger: str, detail: str = "") -> None:
        """Aktivera en emotion med given intensitet."""
        scaled = intensity * self._reactivity
        current = getattr(self.state, emotion)
        # Additiv med mjuk cap (sigmoid-liknande)
        new_val = current + scaled * (1.0 - current * 0.5)
        new_val = max(0.0, min(1.0, new_val))
        setattr(self.state, emotion, new_val)

        self._emotion_totals[emotion] += abs(scaled)
        self._events.append(EmotionEvent(
            timestamp=time.time(),
            trigger=trigger,
            emotion=emotion,
            delta=scaled,
            detail=detail,
        ))

    # === Triggers: Träningsresultat → Emotioner ===

    def process_result(
        self,
        score: float,
        difficulty: int,
        attempts_used: int,
        max_attempts: int,
        is_new_pattern: bool,
        error_type: str = "",
        was_timeout: bool = False,
        previous_score: float = -1.0,
        streak: int = 0,
    ) -> EmotionState:
        """Uppdatera emotioner baserat på ett träningsresultat.

        Args:
            score: 0.0-1.0 (1.0 = löst)
            difficulty: 1-10
            attempts_used: Antal försök som användes
            max_attempts: Max tillåtna försök
            is_new_pattern: Om HDC klassificerade uppgiften som ny
            error_type: "syntax", "logic", "timeout", "runtime" eller ""
            was_timeout: Om lösningen timade ut
            previous_score: Score från förra uppgiften (-1 om ingen)
            streak: Nuvarande streak (positiv=wins, negativ=losses)
        """
        self.total_updates += 1

        # 1. Decay befintliga emotioner först
        self._decay()

        solved = score >= 1.0
        partial = 0.0 < score < 1.0
        diff_factor = difficulty / 10.0  # 0.1-1.0

        # === JOY: Framgång ===
        if solved:
            # Mer glädje för svårare uppgifter och färre försök
            joy_intensity = 0.3 + diff_factor * 0.4
            if attempts_used == 1:
                joy_intensity += 0.2  # First-try bonus
            if streak > 2:
                joy_intensity += min(0.2, streak * 0.04)  # Streak bonus
            self._activate("joy", joy_intensity, "solved",
                           f"nv{difficulty}, {attempts_used} försök, streak={streak}")

            # Glädje minskar sorg och rädsla
            self.state.sadness *= 0.6
            self.state.fear *= 0.7

        # === SADNESS: Misslyckande ===
        if not solved:
            sad_intensity = 0.2 + diff_factor * 0.15
            if attempts_used >= max_attempts:
                sad_intensity += 0.2  # Alla försök slut
            if streak < -2:
                sad_intensity += min(0.25, abs(streak) * 0.05)  # Losing streak
            if previous_score >= 1.0 and not solved:
                sad_intensity += 0.15  # Regression — löste förra men inte denna
            self._activate("sadness", sad_intensity, "failed",
                           f"nv{difficulty}, score={score:.0%}, streak={streak}")

        # === ANGER: Frustration ===
        if partial and score >= 0.5:
            # Nära men inte löst — frustrerande
            anger_intensity = 0.3 + (score - 0.5) * 0.6  # Ju närmare, desto mer frustrerande
            self._activate("anger", anger_intensity, "almost_solved",
                           f"score={score:.0%} — nära!")
        if was_timeout:
            self._activate("anger", 0.4, "timeout", "lösningen timade ut")
        if error_type == "logic" and attempts_used > 1:
            # Samma typ av fel igen
            self._activate("anger", 0.25, "repeated_error",
                           f"logikfel efter {attempts_used} försök")

        # === FEAR: Okänt/svårt ===
        if is_new_pattern:
            fear_intensity = 0.15 + diff_factor * 0.3
            self._activate("fear", fear_intensity, "new_pattern",
                           f"okänt mönster, nv{difficulty}")
        if difficulty >= 8:
            fear_intensity = (difficulty - 7) * 0.12
            self._activate("fear", fear_intensity, "high_difficulty",
                           f"nv{difficulty}")

        # === DISGUST: Dålig kodkvalitet ===
        if error_type == "syntax":
            self._activate("disgust", 0.4, "syntax_error", "syntaxfel i genererad kod")
        if error_type == "runtime":
            self._activate("disgust", 0.25, "runtime_error", "runtime-krasch")
        if score == 0.0 and attempts_used >= 2:
            self._activate("disgust", 0.3, "zero_score",
                           f"0% efter {attempts_used} försök")

        # === SURPRISE: Oväntat resultat ===
        if previous_score >= 0:
            score_diff = abs(score - previous_score)
            if score_diff > 0.5:
                surprise_intensity = score_diff * 0.7
                direction = "positivt" if score > previous_score else "negativt"
                self._activate("surprise", surprise_intensity, f"unexpected_{direction}",
                               f"score {previous_score:.0%}→{score:.0%}")
        if solved and is_new_pattern and difficulty >= 7:
            self._activate("surprise", 0.4, "solved_novel",
                           f"löste nytt svårt problem (nv{difficulty})")

        return self.state

    # === Beteendepåverkan ===

    def get_behavioral_modifiers(self) -> dict:
        """Returnera modifieringar baserat på aktuellt emotionellt tillstånd.

        Returns:
            dict med:
                temperature_mod: Justering av LLM-temperatur (-0.15 till +0.15)
                extra_attempts: Antal extra försök (0-2)
                strategy_preference: Föredragen strategi eller None
                exploration_mod: Justering av AIF exploration (-0.1 till +0.1)
                persistence_mod: Multiplikator för uthållighet (0.7-1.3)
                prompt_tone: Tonalitet att injicera i prompten
        """
        s = self.state
        dom_emotion, dom_intensity = s.dominant()

        # Defaults
        temp_mod = 0.0
        extra_attempts = 0
        strategy_pref: Optional[str] = None
        exploration_mod = 0.0
        persistence_mod = 1.0
        prompt_tone = ""

        # JOY: Fokuserad, effektiv
        if s.joy > 0.3:
            temp_mod -= 0.05 * s.joy       # Lägre temp = mer fokuserad
            persistence_mod += 0.1 * s.joy  # Mer uthållig
            if s.joy > 0.6:
                prompt_tone = "Du är i flow — skriv ren, effektiv kod."

        # SADNESS: Mer kreativ, försiktigare
        if s.sadness > 0.3:
            temp_mod += 0.08 * s.sadness    # Högre temp = mer kreativ/divergent
            exploration_mod += 0.05 * s.sadness
            if s.sadness > 0.5:
                strategy_pref = "with_hints"
                prompt_tone = "Tänk noga och steg-för-steg. Var extra noggrann."

        # ANGER: Aggressiv, fler retries
        if s.anger > 0.3:
            extra_attempts += 1 if s.anger > 0.5 else 0
            persistence_mod += 0.2 * s.anger
            temp_mod += 0.05 * s.anger  # Lite mer kreativ under frustration
            if s.anger > 0.6:
                strategy_pref = "fix_errors"
                prompt_tone = "Analysera felet noggrant. Var systematisk och lös grundorsaken."

        # FEAR: Försiktig, mer hints
        if s.fear > 0.3:
            strategy_pref = "with_hints"
            exploration_mod -= 0.05 * s.fear  # Mindre utforskande
            temp_mod -= 0.03 * s.fear         # Mer konservativ
            if s.fear > 0.6:
                extra_attempts += 1
                prompt_tone = "Börja med en enkel approach. Bryt ner problemet i delar."

        # DISGUST: Fokus på kodkvalitet
        if s.disgust > 0.3:
            temp_mod -= 0.08 * s.disgust  # Mycket fokuserad — undvik slarv
            if s.disgust > 0.5:
                prompt_tone = "Skriv korrekt, ren Python. Dubbelkolla syntax och edge cases."

        # SURPRISE: Utforskande
        if s.surprise > 0.3:
            exploration_mod += 0.1 * s.surprise
            temp_mod += 0.05 * s.surprise
            if s.surprise > 0.5:
                prompt_tone = "Överraskande resultat — prova en helt annan approach."

        # Clamp
        temp_mod = max(-0.15, min(0.15, temp_mod))
        exploration_mod = max(-0.1, min(0.1, exploration_mod))
        persistence_mod = max(0.7, min(1.3, persistence_mod))
        extra_attempts = min(extra_attempts, 2)

        return {
            "temperature_mod": round(temp_mod, 3),
            "extra_attempts": extra_attempts,
            "strategy_preference": strategy_pref,
            "exploration_mod": round(exploration_mod, 3),
            "persistence_mod": round(persistence_mod, 2),
            "prompt_tone": prompt_tone,
            "dominant_emotion": dom_emotion,
            "dominant_intensity": round(dom_intensity, 3),
            "valence": round(s.valence, 3),
            "arousal": round(s.arousal, 3),
        }

    # === Stats ===

    def get_stats(self) -> dict:
        """Returnera full emotionsstatistik."""
        dom_emotion, dom_intensity = self.state.dominant()
        recent_events = list(self._events)[-10:]

        return {
            "state": self.state.as_dict(),
            "dominant": dom_emotion,
            "dominant_intensity": round(dom_intensity, 3),
            "emoji": self.state.emoji,
            "valence": round(self.state.valence, 3),
            "arousal": round(self.state.arousal, 3),
            "total_updates": self.total_updates,
            "emotion_totals": {k: round(v, 2) for k, v in self._emotion_totals.items()},
            "recent_events": [
                {
                    "trigger": e.trigger,
                    "emotion": e.emotion,
                    "delta": round(e.delta, 3),
                    "detail": e.detail,
                }
                for e in recent_events
            ],
            "behavioral_modifiers": self.get_behavioral_modifiers(),
        }

    def get_mood_summary(self) -> str:
        """Kort textsammanfattning av humöret."""
        dom, intensity = self.state.dominant()
        if intensity < 0.1:
            return "neutral — balanserat tillstånd"

        mood_descriptions = {
            "joy": [
                (0.7, "euforisk — i absolut flow"),
                (0.4, "glad — motiverad och fokuserad"),
                (0.0, "nöjd — saker går bra"),
            ],
            "sadness": [
                (0.7, "nedstämd — upprepade misslyckanden tynger"),
                (0.4, "ledsen — har det svårt just nu"),
                (0.0, "lite dämpad — senaste resultaten var inte bra"),
            ],
            "anger": [
                (0.7, "frustrerad — nära lösningar som glider undan"),
                (0.4, "irriterad — fel som borde fixas"),
                (0.0, "lite otålig — vill komma vidare"),
            ],
            "fear": [
                (0.7, "orolig — okänt och svårt territorium"),
                (0.4, "nervös — osäker på approach"),
                (0.0, "lite osäker — nytt mönster"),
            ],
            "disgust": [
                (0.7, "äcklad — dålig kodkvalitet"),
                (0.4, "missnöjd — för många slarv-fel"),
                (0.0, "lite irriterad — syntax-problem"),
            ],
            "surprise": [
                (0.7, "chockad — helt oväntat resultat"),
                (0.4, "förvånad — det gick inte som väntat"),
                (0.0, "lite överraskad — intressant vändning"),
            ],
        }

        for threshold, desc in mood_descriptions.get(dom, []):
            if intensity >= threshold:
                return f"{EMOTION_EMOJI[dom]} {desc}"

        return f"{EMOTION_EMOJI[dom]} {EMOTION_NAMES_SV[dom].lower()}"
