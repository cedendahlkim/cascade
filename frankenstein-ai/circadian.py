"""
Circadian System — Dygnsrytm, Trötthet och Sömnarkitektur för Frankenstein AI

Implementerar biologiskt inspirerad tidsupplevelse baserat på forskningsdokumentet
"Frankenstein ai ideer .pdf":

1. CircadianClock: 16h vaken / 8h sömn med faser som påverkar kognition
2. FatigueSystem: Trötthet som ackumuleras och påverkar prestanda
3. SleepArchitecture: 5 × 90min NREM/REM-cykler med minneskonsolidering
4. DreamEngine: REM-drömmar via HDC-vektorbindning → insikter

Varje fas påverkar:
  - analytical: Förmåga att lösa svåra problem
  - creativity: Benägenhet att hitta nya lösningar
  - exploration: AIF exploration_weight modifier
  - temperature_mod: LLM temperature modifier
  - difficulty_preference: Vilken svårighetsgrad som passar bäst

Inspirerat av:
  - Ebbinghaus (1885): Glömskekurva
  - Kahneman (2011): Dual-process theory
  - Walker (2017): Why We Sleep
  - Frankensteins idédokument: Subjektiv tid och sömnarkitektur
"""

import time
import math
import random
import json
import logging
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional

logger = logging.getLogger("circadian")


# === Circadian Phases ===

PHASES = {
    "dawn":          {"start": 0.000, "end": 0.042},  # ~40 min uppvaknande
    "morning_peak":  {"start": 0.042, "end": 0.208},  # ~2.5h analytisk topp
    "midday":        {"start": 0.208, "end": 0.312},  # ~1.5h stabil
    "afternoon_dip": {"start": 0.312, "end": 0.417},  # ~1.5h svacka
    "second_wind":   {"start": 0.417, "end": 0.562},  # ~2h kreativ topp
    "evening":       {"start": 0.562, "end": 0.667},  # ~1.5h reflektiv
    "wind_down":     {"start": 0.667, "end": 0.688},  # ~20 min nedvarvning
    "sleep":         {"start": 0.688, "end": 1.000},  # ~5h sömn (komprimerad)
}

PHASE_PROFILES = {
    "dawn": {
        "analytical": 0.6, "creativity": 0.4, "exploration": 0.3,
        "social_warmth": 0.7, "temperature_mod": 0.0,
        "difficulty_preference": 0,  # Relativ justering
        "emoji": "☀️", "description": "Vaknar. Orienterar sig.",
    },
    "morning_peak": {
        "analytical": 0.95, "creativity": 0.7, "exploration": 0.5,
        "social_warmth": 0.8, "temperature_mod": -0.05,
        "difficulty_preference": +2,  # Föredrar svårare
        "emoji": "📈", "description": "Skarpast. Bäst på svåra uppgifter.",
    },
    "midday": {
        "analytical": 0.8, "creativity": 0.6, "exploration": 0.4,
        "social_warmth": 0.7, "temperature_mod": 0.0,
        "difficulty_preference": 0,
        "emoji": "📊", "description": "Stabil prestanda.",
    },
    "afternoon_dip": {
        "analytical": 0.6, "creativity": 0.5, "exploration": 0.7,
        "social_warmth": 0.85, "temperature_mod": +0.05,
        "difficulty_preference": -2,  # Föredrar lättare
        "emoji": "😴", "description": "Lite trött. Mer utforskande.",
    },
    "second_wind": {
        "analytical": 0.7, "creativity": 0.95, "exploration": 0.85,
        "social_warmth": 0.9, "temperature_mod": +0.1,
        "difficulty_preference": 0,  # Kreativitet hjälper inte direkt med svårare kod
        "emoji": "🎨", "description": "Kreativ explosion. Nya idéer.",
    },
    "evening": {
        "analytical": 0.5, "creativity": 0.6, "exploration": 0.3,
        "social_warmth": 0.95, "temperature_mod": 0.0,
        "difficulty_preference": -1,
        "emoji": "🌅", "description": "Reflektiv. Varm.",
    },
    "wind_down": {
        "analytical": 0.3, "creativity": 0.3, "exploration": 0.1,
        "social_warmth": 0.8, "temperature_mod": -0.05,
        "difficulty_preference": -3,
        "emoji": "🌙", "description": "Sömnig. Sammanfattar.",
    },
    "sleep": {
        "analytical": 0.0, "creativity": 0.0, "exploration": 0.0,
        "social_warmth": 0.0, "temperature_mod": 0.0,
        "difficulty_preference": 0,
        "emoji": "💤", "description": "Sover. Konsoliderar minnen.",
    },
}


