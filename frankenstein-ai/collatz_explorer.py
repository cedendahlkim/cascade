"""
CollatzExplorer — Autonom matematisk utforskning via Collatz-förmodan.

Kör som bakgrundsprocess (drömprocess under sömnkonsolidering) och utforskar
Collatz-sekvenser för att detektera anomalier, formulera hypoteser, och
encodera mönster som HDC-vektorer i Ebbinghaus-minnet.

Integration:
- HDC (cognition.py): Mönster encoderas som hypervektorer via binding/permutation
- AIF (agency.py): Surprise-driven exploration — hög surprise = hög prioritet
- Ebbinghaus (memory.py): Upptäckter lagras med retention/strength-dynamik

Collatz-förmodan:
    n → n/2      om n är jämnt
    n → 3n + 1   om n är udda
    Alla tal verkar nå 1, men ingen har bevisat varför.
"""

import time
import math
import json
import os
import asyncio
import logging
from dataclasses import dataclass, field, asdict
from typing import Optional
from collections import defaultdict, Counter

import numpy as np
import torch

# HDC-operationer från cognition.py
from cognition import (
    hdc_random_projection,
    hdc_bind,
    hdc_permute,
    hdc_bundle,
    hdc_cosine_similarity,
    NeuroSymbolicBridge,
)

# Active Inference från agency.py
from agency import ActiveInferenceAgent

# Ebbinghaus-minne från memory.py
from memory import EbbinghausMemory

# ── Logging ──

logger = logging.getLogger("collatz_explorer")
logger.setLevel(logging.INFO)
if not logger.handlers:
    _handler = logging.StreamHandler()
    _handler.setFormatter(logging.Formatter(
        "[%(asctime)s] %(name)s %(levelname)s: %(message)s", datefmt="%H:%M:%S"
    ))
    logger.addHandler(_handler)

# ── Constants ──

HDC_DIM = 10_000          # Samma dimensionalitet som NeuroSymbolicBridge
ANOMALY_STEPS_Z = 2.0     # Z-score tröskel för anomala stegantal
ANOMALY_PEAK_Z = 2.0      # Z-score tröskel för anomala toppvärden
DISCOVERY_LOG_DIR = os.path.join(os.path.dirname(__file__), "training_data", "collatz")

# ── Data classes ──


@dataclass
class CollatzSequence:
    """En fullständig Collatz-sekvens med metadata."""
    n: int
    steps: list[int] = field(default_factory=list)
    length: int = 0
    peak: int = 0
    odd_steps: int = 0
    even_steps: int = 0

    @property
    def peak_ratio(self) -> float:
        """Förhållande mellan toppvärde och startvärde."""
        return self.peak / self.n if self.n > 0 else 0.0

    @property
    def odd_ratio(self) -> float:
        """Andel udda steg."""
        return self.odd_steps / self.length if self.length > 0 else 0.0


@dataclass
class CollatzAnomaly:
    """En detekterad anomali i en Collatz-sekvens."""
    n: int
    anomaly_type: str          # "long_sequence", "high_peak", "odd_heavy", "pattern"
    severity: float            # 0.0 - 1.0
    description: str
    sequence_length: int
    peak_value: int
    z_score: float = 0.0
    timestamp: float = field(default_factory=time.time)


@dataclass
class CollatzDiscovery:
    """En upptäckt/hypotes formulerad av explorern."""
    discovery_id: str
    hypothesis: str
    evidence: list[int]        # Tal som stödjer hypotesen
    confidence: float          # 0.0 - 1.0
    category: str              # "pattern", "anomaly", "conjecture", "structure"
    hdc_embedding: Optional[list[float]] = None
    memory_id: Optional[str] = None
    timestamp: float = field(default_factory=time.time)
    surprise_score: float = 0.0


# ── Basis-vektorer för HDC-encoding ──