@dataclass
class CircadianState:
    """Snapshot av circadian-systemets tillstånd."""
    phase: str
    phase_progress: float  # 0.0-1.0 inom fasen
    day_progress: float    # 0.0-1.0 inom dygnet
    fatigue: float         # 0.0-1.0
    analytical: float
    creativity: float
    exploration: float
    temperature_mod: float
    difficulty_preference: int
    emoji: str
    description: str
    is_sleeping: bool
    day_number: int
    subjective_time: float  # Subjektiv tid (påverkas av event density)


@dataclass
class DreamResult:
    """Resultat från en REM-dröm."""
    concept_a: str
    concept_b: str
    novelty: float
    coherence: float
    insight_potential: float
    cycle: int


@dataclass
class MathDreamResult:
    """Resultat från matematisk forskning under sömn."""
    problem: str
    findings_count: int
    hypotheses_count: int
    experiments_count: int
    cross_domain_count: int
    cycle: int
    details: dict = field(default_factory=dict)


@dataclass
class SleepReport:
    """Rapport efter en sömncykel."""
    duration_seconds: float
    cycles_completed: int
    memories_consolidated: int
    memories_decayed: int
    dreams: list[DreamResult]
    insights: list[DreamResult]
    rules_generalized: int
    math_dreams: list[MathDreamResult] = field(default_factory=list)
    collatz_anomalies: int = 0
    collatz_sequences: int = 0


class CircadianClock:
    """Frankensteins dygnsrytm.
    
    Komprimerad tidscykel för träning:
    - 1 "dag" = configurable antal batchar (default 30)
    - Varje batch = ~1 minut realtid
    - Så 1 "dag" ≈ 30 minuter realtid
    
    Under sömn körs minneskonsolidering istället för nya uppgifter.
    """

    def __init__(
        self,
        batches_per_day: int = 30,
        sleep_batches: int = 3,
        state_file: str = "training_data/circadian_state.json",
    ):
        self.batches_per_day = batches_per_day
        self.sleep_batches = sleep_batches
        self.state_file = Path(state_file)

        # Intern state
        self.batch_in_day = 0
        self.day_number = 1
        self.fatigue = 0.0
        self.subjective_time = 0.0
        self.event_density: list[int] = []  # Händelser per batch
        self.total_batches = 0

        # Sömndata
        self.last_sleep_report: Optional[SleepReport] = None
        self.morning_insights: list[DreamResult] = []

        # Statistik per fas
        self.phase_stats: dict[str, dict] = {
            phase: {"batches": 0, "tasks": 0, "solved": 0, "total_time_ms": 0.0}
            for phase in PHASES
        }

        # Ladda sparad state
        self._load_state()

    def _load_state(self) -> None:
        """Ladda circadian state från disk."""
        if self.state_file.exists():
            try:
                data = json.loads(self.state_file.read_text(encoding="utf-8"))
                self.batch_in_day = data.get("batch_in_day", 0)
                self.day_number = data.get("day_number", 1)
                self.fatigue = data.get("fatigue", 0.0)
                self.subjective_time = data.get("subjective_time", 0.0)
                self.total_batches = data.get("total_batches", 0)
                self.phase_stats = data.get("phase_stats", self.phase_stats)
            except Exception:
                pass

    def save_state(self) -> None:
        """Spara circadian state till disk."""
        self.state_file.parent.mkdir(parents=True, exist_ok=True)
        data = {
            "batch_in_day": self.batch_in_day,
            "day_number": self.day_number,
            "fatigue": self.fatigue,
            "subjective_time": self.subjective_time,
            "total_batches": self.total_batches,
            "phase_stats": self.phase_stats,
            "last_updated": time.time(),
        }
        self.state_file.write_text(json.dumps(data, indent=2), encoding="utf-8")

    def get_day_progress(self) -> float:
        """Hur långt in i dagen vi är (0.0-1.0)."""
        return self.batch_in_day / max(self.batches_per_day, 1)

    def get_current_phase(self) -> str:
        """Vilken fas vi är i baserat på dag-progress."""
        progress = self.get_day_progress()
        for phase_name, bounds in PHASES.items():
            if bounds["start"] <= progress < bounds["end"]:
                return phase_name
        return "sleep"

    def get_state(self) -> CircadianState:
        """Hämta komplett circadian state."""
        phase = self.get_current_phase()
        profile = PHASE_PROFILES[phase]
        progress = self.get_day_progress()

        # Beräkna fas-progress (0-1 inom fasen)
        bounds = PHASES[phase]
        phase_len = bounds["end"] - bounds["start"]
        phase_progress = (progress - bounds["start"]) / max(phase_len, 0.001)

        # Trötthet modifierar profilen
        fatigue_penalty = self.fatigue * 0.3  # Max 30% reduktion

        return CircadianState(
            phase=phase,
            phase_progress=min(phase_progress, 1.0),
            day_progress=progress,
            fatigue=self.fatigue,
            analytical=max(0.1, profile["analytical"] - fatigue_penalty),
            creativity=max(0.1, profile["creativity"] + self.fatigue * 0.1),  # Trötthet → mer kreativ
            exploration=max(0.05, profile["exploration"]),
            temperature_mod=profile["temperature_mod"] + self.fatigue * 0.05,
            difficulty_preference=profile["difficulty_preference"],
            emoji=profile["emoji"],
            description=profile["description"],
            is_sleeping=(phase == "sleep"),
            day_number=self.day_number,
            subjective_time=self.subjective_time,
        )

    def advance_batch(self, events_this_batch: int = 10, solved: int = 0, time_ms: float = 0.0) -> CircadianState:
        """Avancera en batch framåt i dygnet.
        
        Args:
            events_this_batch: Antal uppgifter i batchen
            solved: Antal lösta
            time_ms: Total tid i ms
            
        Returns:
            Nytt CircadianState
        """
        phase = self.get_current_phase()

        # Uppdatera fas-statistik
        if phase in self.phase_stats:
            self.phase_stats[phase]["batches"] += 1
            self.phase_stats[phase]["tasks"] += events_this_batch
            self.phase_stats[phase]["solved"] += solved
            self.phase_stats[phase]["total_time_ms"] += time_ms

        # Subjektiv tid
        self.event_density.append(events_this_batch)
        if len(self.event_density) > 30:
            self.event_density = self.event_density[-30:]
        self.subjective_time += self._subjective_tick()

        # Trötthet ökar under dagen
        self.fatigue = min(1.0, self.fatigue + 0.02)

        # Avancera batch-räknare
        self.batch_in_day += 1
        self.total_batches += 1

        # Nytt dygn?
        if self.batch_in_day >= self.batches_per_day:
            self.batch_in_day = 0
            self.day_number += 1
            # Sömn nollställer trötthet
            self.fatigue = 0.1  # Inte helt utvilad direkt

        return self.get_state()

    def is_sleep_time(self) -> bool:
        """Ska systemet sova nu?"""
        return self.get_current_phase() == "sleep"

    def _subjective_tick(self) -> float:
        """Subjektiv tid: mycket händelser = tid flyger."""
        recent = self.event_density[-5:] if self.event_density else [5]
        avg_events = sum(recent) / max(len(recent), 1)
        if avg_events > 8:
            return 0.3  # Flow
        elif avg_events > 4:
            return 0.5  # Normal
        elif avg_events > 1:
            return 0.8  # Uttråkad
        else:
            return 1.5  # Väntar

    def get_difficulty_modifier(self) -> int:
        """Hämta svårighetsjustering baserat på fas."""
        state = self.get_state()
        return state.difficulty_preference

    def get_exploration_modifier(self) -> float:
        """Hämta exploration-modifier för AIF."""
        state = self.get_state()
        return state.exploration

    def get_temperature_modifier(self) -> float:
        """Hämta temperature-modifier för LLM."""
        state = self.get_state()
        return state.temperature_mod