class CollatzHDCEncoder:
    """Encoderar Collatz-mönster som hypervektorer.
    
    Använder HDC-operationer (bind, permute, bundle) för att skapa
    distribuerade representationer av sekvensegenskaper.
    
    Encoding-schema:
        - Basvektorer för egenskaper: length, peak, odd_ratio, residue classes
        - Binding: Associera egenskap med värde
        - Permutation: Koda ordning i sekvensen
        - Bundling: Kombinera alla egenskaper till en holografisk vektor
    """

    def __init__(self, dim: int = HDC_DIM):
        self.dim = dim
        # Basvektorer för egenskaper (slumpmässiga, ortogonala i hög dim)
        self._basis = {
            "length": torch.randn(dim),
            "peak": torch.randn(dim),
            "peak_ratio": torch.randn(dim),
            "odd_ratio": torch.randn(dim),
            "even_ratio": torch.randn(dim),
            "residue_mod3": torch.randn(dim),
            "residue_mod4": torch.randn(dim),
            "residue_mod6": torch.randn(dim),
            "growth_rate": torch.randn(dim),
            "convergence_speed": torch.randn(dim),
        }
        # Normalisera alla basvektorer
        for key in self._basis:
            self._basis[key] = self._basis[key] / self._basis[key].norm()

        # Kvantiseringsvektorer för numeriska värden (0-99 bins)
        self._value_vectors = torch.randn(100, dim)
        for i in range(100):
            self._value_vectors[i] = self._value_vectors[i] / self._value_vectors[i].norm()

    def _quantize(self, value: float, min_val: float = 0.0, max_val: float = 1.0) -> int:
        """Kvantisera ett värde till 0-99 bin."""
        normalized = (value - min_val) / max(max_val - min_val, 1e-10)
        return max(0, min(99, int(normalized * 99)))

    def encode(self, seq: CollatzSequence) -> torch.Tensor:
        """Encodera en Collatz-sekvens som HDC-vektor.
        
        Skapar en holografisk representation genom:
        1. Bind varje egenskap med sitt kvantiserade värde
        2. Bundle alla bindningar till en enda vektor
        
        Args:
            seq: CollatzSequence att encodera
            
        Returns:
            hv: Normaliserad hypervektor (dim,)
        """
        bindings = []

        # Length (log-skala, 1-1000 steg)
        length_bin = self._quantize(math.log1p(seq.length), 0, math.log1p(1000))
        bindings.append(hdc_bind(self._basis["length"], self._value_vectors[length_bin]))

        # Peak (log-skala)
        peak_bin = self._quantize(math.log1p(seq.peak), 0, math.log1p(1e15))
        bindings.append(hdc_bind(self._basis["peak"], self._value_vectors[peak_bin]))

        # Peak ratio
        pr_bin = self._quantize(min(seq.peak_ratio, 1000), 0, 1000)
        bindings.append(hdc_bind(self._basis["peak_ratio"], self._value_vectors[pr_bin]))

        # Odd ratio
        or_bin = self._quantize(seq.odd_ratio)
        bindings.append(hdc_bind(self._basis["odd_ratio"], self._value_vectors[or_bin]))

        # Residue classes (mod 3, 4, 6)
        mod3_bin = self._quantize(seq.n % 3, 0, 2)
        bindings.append(hdc_bind(self._basis["residue_mod3"], self._value_vectors[mod3_bin]))

        mod4_bin = self._quantize(seq.n % 4, 0, 3)
        bindings.append(hdc_bind(self._basis["residue_mod4"], self._value_vectors[mod4_bin]))

        mod6_bin = self._quantize(seq.n % 6, 0, 5)
        bindings.append(hdc_bind(self._basis["residue_mod6"], self._value_vectors[mod6_bin]))

        # Growth rate (max consecutive increases)
        if len(seq.steps) >= 2:
            max_growth = 0
            current_growth = 0
            for i in range(1, len(seq.steps)):
                if seq.steps[i] > seq.steps[i - 1]:
                    current_growth += 1
                    max_growth = max(max_growth, current_growth)
                else:
                    current_growth = 0
            gr_bin = self._quantize(max_growth, 0, 50)
            bindings.append(hdc_bind(self._basis["growth_rate"], self._value_vectors[gr_bin]))

        # Convergence speed (steg från peak till 1)
        if seq.steps and seq.peak > 0:
            try:
                peak_idx = seq.steps.index(seq.peak)
                steps_after_peak = seq.length - peak_idx
                cs_bin = self._quantize(steps_after_peak / max(seq.length, 1))
                bindings.append(hdc_bind(self._basis["convergence_speed"], self._value_vectors[cs_bin]))
            except ValueError:
                pass

        # Bundle alla bindningar
        result = bindings[0]
        for b in bindings[1:]:
            result = hdc_bundle(result, b)

        # Normalisera
        norm = result.norm()
        if norm > 0:
            result = result / norm

        return result

    def encode_subsequence(self, steps: list[int], window: int = 8) -> torch.Tensor:
        """Encodera en delsekvens med permutation för ordning.
        
        Använder permutation för att koda positionell information:
        hv = Σ permute(value_vec, position)
        
        Args:
            steps: Lista med tal i sekvensen
            window: Antal steg att encodera
            
        Returns:
            hv: Normaliserad hypervektor (dim,)
        """
        truncated = steps[:window]
        result = torch.zeros(self.dim)

        for pos, val in enumerate(truncated):
            val_bin = self._quantize(math.log1p(val), 0, math.log1p(1e12))
            val_vec = self._value_vectors[val_bin]
            # Permutation kodar position
            result = result + hdc_permute(val_vec, shifts=pos)

        norm = result.norm()
        if norm > 0:
            result = result / norm
        return result

    def similarity(self, a: torch.Tensor, b: torch.Tensor) -> float:
        """Cosine similarity mellan två HDC-vektorer."""
        sim = hdc_cosine_similarity(a, b)
        return float(sim.squeeze())


# ── Collatz Explorer ──

class CollatzExplorer:
    """Autonom Collatz-utforskare med HDC/AIF/Ebbinghaus-integration.
    
    Utforskar Collatz-sekvenser, detekterar anomalier, formulerar hypoteser,
    och lagrar upptäckter i Ebbinghaus-minnet. Styrs av Active Inference
    för nyfikenhetsdriven exploration.
    
    Attributes:
        hdc_encoder: HDC-encoder för mönster
        aif_agent: Active Inference-agent för exploration-beslut
        memory: Ebbinghaus-minne för persistent lagring
        bridge: NeuroSymbolicBridge för koncept-lärande
    """

    def __init__(
        self,
        memory: Optional[EbbinghausMemory] = None,
        bridge: Optional[NeuroSymbolicBridge] = None,
        exploration_weight: float = 0.7,  # Hög nyfikenhet
    ):
        # HDC encoder
        self.hdc_encoder = CollatzHDCEncoder(dim=HDC_DIM)

        # Active Inference agent
        # 8 observationer: anomaly types + normal + unknown
        # 4 actions: explore_sequential, explore_random, explore_anomaly_neighbors, consolidate
        self.aif_agent = ActiveInferenceAgent(
            num_observations=8,
            num_states=8,
            num_actions=4,
            preference_obs=[0, 1, 2],  # Föredrar anomali-observationer
            exploration_weight=exploration_weight,
        )

        # Ebbinghaus memory
        self.memory = memory or EbbinghausMemory(
            collection_name="collatz_discoveries",
            decay_threshold=0.05,
        )

        # NeuroSymbolicBridge för koncept-lärande
        self.bridge = bridge or NeuroSymbolicBridge(lnn_output_dim=32, hdc_dim=HDC_DIM)

        # Intern statistik
        self._sequences_computed: dict[int, CollatzSequence] = {}
        self._anomalies: list[CollatzAnomaly] = []
        self._discoveries: list[CollatzDiscovery] = []
        self._stats = defaultdict(float)
        self._running = False
        self._exploration_frontier: list[int] = []
        self._discovery_counter = 0

        # Statistik för anomali-detektion (running mean/std)
        self._length_sum = 0.0
        self._length_sq_sum = 0.0
        self._peak_sum = 0.0
        self._peak_sq_sum = 0.0
        self._count = 0

        # Säkerställ logg-katalog
        os.makedirs(DISCOVERY_LOG_DIR, exist_ok=True)

    # ── Core: Collatz-sekvens ──

    def run_sequence(self, n: int) -> list[int]:
        """Beräkna Collatz-sekvensen för n.
        
        Args:
            n: Startvärde (positivt heltal > 0)
            
        Returns:
            steps: Hela sekvensen som lista [n, ..., 1]
            
        Raises:
            ValueError: Om n <= 0
        """
        if n <= 0:
            raise ValueError(f"n must be positive, got {n}")

        steps = [n]
        current = n
        seen = {n}

        while current != 1:
            if current % 2 == 0:
                current = current // 2
            else:
                current = 3 * current + 1

            steps.append(current)

            # Säkerhetsgräns (undvik oändliga loopar vid buggar)
            if len(steps) > 10_000_000:
                logger.warning(f"Sequence for n={n} exceeded 10M steps, aborting")
                break

        # Cacha sekvensen
        seq = CollatzSequence(
            n=n,
            steps=steps,
            length=len(steps) - 1,  # Antal steg (exkludera startvärdet)
            peak=max(steps),
            odd_steps=sum(1 for s in steps[:-1] if s % 2 != 0),
            even_steps=sum(1 for s in steps[:-1] if s % 2 == 0),
        )
        self._sequences_computed[n] = seq

        # Uppdatera running statistics
        self._count += 1
        self._length_sum += seq.length
        self._length_sq_sum += seq.length ** 2
        self._peak_sum += math.log1p(seq.peak)
        self._peak_sq_sum += math.log1p(seq.peak) ** 2

        return steps

    # ── Analys ──

    def analyze_range(self, start: int, end: int) -> list[CollatzAnomaly]:
        """Analysera alla tal i [start, end] och returnera anomalier.
        
        Kör sekvenser, beräknar statistik, och detekterar avvikelser
        via z-score-analys.
        
        Args:
            start: Första talet att analysera (inklusivt)
            end: Sista talet att analysera (inklusivt)
            
        Returns:
            anomalies: Lista med detekterade anomalier
        """
        if start <= 0:
            start = 1
        if end < start:
            raise ValueError(f"end ({end}) must be >= start ({start})")

        anomalies: list[CollatzAnomaly] = []

        # Fas 1: Beräkna alla sekvenser
        sequences: list[CollatzSequence] = []
        for n in range(start, end + 1):
            if n not in self._sequences_computed:
                self.run_sequence(n)
            sequences.append(self._sequences_computed[n])

        if len(sequences) < 3:
            return anomalies

        # Fas 2: Beräkna statistik för anomali-detektion
        lengths = np.array([s.length for s in sequences], dtype=float)
        log_peaks = np.array([math.log1p(s.peak) for s in sequences], dtype=float)
        odd_ratios = np.array([s.odd_ratio for s in sequences], dtype=float)

        mean_len, std_len = float(np.mean(lengths)), float(np.std(lengths)) + 1e-10
        mean_peak, std_peak = float(np.mean(log_peaks)), float(np.std(log_peaks)) + 1e-10
        mean_odd, std_odd = float(np.mean(odd_ratios)), float(np.std(odd_ratios)) + 1e-10

        # Fas 3: Detektera anomalier
        for seq in sequences:
            z_length = (seq.length - mean_len) / std_len
            z_peak = (math.log1p(seq.peak) - mean_peak) / std_peak
            z_odd = (seq.odd_ratio - mean_odd) / std_odd

            # Ovanligt lång sekvens
            if z_length > ANOMALY_STEPS_Z:
                severity = min(1.0, z_length / 5.0)
                anomaly = CollatzAnomaly(
                    n=seq.n,
                    anomaly_type="long_sequence",
                    severity=severity,
                    description=f"n={seq.n}: {seq.length} steg (z={z_length:.2f}, medel={mean_len:.1f})",
                    sequence_length=seq.length,
                    peak_value=seq.peak,
                    z_score=z_length,
                )
                anomalies.append(anomaly)

            # Ovanligt högt toppvärde
            if z_peak > ANOMALY_PEAK_Z:
                severity = min(1.0, z_peak / 5.0)
                anomaly = CollatzAnomaly(
                    n=seq.n,
                    anomaly_type="high_peak",
                    severity=severity,
                    description=f"n={seq.n}: peak={seq.peak} (z={z_peak:.2f}, ratio={seq.peak_ratio:.1f}x)",
                    sequence_length=seq.length,
                    peak_value=seq.peak,
                    z_score=z_peak,
                )
                anomalies.append(anomaly)

            # Ovanligt hög andel udda steg
            if z_odd > ANOMALY_STEPS_Z:
                severity = min(1.0, z_odd / 4.0)
                anomaly = CollatzAnomaly(
                    n=seq.n,
                    anomaly_type="odd_heavy",
                    severity=severity,
                    description=f"n={seq.n}: {seq.odd_ratio:.1%} udda steg (z={z_odd:.2f})",
                    sequence_length=seq.length,
                    peak_value=seq.peak,
                    z_score=z_odd,
                )
                anomalies.append(anomaly)

        self._anomalies.extend(anomalies)
        self._stats["ranges_analyzed"] += 1
        self._stats["total_anomalies"] += len(anomalies)

        if anomalies:
            logger.info(f"analyze_range({start}, {end}): {len(anomalies)} anomalier detekterade")

        return anomalies

    # ── HDC Encoding ──

    def encode_to_hdc(self, pattern: CollatzSequence | list[int] | int) -> torch.Tensor:
        """Encodera ett Collatz-mönster som HDC-vektor.
        
        Accepterar:
        - CollatzSequence: Encoderar hela sekvensens egenskaper
        - list[int]: Encoderar som delsekvens med positionell information
        - int: Beräknar sekvensen först, sedan encoderar
        
        Args:
            pattern: Mönster att encodera
            
        Returns:
            hv: Normaliserad hypervektor (HDC_DIM,)
        """
        if isinstance(pattern, int):
            if pattern not in self._sequences_computed:
                self.run_sequence(pattern)
            return self.hdc_encoder.encode(self._sequences_computed[pattern])
        elif isinstance(pattern, list):
            return self.hdc_encoder.encode_subsequence(pattern)
        elif isinstance(pattern, CollatzSequence):
            return self.hdc_encoder.encode(pattern)
        else:
            raise TypeError(f"Unsupported pattern type: {type(pattern)}")

    # ── Ebbinghaus Memory ──

    def store_discovery(self, discovery: CollatzDiscovery) -> str:
        """Spara en upptäckt i Ebbinghaus-minnet.
        
        Skapar en HDC-embedding om den saknas, lagrar i minnet med
        metadata, och loggar till disk.
        
        Args:
            discovery: Upptäckt att spara
            
        Returns:
            memory_id: ID i Ebbinghaus-minnet
        """
        # Generera HDC-embedding om den saknas
        if discovery.hdc_embedding is None:
            if discovery.evidence:
                # Encodera baserat på evidens-talen
                hvs = [self.encode_to_hdc(n) for n in discovery.evidence[:5]]
                combined = hvs[0]
                for hv in hvs[1:]:
                    combined = hdc_bundle(combined, hv)
                norm = combined.norm()
                if norm > 0:
                    combined = combined / norm
                discovery.hdc_embedding = combined.numpy().tolist()
            else:
                # Slumpmässig embedding som fallback
                discovery.hdc_embedding = torch.randn(HDC_DIM).numpy().tolist()

        # Lagra i Ebbinghaus-minnet
        memory_id = self.memory.store(
            embedding=discovery.hdc_embedding,
            concept=f"collatz_{discovery.category}",
            metadata={
                "discovery_id": discovery.discovery_id,
                "hypothesis": discovery.hypothesis,
                "evidence": json.dumps(discovery.evidence[:20]),
                "confidence": discovery.confidence,
                "category": discovery.category,
                "surprise_score": discovery.surprise_score,
                "source": "collatz_explorer",
            },
        )
        discovery.memory_id = memory_id

        # Lär konceptet i NeuroSymbolicBridge
        hv_tensor = torch.tensor(discovery.hdc_embedding, dtype=torch.float32)
        self.bridge.learn_concept(f"collatz_{discovery.category}", hv_tensor)

        # Spara till disk
        self._discoveries.append(discovery)
        self._save_discovery_log(discovery)

        self._stats["discoveries_stored"] += 1
        logger.info(f"Discovery stored: [{discovery.category}] {discovery.hypothesis[:80]}...")

        return memory_id

    def _save_discovery_log(self, discovery: CollatzDiscovery) -> None:
        """Logga upptäckt till JSON-fil."""
        log_file = os.path.join(DISCOVERY_LOG_DIR, "discoveries.jsonl")
        try:
            entry = {
                "discovery_id": discovery.discovery_id,
                "hypothesis": discovery.hypothesis,
                "evidence": discovery.evidence[:20],
                "confidence": discovery.confidence,
                "category": discovery.category,
                "surprise_score": discovery.surprise_score,
                "timestamp": discovery.timestamp,
            }
            with open(log_file, "a", encoding="utf-8") as f:
                f.write(json.dumps(entry, ensure_ascii=False) + "\n")
        except Exception as e:
            logger.warning(f"Could not write discovery log: {e}")

    # ── AIF-driven Exploration ──

    def get_next_target(self) -> int:
        """Bestäm nästa tal att utforska baserat på AIF surprise-minimering.
        
        Strategier (AIF actions):
        0: Sekventiell — nästa oexplorade tal
        1: Slumpmässig — hoppa till ett slumpmässigt stort tal
        2: Anomali-grannar — utforska runt kända anomalier
        3: Konsolidera — återbesök tidigare intressanta tal
        
        Returns:
            n: Nästa tal att utforska
        """
        # Mappa senaste observation till AIF
        if self._anomalies:
            last_anomaly = self._anomalies[-1]
            obs_map = {
                "long_sequence": 0,
                "high_peak": 1,
                "odd_heavy": 2,
                "pattern": 3,
            }
            observation = obs_map.get(last_anomaly.anomaly_type, 4)
        else:
            observation = 4  # "normal" — inget intressant hittades

        # AIF väljer strategi
        action = self.aif_agent.step(observation)
        surprise = self.aif_agent.get_surprise()

        self._stats["aif_steps"] += 1
        self._stats["last_surprise"] = surprise

        # Exekvera strategi
        max_explored = max(self._sequences_computed.keys()) if self._sequences_computed else 0

        if action == 0:
            # Sekventiell: nästa oexplorade
            target = max_explored + 1
            logger.debug(f"AIF action=sequential, target={target}, surprise={surprise:.3f}")

        elif action == 1:
            # Slumpmässig: hoppa till stort tal (surprise-proportionellt)
            magnitude = min(int(10 ** (3 + surprise * 3)), 2_000_000_000)  # Cap to safe int32
            target = np.random.randint(max(1, magnitude // 2), max(2, magnitude))
            logger.debug(f"AIF action=random, target={target}, surprise={surprise:.3f}")

        elif action == 2:
            # Anomali-grannar: utforska runt kända anomalier
            if self._anomalies:
                base = np.random.choice([a.n for a in self._anomalies[-20:]])
                offset = np.random.randint(-10, 11)
                target = max(1, base + offset)
            else:
                target = max_explored + 1
            logger.debug(f"AIF action=anomaly_neighbors, target={target}, surprise={surprise:.3f}")

        elif action == 3:
            # Konsolidera: återbesök och jämför
            if self._discoveries:
                evidence_pool = []
                for d in self._discoveries[-10:]:
                    evidence_pool.extend(d.evidence[:5])
                if evidence_pool:
                    target = np.random.choice(evidence_pool)
                else:
                    target = max_explored + 1
            else:
                target = max_explored + 1
            logger.debug(f"AIF action=consolidate, target={target}, surprise={surprise:.3f}")

        else:
            target = max_explored + 1

        return int(target)

    # ── Hypotes-formulering ──

    def _formulate_hypotheses(self, anomalies: list[CollatzAnomaly]) -> list[CollatzDiscovery]:
        """Formulera hypoteser baserat på detekterade anomalier.
        
        Analyserar mönster bland anomalier och skapar strukturerade
        hypoteser med evidens och confidence.
        """
        discoveries: list[CollatzDiscovery] = []

        if not anomalies:
            return discoveries

        # Gruppera anomalier per typ
        by_type: dict[str, list[CollatzAnomaly]] = defaultdict(list)
        for a in anomalies:
            by_type[a.anomaly_type].append(a)

        # Hypotes 1: Residue class patterns bland long sequences
        long_seqs = by_type.get("long_sequence", [])
        if len(long_seqs) >= 3:
            residues_mod6 = [a.n % 6 for a in long_seqs]
            from collections import Counter
            residue_counts = Counter(residues_mod6)
            most_common_residue, count = residue_counts.most_common(1)[0]
            if count >= len(long_seqs) * 0.4:
                self._discovery_counter += 1
                discoveries.append(CollatzDiscovery(
                    discovery_id=f"disc_{self._discovery_counter}",
                    hypothesis=f"Tal med n ≡ {most_common_residue} (mod 6) tenderar att ha längre Collatz-sekvenser. "
                               f"{count}/{len(long_seqs)} av detekterade långa sekvenser har denna residue class.",
                    evidence=[a.n for a in long_seqs],
                    confidence=min(0.9, count / len(long_seqs)),
                    category="pattern",
                    surprise_score=self.aif_agent.get_surprise(),
                ))

        # Hypotes 2: Peak clustering
        high_peaks = by_type.get("high_peak", [])
        if len(high_peaks) >= 2:
            peak_ratios = [self._sequences_computed[a.n].peak_ratio for a in high_peaks
                          if a.n in self._sequences_computed]
            if peak_ratios:
                mean_ratio = np.mean(peak_ratios)
                self._discovery_counter += 1
                discoveries.append(CollatzDiscovery(
                    discovery_id=f"disc_{self._discovery_counter}",
                    hypothesis=f"Anomalt höga toppvärden har genomsnittlig peak_ratio={mean_ratio:.1f}x. "
                               f"Dessa tal når {mean_ratio:.0f} gånger sitt startvärde innan de konvergerar.",
                    evidence=[a.n for a in high_peaks],
                    confidence=min(0.8, len(high_peaks) / 10),
                    category="anomaly",
                    surprise_score=self.aif_agent.get_surprise(),
                ))

        # Hypotes 3: Odd-heavy sequences och binär struktur
        odd_heavy = by_type.get("odd_heavy", [])
        if len(odd_heavy) >= 2:
            # Kolla binär representation
            binary_patterns = [bin(a.n).count("1") / len(bin(a.n)[2:]) for a in odd_heavy]
            mean_density = np.mean(binary_patterns)
            self._discovery_counter += 1
            discoveries.append(CollatzDiscovery(
                discovery_id=f"disc_{self._discovery_counter}",
                hypothesis=f"Tal med hög andel udda steg har genomsnittlig binär 1-densitet={mean_density:.2f}. "
                           f"Binär struktur kan korrelera med sekvensens udda/jämn-fördelning.",
                evidence=[a.n for a in odd_heavy],
                confidence=min(0.7, len(odd_heavy) / 8),
                category="structure",
                surprise_score=self.aif_agent.get_surprise(),
            ))

        return discoveries

    # ── Asynkron bakgrundsprocess ──

    async def explore_async(
        self,
        iterations: int = 100,
        batch_size: int = 50,
        callback=None,
    ) -> dict:
        """Kör autonom utforskning som asynkron bakgrundsprocess.
        
        Varje iteration:
        1. AIF väljer nästa mål
        2. Beräkna sekvenser i batch
        3. Detektera anomalier
        4. Formulera hypoteser
        5. Lagra upptäckter i Ebbinghaus-minnet
        6. Encodera mönster som HDC-vektorer
        
        Args:
            iterations: Antal utforsknings-iterationer
            batch_size: Antal tal per batch
            callback: Optional callback(iteration, stats) per iteration
            
        Returns:
            summary: Sammanfattning av utforskningen
        """
        self._running = True
        total_anomalies = 0
        total_discoveries = 0
        i = -1

        logger.info(f"Starting async exploration: {iterations} iterations × {batch_size} batch")

        for i in range(iterations):
            if not self._running:
                logger.info("Exploration stopped by external signal")
                break

            # 1. AIF väljer startpunkt
            start_n = self.get_next_target()
            end_n = start_n + batch_size - 1

            # 2-3. Beräkna och analysera
            anomalies = self.analyze_range(start_n, end_n)
            total_anomalies += len(anomalies)

            # 4. Formulera hypoteser
            if anomalies:
                hypotheses = self._formulate_hypotheses(anomalies)
                total_discoveries += len(hypotheses)

                # 5-6. Lagra och encodera
                for discovery in hypotheses:
                    self.store_discovery(discovery)

            # Yield control
            await asyncio.sleep(0)

            # Callback
            if callback:
                stats = self.get_stats()
                stats["iteration"] = i + 1
                stats["total_iterations"] = iterations
                callback(i, stats)

            if (i + 1) % 10 == 0:
                surprise = self.aif_agent.get_surprise()
                logger.info(
                    f"Iteration {i+1}/{iterations}: "
                    f"{len(self._sequences_computed)} sekvenser, "
                    f"{total_anomalies} anomalier, "
                    f"{total_discoveries} upptäckter, "
                    f"surprise={surprise:.3f}"
                )

        self._running = False

        summary = {
            "iterations_completed": min(i + 1, iterations) if i is not None else 0,
            "sequences_computed": len(self._sequences_computed),
            "anomalies_detected": total_anomalies,
            "discoveries_made": total_discoveries,
            "aif_surprise": self.aif_agent.get_surprise(),
            "aif_stats": self.aif_agent.get_stats(),
            "memory_stats": self.memory.get_stats(),
        }

        logger.info(f"Exploration complete: {summary}")
        return summary

    def stop(self) -> None:
        """Stoppa pågående asynkron utforskning."""
        self._running = False

    # ── Recall & Query ──

    def recall_similar_discoveries(self, pattern: CollatzSequence | int, n_results: int = 5) -> list[dict]:
        """Hämta liknande upptäckter från Ebbinghaus-minnet.
        
        Args:
            pattern: Mönster att söka efter (sekvens eller tal)
            n_results: Max antal resultat
            
        Returns:
            results: Lista med matchande minnen
        """
        hv = self.encode_to_hdc(pattern)
        embedding = hv.numpy().tolist()
        return self.memory.recall(embedding, n_results=n_results)

    # ── Stats & Export ──

    def get_stats(self) -> dict:
        """Returnera fullständig statistik."""
        return {
            "sequences_computed": len(self._sequences_computed),
            "anomalies_detected": len(self._anomalies),
            "discoveries_made": len(self._discoveries),
            "aif_surprise": self.aif_agent.get_surprise(),
            "aif_steps": int(self._stats.get("aif_steps", 0)),
            "memory_stats": self.memory.get_stats(),
            "running": self._running,
            "anomaly_types": dict(
                Counter(a.anomaly_type for a in self._anomalies)
            ) if self._anomalies else {},
        }

    def get_discoveries(self) -> list[dict]:
        """Returnera alla upptäckter som dicts."""
        return [
            {
                "discovery_id": d.discovery_id,
                "hypothesis": d.hypothesis,
                "evidence": d.evidence[:10],
                "confidence": d.confidence,
                "category": d.category,
                "surprise_score": d.surprise_score,
                "timestamp": d.timestamp,
                "memory_id": d.memory_id,
            }
            for d in self._discoveries
        ]

    def get_anomalies(self) -> list[dict]:
        """Returnera alla anomalier som dicts."""
        return [asdict(a) for a in self._anomalies]


# ── Convenience: Synkron körning ──

def explore_collatz(start: int = 1, end: int = 10_000, batch_size: int = 500) -> dict:
    """Enkel synkron utforskning av ett intervall.
    
    Args:
        start: Första talet
        end: Sista talet
        batch_size: Analysera i batchar av denna storlek
        
    Returns:
        result: Dict med anomalier, upptäckter, och statistik
    """
    explorer = CollatzExplorer()

    all_anomalies: list[CollatzAnomaly] = []
    all_discoveries: list[CollatzDiscovery] = []

    for batch_start in range(start, end + 1, batch_size):
        batch_end = min(batch_start + batch_size - 1, end)
        anomalies = explorer.analyze_range(batch_start, batch_end)
        all_anomalies.extend(anomalies)

        if anomalies:
            hypotheses = explorer._formulate_hypotheses(anomalies)
            for d in hypotheses:
                explorer.store_discovery(d)
            all_discoveries.extend(hypotheses)

    return {
        "range": [start, end],
        "sequences": len(explorer._sequences_computed),
        "anomalies": explorer.get_anomalies(),
        "discoveries": explorer.get_discoveries(),
        "stats": explorer.get_stats(),
    }


if __name__ == "__main__":
    # Snabb demo
    print("=== CollatzExplorer Demo ===\n")

    explorer = CollatzExplorer()

    # Kör en enskild sekvens
    seq = explorer.run_sequence(27)
    print(f"Collatz(27): {len(seq)-1} steg, peak={max(seq)}, sekvens={seq[:10]}...")

    # Analysera ett intervall
    anomalies = explorer.analyze_range(1, 1000)
    print(f"\nAnomalier i [1, 1000]: {len(anomalies)}")
    for a in anomalies[:5]:
        print(f"  [{a.anomaly_type}] n={a.n}: {a.description}")

    # Encodera som HDC
    hv = explorer.encode_to_hdc(27)
    print(f"\nHDC-vektor för n=27: dim={hv.shape}, norm={hv.norm():.4f}")

    # AIF-driven exploration
    for _ in range(5):
        target = explorer.get_next_target()
        explorer.run_sequence(target)
        print(f"AIF target: {target}, surprise={explorer.aif_agent.get_surprise():.3f}")

    print(f"\nStatistik: {json.dumps(explorer.get_stats(), indent=2, default=str)}")