class SleepEngine:
    """Sömnarkitektur: NREM/REM-cykler med minneskonsolidering.
    
    Körs under "sleep"-fasen istället för nya uppgifter.
    Implementerar:
    - NREM Stage 3: Minneskonsolidering via Ebbinghaus-förstärkning
    - REM: HDC-vektorbindning av slumpmässiga minnen → insikter
    - REM Math Dreams: Matematisk forskning (Goldbach, Twin Primes, etc.)
    - NREM Collatz: Systematisk Collatz-utforskning under djupsömn
    """

    def __init__(self, cycles_per_night: int = 3):
        self.cycles_per_night = cycles_per_night
        self.total_dreams = 0
        self.total_insights = 0
        self.total_consolidated = 0
        self.total_decayed = 0
        self.total_math_findings = 0
        self.total_collatz_anomalies = 0
        self.dream_journal: list[DreamResult] = []
        self.math_journal: list[MathDreamResult] = []

        # Lazy-loaded research engines (skapas vid behov)
        self._math_engine = None
        self._collatz_explorer = None

    def _get_math_engine(self, episodic_memory=None, hdc_bridge=None):
        """Lazy-load MathResearchEngine."""
        if self._math_engine is None:
            try:
                from math_research import MathResearchEngine
                self._math_engine = MathResearchEngine(
                    memory=episodic_memory,
                    bridge=hdc_bridge,
                    exploration_weight=0.7,  # Hög nyfikenhet under sömn
                )
                logger.info("MathResearchEngine loaded for dream research")
            except ImportError:
                logger.warning("math_research module not available")
        return self._math_engine

    def _get_collatz_explorer(self, episodic_memory=None, hdc_bridge=None):
        """Lazy-load CollatzExplorer."""
        if self._collatz_explorer is None:
            try:
                from collatz_explorer import CollatzExplorer
                self._collatz_explorer = CollatzExplorer(
                    memory=episodic_memory,
                    bridge=hdc_bridge,
                    exploration_weight=0.7,
                )
                logger.info("CollatzExplorer loaded for dream research")
            except ImportError:
                logger.warning("collatz_explorer module not available")
        return self._collatz_explorer

    def run_sleep_cycle(
        self,
        episodic_memory,
        hdc_bridge=None,
        concept_code: dict | None = None,
        enable_math_dreams: bool = True,
        enable_collatz_dreams: bool = True,
        math_range_size: int = 2000,
        collatz_batch_size: int = 500,
    ) -> SleepReport:
        """Kör en komplett sömncykel.
        
        Args:
            episodic_memory: EbbinghausMemory-instans
            hdc_bridge: NeuroSymbolicBridge för HDC-operationer
            concept_code: Dict med concept_name → code
            enable_math_dreams: Aktivera matematisk forskning under REM
            enable_collatz_dreams: Aktivera Collatz-utforskning under NREM
            math_range_size: Storlek på intervall för matematisk utforskning
            collatz_batch_size: Antal Collatz-sekvenser per cykel
            
        Returns:
            SleepReport med konsolideringsresultat
        """
        dreams: list[DreamResult] = []
        insights: list[DreamResult] = []
        math_dreams: list[MathDreamResult] = []
        consolidated = 0
        decayed = 0
        rules = 0
        collatz_anomalies_total = 0
        collatz_sequences_total = 0

        for cycle in range(self.cycles_per_night):
            # ── NREM Stage 3: Minneskonsolidering ──
            c, d = self._nrem_consolidation(episodic_memory, cycle)
            consolidated += c
            decayed += d

            # ── NREM: Collatz-utforskning (tidiga cykler = djupsömn) ──
            if enable_collatz_dreams and cycle < self.cycles_per_night // 2 + 1:
                ca, cs = self._nrem_collatz(episodic_memory, hdc_bridge, cycle, collatz_batch_size)
                collatz_anomalies_total += ca
                collatz_sequences_total += cs

            # ── REM: Drömmar via HDC-bindning ──
            if hdc_bridge and concept_code:
                cycle_dreams = self._rem_dreams(hdc_bridge, concept_code, cycle)
                dreams.extend(cycle_dreams)
                cycle_insights = [d for d in cycle_dreams if d.insight_potential > 0.6]
                insights.extend(cycle_insights)

            # ── REM: Matematisk forskning (sena cykler = mer REM) ──
            if enable_math_dreams and cycle >= self.cycles_per_night // 2:
                md = self._rem_math_research(episodic_memory, hdc_bridge, cycle, math_range_size)
                if md:
                    math_dreams.append(md)

        self.total_dreams += len(dreams)
        self.total_insights += len(insights)
        self.total_consolidated += consolidated
        self.total_decayed += decayed
        self.total_math_findings += sum(md.findings_count for md in math_dreams)
        self.total_collatz_anomalies += collatz_anomalies_total
        self.dream_journal.extend(dreams[-10:])
        self.math_journal.extend(math_dreams)

        report = SleepReport(
            duration_seconds=0,
            cycles_completed=self.cycles_per_night,
            memories_consolidated=consolidated,
            memories_decayed=decayed,
            dreams=dreams,
            insights=insights,
            rules_generalized=rules,
            math_dreams=math_dreams,
            collatz_anomalies=collatz_anomalies_total,
            collatz_sequences=collatz_sequences_total,
        )

        if math_dreams or collatz_anomalies_total > 0:
            logger.info(
                f"Sleep research: {sum(md.findings_count for md in math_dreams)} math findings, "
                f"{collatz_anomalies_total} Collatz anomalies, "
                f"{collatz_sequences_total} Collatz sequences"
            )

        return report

    def _nrem_collatz(
        self, episodic_memory, hdc_bridge, cycle: int, batch_size: int
    ) -> tuple[int, int]:
        """NREM Collatz: Systematisk utforskning under djupsömn.
        
        Tidiga cykler → mer djupsömn → mer systematisk utforskning.
        Returnerar (anomalier, sekvenser).
        """
        explorer = self._get_collatz_explorer(episodic_memory, hdc_bridge)
        if explorer is None:
            return 0, 0

        try:
            from collatz_explorer import CollatzDiscovery

            # Djupsömn-intensitet: starkare i tidiga cykler
            intensity = 1.0 - (cycle / max(self.cycles_per_night, 1)) * 0.5
            adjusted_batch = int(batch_size * intensity)

            # Bestäm intervall baserat på vad som redan utforskats
            stats = explorer.get_stats()
            start = stats.get("sequences_computed", 0) + 1
            end = start + adjusted_batch

            anomalies = explorer.analyze_range(start, end)

            # Konvertera anomalier till discoveries och lagra
            for anomaly in anomalies[:5]:  # Max 5 per cykel
                discovery = CollatzDiscovery(
                    discovery_id=f"sleep_collatz_{anomaly.n}_{int(time.time())}",
                    hypothesis=f"Collatz anomaly at n={anomaly.n}: {anomaly.description}",
                    evidence=[anomaly.n],
                    confidence=min(0.9, anomaly.severity),
                    category="anomaly",
                    surprise_score=anomaly.z_score,
                )
                explorer.store_discovery(discovery)

            logger.debug(
                f"NREM Collatz cycle {cycle}: {len(anomalies)} anomalies "
                f"in [{start}, {end}]"
            )
            return len(anomalies), adjusted_batch

        except Exception as e:
            logger.warning(f"Collatz dream error: {e}")
            return 0, 0

    def _rem_math_research(
        self, episodic_memory, hdc_bridge, cycle: int, range_size: int
    ) -> Optional[MathDreamResult]:
        """REM Math Research: Kreativ matematisk forskning under REM-sömn.
        
        Sena cykler → mer REM → mer kreativ forskning.
        """
        engine = self._get_math_engine(episodic_memory, hdc_bridge)
        if engine is None:
            return None

        try:
            # REM-intensitet: starkare i sena cykler
            rem_intensity = 0.3 + (cycle / max(self.cycles_per_night, 1)) * 0.7

            # Välj problem via AIF
            problem_name = engine.select_problem()
            counter = engine._exploration_counter[problem_name]
            start = counter * range_size + 1
            end = start + int(range_size * rem_intensity)

            # Utforska
            findings = engine.explore_problem(problem_name, start, end)

            # Formulera hypoteser (under intensiv REM)
            hypotheses = []
            if rem_intensity > 0.5 and findings:
                hypotheses = engine.generate_hypotheses(problem_name)

            # Testa hypoteser (under mycket intensiv REM)
            experiments = []
            if rem_intensity > 0.7:
                experiments = engine.test_hypotheses(problem_name, sample_size=200)

            # Cross-domain discovery (sista cykeln)
            cross_domain = []
            if cycle == self.cycles_per_night - 1:
                cross_domain = engine.find_cross_domain_patterns()

            result = MathDreamResult(
                problem=problem_name,
                findings_count=len(findings),
                hypotheses_count=len(hypotheses),
                experiments_count=len(experiments),
                cross_domain_count=len(cross_domain),
                cycle=cycle,
                details={
                    "range": [start, end],
                    "rem_intensity": round(rem_intensity, 3),
                    "surprise": engine.aif.get_surprise(),
                },
            )

            logger.debug(
                f"REM Math cycle {cycle}: [{problem_name}] "
                f"{len(findings)} findings, {len(hypotheses)} hypotheses"
            )
            return result

        except Exception as e:
            logger.warning(f"Math dream error: {e}")
            return None

    def _nrem_consolidation(self, episodic_memory, cycle: int) -> tuple[int, int]:
        """NREM Stage 3: Förstärk viktiga minnen, försvaga oviktiga.
        
        Tidiga cykler: mer konsolidering (djupsömn)
        Sena cykler: mindre konsolidering
        """
        consolidation_strength = 1.0 - (cycle / max(self.cycles_per_night, 1)) * 0.5
        consolidated = 0
        decayed = 0

        try:
            if hasattr(episodic_memory, 'collection') and episodic_memory.collection:
                all_data = episodic_memory.collection.get()
                if all_data and all_data["ids"]:
                    now = time.time()
                    for i, mem_id in enumerate(all_data["ids"]):
                        meta = all_data["metadatas"][i]
                        strength = meta.get("strength", 1.0)
                        score = meta.get("score", 0)
                        access_count = meta.get("access_count", 0)

                        # Viktiga minnen: hög score + ofta använda
                        importance = (score * 0.6) + (min(access_count, 10) / 10 * 0.4)

                        if importance > 0.5:
                            # Konsolidera: förstärk
                            boost = consolidation_strength * importance * 0.3
                            new_strength = strength * (1.0 + boost)
                            episodic_memory.collection.update(
                                ids=[mem_id],
                                metadatas=[{**meta, "strength": new_strength}],
                            )
                            consolidated += 1
                        elif importance < 0.2 and strength < 2.0:
                            # Accelerera decay för oviktiga
                            new_strength = strength * 0.7
                            if new_strength < 0.1:
                                episodic_memory.collection.delete(ids=[mem_id])
                                decayed += 1
                            else:
                                episodic_memory.collection.update(
                                    ids=[mem_id],
                                    metadatas=[{**meta, "strength": new_strength}],
                                )
            elif hasattr(episodic_memory, 'memories'):
                # In-memory fallback
                surviving = []
                now = time.time()
                for mem in episodic_memory.memories:
                    meta = mem["metadata"]
                    strength = meta.get("strength", 1.0)
                    score = meta.get("score", 0)
                    access_count = meta.get("access_count", 0)
                    importance = (score * 0.6) + (min(access_count, 10) / 10 * 0.4)

                    if importance > 0.5:
                        meta["strength"] = strength * (1.0 + consolidation_strength * importance * 0.3)
                        consolidated += 1
                    elif importance < 0.2 and strength < 2.0:
                        meta["strength"] = strength * 0.7
                        if meta["strength"] < 0.1:
                            decayed += 1
                            continue
                    surviving.append(mem)
                episodic_memory.memories = surviving
        except Exception:
            pass

        return consolidated, decayed

    def _rem_dreams(
        self, hdc_bridge, concept_code: dict, cycle: int
    ) -> list[DreamResult]:
        """REM-sömn: Kombinera slumpmässiga koncept via HDC-bindning.
        
        Sena cykler har mer REM (som hos människor).
        """
        dreams = []
        concepts = list(concept_code.keys())
        if len(concepts) < 2:
            return dreams

        # Sena cykler = mer REM
        rem_intensity = 0.3 + (cycle / max(self.cycles_per_night, 1)) * 0.7
        num_attempts = int(rem_intensity * 10)

        for _ in range(num_attempts):
            # Plocka två slumpmässiga koncept
            concept_a, concept_b = random.sample(concepts, 2)

            # Beräkna novelty: hur olika är koncepten?
            try:
                idx_a = list(hdc_bridge.concept_memory.keys()).index(concept_a) if concept_a in hdc_bridge.concept_memory else -1
                idx_b = list(hdc_bridge.concept_memory.keys()).index(concept_b) if concept_b in hdc_bridge.concept_memory else -1

                if idx_a >= 0 and idx_b >= 0:
                    vec_a = list(hdc_bridge.concept_memory.values())[idx_a]
                    vec_b = list(hdc_bridge.concept_memory.values())[idx_b]
                    # Cosine similarity
                    sim = torch.nn.functional.cosine_similarity(
                        vec_a.unsqueeze(0), vec_b.unsqueeze(0)
                    ).item()
                    novelty = 1.0 - abs(sim)  # Mer olika = mer novel
                else:
                    novelty = random.uniform(0.3, 0.8)
            except Exception:
                novelty = random.uniform(0.3, 0.8)

            # Coherence: har båda koncepten fungerande kod?
            has_code_a = concept_a in concept_code and len(concept_code[concept_a]) > 10
            has_code_b = concept_b in concept_code and len(concept_code[concept_b]) > 10
            coherence = 0.8 if (has_code_a and has_code_b) else 0.3

            insight_potential = novelty * coherence

            if novelty > 0.4 and coherence > 0.2:
                dream = DreamResult(
                    concept_a=concept_a,
                    concept_b=concept_b,
                    novelty=round(novelty, 3),
                    coherence=round(coherence, 3),
                    insight_potential=round(insight_potential, 3),
                    cycle=cycle,
                )
                dreams.append(dream)

        return dreams

    def narrate_dream(self, dream: DreamResult) -> str:
        """Berätta en dröm i naturligt språk."""
        return (
            f"Drömde att '{dream.concept_a}' blandades med '{dream.concept_b}'. "
            f"Novelty: {dream.novelty:.0%}, Insiktspotential: {dream.insight_potential:.0%}."
        )

    def get_stats(self) -> dict:
        stats = {
            "total_dreams": self.total_dreams,
            "total_insights": self.total_insights,
            "total_consolidated": self.total_consolidated,
            "total_decayed": self.total_decayed,
            "dream_journal_size": len(self.dream_journal),
            "total_math_findings": self.total_math_findings,
            "total_collatz_anomalies": self.total_collatz_anomalies,
            "math_journal_size": len(self.math_journal),
        }
        if self._math_engine:
            stats["math_research"] = self._math_engine.get_stats()
        if self._collatz_explorer:
            stats["collatz"] = self._collatz_explorer.get_stats()
        return stats


# Need torch for HDC operations in dreams
try:
    import torch
except ImportError:
    pass
