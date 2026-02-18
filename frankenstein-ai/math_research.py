"""
MathResearchEngine — Autonom matematisk forskning för Frankenstein AI.

Utforskar olösta matematiska problem, formulerar hypoteser, testar dem
empiriskt, encoderar mönster som HDC-vektorer, och lagrar upptäckter
i Ebbinghaus-minnet. Styrs av Active Inference (nyfikenhetsdrift).

Olösta problem som utforskas:
1. Goldbach's Conjecture — Varje jämnt tal > 2 = summa av två primtal
2. Twin Prime Conjecture — Oändligt många primtalspar (p, p+2)?
3. Collatz Conjecture — Integrerar CollatzExplorer
4. Perfect Numbers — Finns det udda perfekta tal?
5. Lonely Runner Conjecture — k löpare på en cirkulär bana

Forskningsmetodik:
- Varje problem implementerar ResearchProblem-gränssnittet
- MathResearchEngine orkestrerar, väljer problem via AIF surprise
- Cross-domain discovery: HDC-similarity mellan fynd från olika problem
- Allt loggas i en strukturerad forskningsjournal (JSONL)
- Hypoteser graderas med confidence, testas empiriskt, uppdateras

Integration:
- HDC (cognition.py): Mönster encoderas som 10000D hypervektorer
- AIF (agency.py): Surprise-driven problem/range-val
- Ebbinghaus (memory.py): Upptäckter lagras med retention/strength
- CollatzExplorer: Återanvänds som ett av forskningsproblemen
- Circadian (circadian.py): Kan köras som drömprocess under sömn
"""

import time
import math
import json
import os
import asyncio
import logging
import hashlib
from abc import ABC, abstractmethod
from dataclasses import dataclass, field, asdict
from typing import Optional
from collections import defaultdict, Counter

import numpy as np
import torch

from cognition import (
    hdc_bind,
    hdc_permute,
    hdc_bundle,
    hdc_cosine_similarity,
    NeuroSymbolicBridge,
)
from agency import ActiveInferenceAgent
from memory import EbbinghausMemory

# ── Logging ──

logger = logging.getLogger("math_research")
logger.setLevel(logging.INFO)
if not logger.handlers:
    _h = logging.StreamHandler()
    _h.setFormatter(logging.Formatter("[%(asctime)s] %(name)s %(levelname)s: %(message)s", datefmt="%H:%M:%S"))
    logger.addHandler(_h)

# ── Constants ──

HDC_DIM = 10_000
JOURNAL_DIR = os.path.join(os.path.dirname(__file__), "training_data", "math_research")
os.makedirs(JOURNAL_DIR, exist_ok=True)


# ══════════════════════════════════════════════════════════════════════════════
# Data Classes
# ══════════════════════════════════════════════════════════════════════════════

@dataclass
class Hypothesis:
    """En matematisk hypotes formulerad av systemet."""
    hypothesis_id: str
    problem: str               # Vilket olöst problem
    statement: str             # Hypotesens formulering
    evidence_for: list = field(default_factory=list)    # Stödjande data
    evidence_against: list = field(default_factory=list) # Motbevis
    confidence: float = 0.5    # 0.0 - 1.0
    tests_run: int = 0
    tests_passed: int = 0
    status: str = "active"     # active, supported, refuted, inconclusive
    timestamp: float = field(default_factory=time.time)
    tags: list = field(default_factory=list)

    @property
    def pass_rate(self) -> float:
        return self.tests_passed / max(self.tests_run, 1)

    def update_confidence(self):
        """Bayesiansk uppdatering av confidence baserat på testresultat."""
        if self.tests_run == 0:
            return
        # Laplace smoothing
        self.confidence = (self.tests_passed + 1) / (self.tests_run + 2)
        if self.confidence < 0.1 and self.tests_run >= 5:
            self.status = "refuted"
        elif self.confidence > 0.9 and self.tests_run >= 10:
            self.status = "supported"


@dataclass
class ResearchFinding:
    """Ett forskningsfynd — anomali, mönster, eller observation."""
    finding_id: str
    problem: str
    category: str              # "anomaly", "pattern", "counterexample", "structure", "correlation"
    description: str
    data: dict = field(default_factory=dict)
    significance: float = 0.5  # 0.0 - 1.0
    hdc_embedding: Optional[list] = None
    memory_id: Optional[str] = None
    timestamp: float = field(default_factory=time.time)


@dataclass
class ExperimentResult:
    """Resultat av ett experiment/test."""
    experiment_id: str
    problem: str
    hypothesis_id: Optional[str]
    description: str
    passed: bool
    data: dict = field(default_factory=dict)
    duration_ms: float = 0.0
    timestamp: float = field(default_factory=time.time)


# ══════════════════════════════════════════════════════════════════════════════
# Abstract Research Problem
# ══════════════════════════════════════════════════════════════════════════════

class ResearchProblem(ABC):
    """Abstrakt basklass för ett olöst matematiskt problem."""

    name: str = "unknown"
    description: str = ""
    millennium_prize: bool = False  # Är det ett Millennium Prize Problem?

    @abstractmethod
    def explore(self, start: int, end: int) -> list[ResearchFinding]:
        """Utforska problemet i ett intervall och returnera fynd."""
        ...

    @abstractmethod
    def test_hypothesis(self, hypothesis: Hypothesis, sample_size: int = 1000) -> ExperimentResult:
        """Testa en hypotes empiriskt."""
        ...

    @abstractmethod
    def generate_hypotheses(self, findings: list[ResearchFinding]) -> list[Hypothesis]:
        """Formulera nya hypoteser baserat på fynd."""
        ...

    @abstractmethod
    def encode_finding(self, finding: ResearchFinding, encoder: 'MathHDCEncoder') -> torch.Tensor:
        """Encodera ett fynd som HDC-vektor."""
        ...


# ══════════════════════════════════════════════════════════════════════════════
# HDC Encoder for Math Research
# ══════════════════════════════════════════════════════════════════════════════

class MathHDCEncoder:
    """Encoderar matematiska mönster som hypervektorer.
    
    Basvektorer för:
    - Problem-typ (goldbach, twin_prime, etc.)
    - Numeriska egenskaper (storlek, densitet, ratio)
    - Strukturella egenskaper (mod-klasser, primfaktorisering)
    """

    def __init__(self, dim: int = HDC_DIM):
        self.dim = dim
        self._basis = {}
        for name in [
            "problem_type", "magnitude", "density", "ratio", "gap",
            "mod2", "mod3", "mod6", "mod30", "prime_count",
            "divisor_sum", "growth", "oscillation", "convergence",
        ]:
            v = torch.randn(dim)
            self._basis[name] = v / v.norm()

        # Problem-typ vektorer
        self._problem_vecs = {}
        for p in ["goldbach", "twin_prime", "collatz", "perfect_number", "lonely_runner"]:
            v = torch.randn(dim)
            self._problem_vecs[p] = v / v.norm()

        # Kvantiseringsvektorer
        self._value_vecs = torch.randn(100, dim)
        for i in range(100):
            self._value_vecs[i] = self._value_vecs[i] / self._value_vecs[i].norm()

    def _q(self, value: float, lo: float = 0.0, hi: float = 1.0) -> int:
        """Kvantisera till 0-99."""
        n = (value - lo) / max(hi - lo, 1e-10)
        return max(0, min(99, int(n * 99)))

    def encode_numeric(self, problem: str, properties: dict[str, float]) -> torch.Tensor:
        """Encodera numeriska egenskaper som HDC-vektor."""
        parts = []
        # Problem-typ
        if problem in self._problem_vecs:
            parts.append(self._problem_vecs[problem])

        for key, value in properties.items():
            if key in self._basis:
                bin_idx = self._q(value, properties.get(f"{key}_min", 0), properties.get(f"{key}_max", 1))
                parts.append(hdc_bind(self._basis[key], self._value_vecs[bin_idx]))

        if not parts:
            return torch.randn(self.dim) / math.sqrt(self.dim)

        result = parts[0]
        for p in parts[1:]:
            result = hdc_bundle(result, p)
        norm = result.norm()
        if norm > 0:
            result = result / norm
        return result

    def similarity(self, a: torch.Tensor, b: torch.Tensor) -> float:
        return float(hdc_cosine_similarity(a, b).squeeze())


# ══════════════════════════════════════════════════════════════════════════════
# Prime Utilities (shared)
# ══════════════════════════════════════════════════════════════════════════════

def _sieve(limit: int) -> list[int]:
    """Eratosthenes sieve — returnerar alla primtal <= limit."""
    if limit < 2:
        return []
    is_prime = bytearray(b'\x01') * (limit + 1)
    is_prime[0] = is_prime[1] = 0
    for i in range(2, int(limit**0.5) + 1):
        if is_prime[i]:
            is_prime[i*i::i] = bytearray(len(is_prime[i*i::i]))
    return [i for i in range(2, limit + 1) if is_prime[i]]


def _is_prime(n: int) -> bool:
    """Snabb primtalstest."""
    if n < 2:
        return False
    if n < 4:
        return True
    if n % 2 == 0 or n % 3 == 0:
        return False
    i = 5
    while i * i <= n:
        if n % i == 0 or n % (i + 2) == 0:
            return False
        i += 6
    return True


def _divisor_sum(n: int) -> int:
    """Summa av alla äkta divisorer av n."""
    if n <= 1:
        return 0
    s = 1
    for i in range(2, int(n**0.5) + 1):
        if n % i == 0:
            s += i
            if i != n // i:
                s += n // i
    return s


# ══════════════════════════════════════════════════════════════════════════════
# Problem 1: Goldbach's Conjecture
# ══════════════════════════════════════════════════════════════════════════════

class GoldbachProblem(ResearchProblem):
    """Goldbach's Conjecture: Varje jämnt heltal > 2 är summan av två primtal.
    
    Utforskar:
    - Antal Goldbach-partitioner per jämnt tal
    - Mönster i minsta primtal i partitionen
    - Densitet av partitioner som funktion av n
    - Residue class patterns
    """

    name = "goldbach"
    description = "Every even integer > 2 is the sum of two primes"
    millennium_prize = False

    def explore(self, start: int, end: int) -> list[ResearchFinding]:
        findings = []
        if start % 2 != 0:
            start += 1
        if start < 4:
            start = 4

        primes = set(_sieve(end + 100))
        partition_counts = []
        min_primes = []
        max_primes = []

        for n in range(start, end + 1, 2):
            count = 0
            smallest_p = n
            largest_p = 0
            for p in range(2, n // 2 + 1):
                if p in primes and (n - p) in primes:
                    count += 1
                    smallest_p = min(smallest_p, p)
                    largest_p = max(largest_p, p)

            partition_counts.append((n, count))
            if count > 0:
                min_primes.append((n, smallest_p))
                max_primes.append((n, largest_p))

            # Anomali: ovanligt få partitioner
            if count == 1:
                findings.append(ResearchFinding(
                    finding_id=f"gb_single_{n}",
                    problem="goldbach",
                    category="anomaly",
                    description=f"n={n} har bara 1 Goldbach-partition",
                    data={"n": n, "partition_count": count, "primes": [smallest_p, n - smallest_p]},
                    significance=0.7,
                ))

        # Mönster: partitionsantal vs n
        if len(partition_counts) >= 10:
            counts = [c for _, c in partition_counts]
            mean_c = np.mean(counts)
            std_c = np.std(counts) + 1e-10

            # Hitta lokala maxima
            for i in range(1, len(counts) - 1):
                if counts[i] > counts[i-1] and counts[i] > counts[i+1]:
                    z = (counts[i] - mean_c) / std_c
                    if z > 2.0:
                        n_val = partition_counts[i][0]
                        findings.append(ResearchFinding(
                            finding_id=f"gb_peak_{n_val}",
                            problem="goldbach",
                            category="pattern",
                            description=f"n={n_val} har ovanligt många partitioner ({counts[i]}, z={z:.2f})",
                            data={"n": n_val, "count": counts[i], "z_score": z},
                            significance=min(0.9, z / 5),
                        ))

            # Mod-6 analys av min-primes
            if min_primes:
                mod6_counts = Counter(p % 6 for _, p in min_primes)
                total = len(min_primes)
                for residue, count in mod6_counts.most_common(2):
                    ratio = count / total
                    if ratio > 0.4:
                        findings.append(ResearchFinding(
                            finding_id=f"gb_mod6_{residue}_{start}",
                            problem="goldbach",
                            category="structure",
                            description=f"Minsta primtal i Goldbach-partitioner: {ratio:.0%} ≡ {residue} (mod 6)",
                            data={"residue": residue, "ratio": ratio, "sample_size": total},
                            significance=0.5,
                        ))

        return findings

    def test_hypothesis(self, hypothesis: Hypothesis, sample_size: int = 1000) -> ExperimentResult:
        t0 = time.time()
        # Testa att alla jämna tal i ett slumpmässigt intervall har minst en partition
        base = np.random.randint(4, 10_000_000)
        if base % 2 != 0:
            base += 1

        passed = True
        counterexample = None
        tested = 0

        for n in range(base, base + sample_size * 2, 2):
            tested += 1
            found = False
            for p in range(2, n // 2 + 1):
                if _is_prime(p) and _is_prime(n - p):
                    found = True
                    break
            if not found:
                passed = False
                counterexample = n
                break

        duration = (time.time() - t0) * 1000
        hypothesis.tests_run += 1
        if passed:
            hypothesis.tests_passed += 1
        hypothesis.update_confidence()

        return ExperimentResult(
            experiment_id=f"gb_test_{int(time.time())}",
            problem="goldbach",
            hypothesis_id=hypothesis.hypothesis_id,
            description=f"Tested {tested} even numbers from {base}",
            passed=passed,
            data={"base": base, "tested": tested, "counterexample": counterexample},
            duration_ms=duration,
        )

    def generate_hypotheses(self, findings: list[ResearchFinding]) -> list[Hypothesis]:
        hypotheses = []
        anomalies = [f for f in findings if f.category == "anomaly"]
        patterns = [f for f in findings if f.category == "pattern"]

        if len(anomalies) >= 2:
            ns = [f.data.get("n", 0) for f in anomalies]
            mods = Counter(n % 6 for n in ns)
            most_common = mods.most_common(1)[0] if mods else (0, 0)
            hypotheses.append(Hypothesis(
                hypothesis_id=f"gb_h_{int(time.time())}_mod6",
                problem="goldbach",
                statement=f"Jämna tal med få Goldbach-partitioner tenderar att vara ≡ {most_common[0]} (mod 6)",
                evidence_for=ns[:10],
                confidence=0.4,
                tags=["goldbach", "partition_count", "mod6"],
            ))

        if patterns:
            hypotheses.append(Hypothesis(
                hypothesis_id=f"gb_h_{int(time.time())}_growth",
                problem="goldbach",
                statement="Antal Goldbach-partitioner växer ungefär som n / (2 * ln(n)²)",
                evidence_for=[f.data.get("n", 0) for f in patterns[:5]],
                confidence=0.5,
                tags=["goldbach", "growth_rate", "prime_density"],
            ))

        return hypotheses

    def encode_finding(self, finding: ResearchFinding, encoder: MathHDCEncoder) -> torch.Tensor:
        props = {
            "magnitude": math.log1p(finding.data.get("n", 0)),
            "magnitude_max": 25,
            "density": finding.data.get("count", 0) / max(finding.data.get("n", 1), 1),
            "density_max": 0.1,
        }
        return encoder.encode_numeric("goldbach", props)


# ══════════════════════════════════════════════════════════════════════════════
# Problem 2: Twin Prime Conjecture
# ══════════════════════════════════════════════════════════════════════════════

class TwinPrimeProblem(ResearchProblem):
    """Twin Prime Conjecture: Det finns oändligt många primtalspar (p, p+2).
    
    Utforskar:
    - Densitet av tvillingprimtal som funktion av n
    - Gap-distribution mellan konsekutiva tvillingpar
    - Kluster av tvillingprimtal
    - Brun's constant approximation
    """

    name = "twin_prime"
    description = "There are infinitely many primes p such that p+2 is also prime"
    millennium_prize = False

    def explore(self, start: int, end: int) -> list[ResearchFinding]:
        findings = []
        primes = _sieve(end + 2)
        prime_set = set(primes)

        twins = [(p, p + 2) for p in primes if p >= start and p + 2 in prime_set]

        if not twins:
            return findings

        # Gap-analys mellan konsekutiva tvillingpar
        gaps = []
        for i in range(1, len(twins)):
            gap = twins[i][0] - twins[i-1][0]
            gaps.append(gap)

        if len(gaps) >= 5:
            mean_gap = np.mean(gaps)
            std_gap = np.std(gaps) + 1e-10

            # Ovanligt stora gap (primtals-öknar)
            for i, gap in enumerate(gaps):
                z = (gap - mean_gap) / std_gap
                if z > 2.5:
                    findings.append(ResearchFinding(
                        finding_id=f"tp_desert_{twins[i][0]}",
                        problem="twin_prime",
                        category="anomaly",
                        description=f"Tvillingprimtals-öken: gap={gap} mellan ({twins[i][0]},{twins[i][0]+2}) och ({twins[i+1][0]},{twins[i+1][0]+2})",
                        data={"gap": gap, "z_score": z, "pair_before": twins[i][0], "pair_after": twins[i+1][0]},
                        significance=min(0.9, z / 5),
                    ))

            # Ovanligt täta kluster
            for i, gap in enumerate(gaps):
                z = (gap - mean_gap) / std_gap
                if z < -1.5 and gap <= 6:
                    findings.append(ResearchFinding(
                        finding_id=f"tp_cluster_{twins[i][0]}",
                        problem="twin_prime",
                        category="pattern",
                        description=f"Tvillingprimtals-kluster: gap={gap} nära {twins[i][0]}",
                        data={"gap": gap, "z_score": z, "center": twins[i][0]},
                        significance=0.5,
                    ))

        # Densitets-trend
        if len(twins) >= 20:
            # Dela i kvartiler och jämför densitet
            q_size = len(twins) // 4
            densities = []
            for q in range(4):
                q_twins = twins[q * q_size:(q + 1) * q_size]
                if q_twins:
                    span = q_twins[-1][0] - q_twins[0][0] + 1
                    densities.append(len(q_twins) / max(span, 1))

            if len(densities) == 4 and all(d > 0 for d in densities):
                decay_rate = densities[-1] / densities[0]
                findings.append(ResearchFinding(
                    finding_id=f"tp_density_{start}_{end}",
                    problem="twin_prime",
                    category="structure",
                    description=f"Tvillingprimtals-densitet sjunker med faktor {decay_rate:.3f} över [{start}, {end}]",
                    data={"densities": densities, "decay_rate": decay_rate, "total_twins": len(twins)},
                    significance=0.6,
                ))

        # Brun's constant approximation
        if twins:
            brun_sum = sum(1/p + 1/(p+2) for p, _ in twins)
            findings.append(ResearchFinding(
                finding_id=f"tp_brun_{start}_{end}",
                problem="twin_prime",
                category="structure",
                description=f"Brun's constant partialsumma ≈ {brun_sum:.6f} (upp till {end})",
                data={"brun_partial": brun_sum, "num_twins": len(twins), "range": [start, end]},
                significance=0.4,
            ))

        return findings

    def test_hypothesis(self, hypothesis: Hypothesis, sample_size: int = 1000) -> ExperimentResult:
        t0 = time.time()
        # Testa att det finns tvillingprimtal i slumpmässiga intervall
        base = np.random.randint(10_000, 10_000_000)
        span = sample_size * 10
        primes = _sieve(base + span)
        prime_set = set(primes)

        twins_found = [(p, p+2) for p in primes if p >= base and p + 2 in prime_set]
        passed = len(twins_found) > 0

        hypothesis.tests_run += 1
        if passed:
            hypothesis.tests_passed += 1
        hypothesis.update_confidence()

        return ExperimentResult(
            experiment_id=f"tp_test_{int(time.time())}",
            problem="twin_prime",
            hypothesis_id=hypothesis.hypothesis_id,
            description=f"Searched for twin primes in [{base}, {base+span}]",
            passed=passed,
            data={"base": base, "span": span, "twins_found": len(twins_found)},
            duration_ms=(time.time() - t0) * 1000,
        )

    def generate_hypotheses(self, findings: list[ResearchFinding]) -> list[Hypothesis]:
        hypotheses = []
        deserts = [f for f in findings if f.category == "anomaly"]
        structures = [f for f in findings if f.category == "structure"]

        if deserts:
            gaps = [f.data.get("gap", 0) for f in deserts]
            hypotheses.append(Hypothesis(
                hypothesis_id=f"tp_h_{int(time.time())}_desert",
                problem="twin_prime",
                statement=f"Maximalt gap mellan tvillingprimtalspar växer som O(ln(n)³). Observerade gap: {gaps[:5]}",
                evidence_for=gaps[:10],
                confidence=0.4,
                tags=["twin_prime", "gap_growth", "desert"],
            ))

        if structures:
            decay_rates = [f.data.get("decay_rate", 0) for f in structures if "decay_rate" in f.data]
            if decay_rates:
                mean_decay = np.mean(decay_rates)
                hypotheses.append(Hypothesis(
                    hypothesis_id=f"tp_h_{int(time.time())}_density",
                    problem="twin_prime",
                    statement=f"Tvillingprimtals-densitet avtar med genomsnittlig faktor {mean_decay:.3f} per storleksordning, konsistent med Hardy-Littlewood-förmodan",
                    evidence_for=[f.data for f in structures[:5]],
                    confidence=0.5,
                    tags=["twin_prime", "density", "hardy_littlewood"],
                ))

        return hypotheses

    def encode_finding(self, finding: ResearchFinding, encoder: MathHDCEncoder) -> torch.Tensor:
        props = {
            "gap": finding.data.get("gap", 0),
            "gap_max": 1000,
            "density": finding.data.get("decay_rate", 0.5),
        }
        return encoder.encode_numeric("twin_prime", props)


# ══════════════════════════════════════════════════════════════════════════════
# Problem 3: Perfect Numbers
# ══════════════════════════════════════════════════════════════════════════════

class PerfectNumberProblem(ResearchProblem):
    """Perfect Numbers: σ(n) = 2n. Finns det udda perfekta tal?
    
    Utforskar:
    - Abundans-mönster: σ(n)/n distribution
    - Nära-perfekta udda tal (σ(n) ≈ 2n)
    - Multiperfekta tal (σ(n) = k*n)
    - Mönster i divisorsummor modulo små primtal
    """

    name = "perfect_number"
    description = "Does an odd perfect number exist? (σ(n) = 2n where n is odd)"
    millennium_prize = False

    def explore(self, start: int, end: int) -> list[ResearchFinding]:
        findings = []
        # Fokusera på udda tal
        if start % 2 == 0:
            start += 1

        closest_to_perfect = []
        abundances = []

        for n in range(start, min(end + 1, start + 50000), 2):  # Bara udda
            s = _divisor_sum(n)
            abundance = s / n  # σ(n)/n, perfekt = 1.0 (vi räknar äkta divisorer)
            abundances.append((n, abundance))

            # Nära-perfekt (abundance nära 1.0)
            distance = abs(abundance - 1.0)
            if distance < 0.05:
                closest_to_perfect.append((n, abundance, distance))

            # Exakt perfekt (skulle vara en sensation)
            if s == n:
                findings.append(ResearchFinding(
                    finding_id=f"pn_perfect_{n}",
                    problem="perfect_number",
                    category="counterexample",
                    description=f"UDDA PERFEKT TAL HITTAT: n={n}, σ(n)={s}",
                    data={"n": n, "divisor_sum": s},
                    significance=1.0,
                ))

            # Multiperfekt: σ(n) = k*n exakt
            if n > 1 and s > 0 and s % n == 0:
                k = s // n
                if k >= 2:
                    findings.append(ResearchFinding(
                        finding_id=f"pn_multi_{n}_{k}",
                        problem="perfect_number",
                        category="pattern",
                        description=f"Udda multiperfekt: n={n}, σ(n)={s}={k}n",
                        data={"n": n, "k": k, "divisor_sum": s},
                        significance=0.8,
                    ))

        # Rapportera närmaste till perfekt
        if closest_to_perfect:
            closest_to_perfect.sort(key=lambda x: x[2])
            for n, ab, dist in closest_to_perfect[:3]:
                findings.append(ResearchFinding(
                    finding_id=f"pn_near_{n}",
                    problem="perfect_number",
                    category="anomaly",
                    description=f"Nära-perfekt udda tal: n={n}, σ(n)/n={ab:.4f} (avstånd {dist:.4f})",
                    data={"n": n, "abundance": ab, "distance": dist},
                    significance=0.6 + (1 - dist) * 0.3,
                ))

        # Abundance distribution per mod-klass
        if len(abundances) >= 100:
            mod_abundances = defaultdict(list)
            for n, ab in abundances:
                mod_abundances[n % 3].append(ab)

            for mod_class, abs_list in mod_abundances.items():
                mean_ab = np.mean(abs_list)
                findings.append(ResearchFinding(
                    finding_id=f"pn_mod3_{mod_class}_{start}",
                    problem="perfect_number",
                    category="structure",
                    description=f"Udda tal ≡ {mod_class} (mod 3): medel σ(n)/n = {mean_ab:.4f}",
                    data={"mod_class": mod_class, "mean_abundance": mean_ab, "sample_size": len(abs_list)},
                    significance=0.3,
                ))

        return findings

    def test_hypothesis(self, hypothesis: Hypothesis, sample_size: int = 1000) -> ExperimentResult:
        t0 = time.time()
        base = np.random.randint(1, 1_000_000) | 1  # Udda
        tested = 0
        found_perfect = False

        for n in range(base, base + sample_size * 2, 2):
            tested += 1
            if _divisor_sum(n) == n:
                found_perfect = True
                break

        # Hypotesen "inga udda perfekta tal finns" stöds om vi INTE hittar ett
        passed = not found_perfect

        hypothesis.tests_run += 1
        if passed:
            hypothesis.tests_passed += 1
        hypothesis.update_confidence()

        return ExperimentResult(
            experiment_id=f"pn_test_{int(time.time())}",
            problem="perfect_number",
            hypothesis_id=hypothesis.hypothesis_id,
            description=f"Searched {tested} odd numbers from {base}",
            passed=passed,
            data={"base": base, "tested": tested, "found_perfect": found_perfect},
            duration_ms=(time.time() - t0) * 1000,
        )

    def generate_hypotheses(self, findings: list[ResearchFinding]) -> list[Hypothesis]:
        hypotheses = []
        near_perfect = [f for f in findings if f.category == "anomaly"]

        if near_perfect:
            distances = [f.data.get("distance", 1) for f in near_perfect]
            min_dist = min(distances)
            hypotheses.append(Hypothesis(
                hypothesis_id=f"pn_h_{int(time.time())}_bound",
                problem="perfect_number",
                statement=f"Närmaste udda tal till perfekt har avstånd ≥ {min_dist:.4f}. "
                          f"Avståndet verkar ha en nedre gräns som växer med n.",
                evidence_for=[f.data.get("n", 0) for f in near_perfect[:10]],
                confidence=0.5,
                tags=["perfect_number", "lower_bound", "abundance"],
            ))

        return hypotheses

    def encode_finding(self, finding: ResearchFinding, encoder: MathHDCEncoder) -> torch.Tensor:
        props = {
            "magnitude": math.log1p(finding.data.get("n", 0)),
            "magnitude_max": 20,
            "divisor_sum": finding.data.get("abundance", 0.5),
            "divisor_sum_max": 2.0,
        }
        return encoder.encode_numeric("perfect_number", props)


# ══════════════════════════════════════════════════════════════════════════════
# Problem 4: Lonely Runner Conjecture
# ══════════════════════════════════════════════════════════════════════════════

class LonelyRunnerProblem(ResearchProblem):
    """Lonely Runner Conjecture: k löpare med distinkta hastigheter på en
    cirkulär bana av längd 1. Varje löpare blir vid någon tidpunkt ensam
    (avstånd ≥ 1/k från alla andra).
    
    Utforskar:
    - Verifiering för specifika hastighetsuppsättningar
    - Minimalt "ensamt avstånd" som funktion av k
    - Mönster i optimala hastighetsval
    """

    name = "lonely_runner"
    description = "For k runners with distinct speeds on a unit circle, each runner is at some time at distance ≥ 1/k from all others"
    millennium_prize = False

    def _check_lonely(self, speeds: list[int], resolution: int = 10000) -> tuple[bool, float]:
        """Kolla om löpare 0 (hastighet 0) blir ensam.
        
        Returns: (is_lonely, min_achieved_distance)
        """
        k = len(speeds)
        threshold = 1.0 / k
        best_min_dist = 0.0

        for t_num in range(1, resolution + 1):
            t = t_num / resolution
            min_dist = 1.0
            for s in speeds[1:]:  # Löpare 0 är stationär
                pos = (s * t) % 1.0
                dist = min(pos, 1.0 - pos)
                min_dist = min(min_dist, dist)
            best_min_dist = max(best_min_dist, min_dist)

        return best_min_dist >= threshold - 1e-9, best_min_dist

    def explore(self, start: int, end: int) -> list[ResearchFinding]:
        findings = []
        # Utforska med k = start till end löpare
        k_range = range(max(2, start), min(end + 1, 8))  # Begränsa k för prestanda

        for k in k_range:
            # Testa flera hastighetsuppsättningar
            worst_case_dist = 1.0
            worst_speeds = None
            best_case_dist = 0.0
            best_speeds = None

            for trial in range(min(50, 10 * k)):
                speeds = [0] + sorted(np.random.choice(range(1, 20 * k), size=k - 1, replace=False).tolist())
                is_lonely, min_dist = self._check_lonely(speeds)

                if min_dist < worst_case_dist:
                    worst_case_dist = min_dist
                    worst_speeds = speeds
                if min_dist > best_case_dist:
                    best_case_dist = min_dist
                    best_speeds = speeds

                if not is_lonely:
                    findings.append(ResearchFinding(
                        finding_id=f"lr_counter_{k}_{trial}",
                        problem="lonely_runner",
                        category="counterexample",
                        description=f"k={k}: Löpare 0 uppnår aldrig avstånd ≥ 1/{k} med hastigheter {speeds}",
                        data={"k": k, "speeds": speeds, "max_min_dist": min_dist, "threshold": 1/k},
                        significance=1.0,
                    ))

            if worst_speeds:
                findings.append(ResearchFinding(
                    finding_id=f"lr_worst_{k}",
                    problem="lonely_runner",
                    category="structure",
                    description=f"k={k}: Sämsta fallet ger avstånd {worst_case_dist:.4f} (tröskel 1/{k}={1/k:.4f})",
                    data={"k": k, "worst_dist": worst_case_dist, "worst_speeds": worst_speeds,
                          "best_dist": best_case_dist, "best_speeds": best_speeds, "threshold": 1/k},
                    significance=0.5,
                ))

        return findings

    def test_hypothesis(self, hypothesis: Hypothesis, sample_size: int = 100) -> ExperimentResult:
        t0 = time.time()
        k = np.random.randint(3, 7)
        all_lonely = True

        for _ in range(sample_size):
            speeds = [0] + sorted(np.random.choice(range(1, 30), size=k - 1, replace=False).tolist())
            is_lonely, _ = self._check_lonely(speeds, resolution=5000)
            if not is_lonely:
                all_lonely = False
                break

        hypothesis.tests_run += 1
        if all_lonely:
            hypothesis.tests_passed += 1
        hypothesis.update_confidence()

        return ExperimentResult(
            experiment_id=f"lr_test_{int(time.time())}",
            problem="lonely_runner",
            hypothesis_id=hypothesis.hypothesis_id,
            description=f"Tested {sample_size} random speed sets with k={k}",
            passed=all_lonely,
            data={"k": k, "sample_size": sample_size},
            duration_ms=(time.time() - t0) * 1000,
        )

    def generate_hypotheses(self, findings: list[ResearchFinding]) -> list[Hypothesis]:
        hypotheses = []
        structures = [f for f in findings if f.category == "structure"]

        if structures:
            margins = [(f.data["k"], f.data["worst_dist"] - f.data["threshold"])
                       for f in structures if "worst_dist" in f.data and "threshold" in f.data]
            if margins:
                hypotheses.append(Hypothesis(
                    hypothesis_id=f"lr_h_{int(time.time())}_margin",
                    problem="lonely_runner",
                    statement=f"Marginalen (min avstånd - 1/k) minskar med k men förblir positiv. "
                              f"Observerade marginaler: {[(k, f'{m:.4f}') for k, m in margins[:5]]}",
                    evidence_for=[m for _, m in margins],
                    confidence=0.5,
                    tags=["lonely_runner", "margin", "conjecture_support"],
                ))

        return hypotheses

    def encode_finding(self, finding: ResearchFinding, encoder: MathHDCEncoder) -> torch.Tensor:
        props = {
            "magnitude": finding.data.get("k", 3),
            "magnitude_max": 10,
            "gap": finding.data.get("worst_dist", 0),
            "gap_max": 0.5,
        }
        return encoder.encode_numeric("lonely_runner", props)


# ══════════════════════════════════════════════════════════════════════════════
# Problem 5: Syracuse / Generalized Collatz
# ══════════════════════════════════════════════════════════════════════════════

class SyracuseProblem(ResearchProblem):
    """Generalized Collatz (Syracuse): Utforskar varianter av 3n+1.
    
    Varianter:
    - 3n+1 (standard Collatz)
    - 5n+1 (känt att ha cykler ≠ 1)
    - 3n+d för olika d
    - Mönster i vilka (a, b) i an+b som konvergerar
    """

    name = "syracuse"
    description = "Generalized Collatz: which (a,b) in 'if odd: a*n+b, if even: n/2' always reach 1?"
    millennium_prize = False

    def _run_generalized(self, n: int, a: int, b: int, max_steps: int = 10000) -> tuple[list[int], str]:
        """Kör generaliserad Collatz: odd → a*n+b, even → n/2."""
        seq = [n]
        seen = {n}
        current = n

        for _ in range(max_steps):
            if current == 1:
                return seq, "converged"
            if current % 2 == 0:
                current = current // 2
            else:
                current = a * current + b

            if current in seen:
                seq.append(current)
                return seq, "cycle"
            if current > 10**15:
                return seq, "diverged"

            seen.add(current)
            seq.append(current)

        return seq, "timeout"

    def explore(self, start: int, end: int) -> list[ResearchFinding]:
        findings = []

        # Utforska olika (a, b) kombinationer
        variants = [(3, 1), (5, 1), (3, 3), (3, 5), (5, 3), (7, 1)]

        for a, b in variants:
            converged = 0
            cycled = 0
            diverged = 0
            cycles_found = set()

            test_range = range(max(1, start), min(end + 1, start + 500))
            for n in test_range:
                seq, result = self._run_generalized(n, a, b)
                if result == "converged":
                    converged += 1
                elif result == "cycle":
                    cycled += 1
                    cycle_start = seq[-1]
                    cycles_found.add(cycle_start)
                elif result == "diverged":
                    diverged += 1

            total = len(test_range)
            if total == 0:
                continue

            findings.append(ResearchFinding(
                finding_id=f"sy_{a}n{b}_{start}",
                problem="syracuse",
                category="structure",
                description=f"({a}n+{b}): konvergerar={converged}/{total}, cykler={cycled}, divergerar={diverged}",
                data={"a": a, "b": b, "converged": converged, "cycled": cycled,
                      "diverged": diverged, "total": total, "cycles": list(cycles_found)[:10]},
                significance=0.6 if cycled > 0 or diverged > 0 else 0.3,
            ))

            if cycles_found and (a, b) != (3, 1):
                findings.append(ResearchFinding(
                    finding_id=f"sy_cycle_{a}n{b}_{start}",
                    problem="syracuse",
                    category="pattern",
                    description=f"({a}n+{b}) har cykler som inte når 1. Cykelstarter: {list(cycles_found)[:5]}",
                    data={"a": a, "b": b, "cycle_starts": list(cycles_found)[:20]},
                    significance=0.7,
                ))

        return findings

    def test_hypothesis(self, hypothesis: Hypothesis, sample_size: int = 500) -> ExperimentResult:
        t0 = time.time()
        # Testa standard 3n+1 konvergens
        base = np.random.randint(1, 1_000_000)
        all_converge = True

        for n in range(base, base + sample_size):
            _, result = self._run_generalized(n, 3, 1)
            if result != "converged":
                all_converge = False
                break

        hypothesis.tests_run += 1
        if all_converge:
            hypothesis.tests_passed += 1
        hypothesis.update_confidence()

        return ExperimentResult(
            experiment_id=f"sy_test_{int(time.time())}",
            problem="syracuse",
            hypothesis_id=hypothesis.hypothesis_id,
            description=f"Tested 3n+1 convergence for {sample_size} numbers from {base}",
            passed=all_converge,
            data={"base": base, "sample_size": sample_size},
            duration_ms=(time.time() - t0) * 1000,
        )

    def generate_hypotheses(self, findings: list[ResearchFinding]) -> list[Hypothesis]:
        hypotheses = []
        structures = [f for f in findings if f.category == "structure"]

        converging_variants = []
        cycling_variants = []
        for f in structures:
            a, b = f.data.get("a", 0), f.data.get("b", 0)
            if f.data.get("converged", 0) == f.data.get("total", 0):
                converging_variants.append((a, b))
            elif f.data.get("cycled", 0) > 0:
                cycling_variants.append((a, b))

        if converging_variants:
            hypotheses.append(Hypothesis(
                hypothesis_id=f"sy_h_{int(time.time())}_conv",
                problem="syracuse",
                statement=f"Varianter som alltid konvergerar: {converging_variants}. "
                          f"Gemensam egenskap: a=3 och b udda?",
                evidence_for=converging_variants,
                confidence=0.4,
                tags=["syracuse", "convergence", "variant_classification"],
            ))

        if cycling_variants:
            hypotheses.append(Hypothesis(
                hypothesis_id=f"sy_h_{int(time.time())}_cycle",
                problem="syracuse",
                statement=f"Varianter med cykler: {cycling_variants}. "
                          f"Hypotes: a ≥ 5 garanterar existens av icke-triviala cykler.",
                evidence_for=cycling_variants,
                confidence=0.5,
                tags=["syracuse", "cycles", "variant_classification"],
            ))

        return hypotheses

    def encode_finding(self, finding: ResearchFinding, encoder: MathHDCEncoder) -> torch.Tensor:
        props = {
            "magnitude": finding.data.get("a", 3),
            "magnitude_max": 10,
            "convergence": finding.data.get("converged", 0) / max(finding.data.get("total", 1), 1),
        }
        return encoder.encode_numeric("syracuse", props)


# ══════════════════════════════════════════════════════════════════════════════
# Math Research Engine — Orchestrator
# ══════════════════════════════════════════════════════════════════════════════

class MathResearchEngine:
    """Orkestrerar autonom matematisk forskning.
    
    Väljer problem via AIF surprise, kör experiment, formulerar hypoteser,
    detekterar cross-domain mönster via HDC-similarity, och lagrar allt
    i Ebbinghaus-minnet.
    """

    def __init__(
        self,
        memory: Optional[EbbinghausMemory] = None,
        bridge: Optional[NeuroSymbolicBridge] = None,
        exploration_weight: float = 0.6,
    ):
        # Kognitiva moduler
        self.memory = memory or EbbinghausMemory(
            collection_name="math_research",
            decay_threshold=0.05,
        )
        self.bridge = bridge or NeuroSymbolicBridge(lnn_output_dim=32, hdc_dim=HDC_DIM)
        self.encoder = MathHDCEncoder(dim=HDC_DIM)

        # AIF: 5 problem-observationer + 3 meta-observationer
        self.aif = ActiveInferenceAgent(
            num_observations=8,
            num_states=8,
            num_actions=5,  # Välj bland 5 problem
            preference_obs=[0, 1, 2, 3, 4],  # Föredrar alla anomali-typer
            exploration_weight=exploration_weight,
        )

        # Forskningsproblem
        self.problems: dict[str, ResearchProblem] = {
            "goldbach": GoldbachProblem(),
            "twin_prime": TwinPrimeProblem(),
            "perfect_number": PerfectNumberProblem(),
            "lonely_runner": LonelyRunnerProblem(),
            "syracuse": SyracuseProblem(),
        }

        # State
        self._findings: list[ResearchFinding] = []
        self._hypotheses: list[Hypothesis] = []
        self._experiments: list[ExperimentResult] = []
        self._cross_domain: list[dict] = []
        self._stats = defaultdict(int)
        self._running = False
        self._exploration_counter = defaultdict(int)

    # ── Problem Selection (AIF-driven) ──

    def select_problem(self) -> str:
        """Välj nästa problem att utforska baserat på AIF surprise."""
        # Mappa senaste fynd till observation
        if self._findings:
            last = self._findings[-1]
            problem_map = {"goldbach": 0, "twin_prime": 1, "perfect_number": 2,
                          "lonely_runner": 3, "syracuse": 4}
            obs = problem_map.get(last.problem, 5)
        else:
            obs = 7  # Ingen data ännu

        action = self.aif.step(obs)
        problem_names = list(self.problems.keys())
        selected = problem_names[action % len(problem_names)]

        logger.debug(f"AIF selected problem: {selected} (action={action}, surprise={self.aif.get_surprise():.3f})")
        return selected

    # ── Explore ──

    def explore_problem(self, problem_name: str, start: int = 1, end: int = 10000) -> list[ResearchFinding]:
        """Utforska ett specifikt problem i ett intervall."""
        problem = self.problems.get(problem_name)
        if not problem:
            raise ValueError(f"Unknown problem: {problem_name}")

        findings = problem.explore(start, end)

        for f in findings:
            # Encodera som HDC
            hv = problem.encode_finding(f, self.encoder)
            f.hdc_embedding = hv.numpy().tolist()

            # Lagra i Ebbinghaus
            f.memory_id = self.memory.store(
                embedding=f.hdc_embedding,
                concept=f"math_{f.problem}_{f.category}",
                metadata={
                    "finding_id": f.finding_id,
                    "problem": f.problem,
                    "category": f.category,
                    "description": f.description[:200],
                    "significance": f.significance,
                    "source": "math_research",
                },
            )

            # Lär koncept i bridge
            self.bridge.learn_concept(f"math_{f.problem}", hv)

        self._findings.extend(findings)
        self._stats[f"findings_{problem_name}"] += len(findings)
        self._exploration_counter[problem_name] += 1

        if findings:
            logger.info(f"[{problem_name}] {len(findings)} fynd i [{start}, {end}]")

        return findings

    # ── Hypothesis Management ──

    def generate_hypotheses(self, problem_name: str) -> list[Hypothesis]:
        """Generera hypoteser för ett problem baserat på samlade fynd."""
        problem = self.problems.get(problem_name)
        if not problem:
            return []

        relevant = [f for f in self._findings if f.problem == problem_name]
        hypotheses = problem.generate_hypotheses(relevant)

        self._hypotheses.extend(hypotheses)
        self._stats[f"hypotheses_{problem_name}"] += len(hypotheses)

        for h in hypotheses:
            logger.info(f"[{problem_name}] Hypotes: {h.statement[:100]}...")

        return hypotheses

    def test_hypotheses(self, problem_name: str, sample_size: int = 500) -> list[ExperimentResult]:
        """Testa alla aktiva hypoteser för ett problem."""
        problem = self.problems.get(problem_name)
        if not problem:
            return []

        active = [h for h in self._hypotheses if h.problem == problem_name and h.status == "active"]
        results = []

        for h in active:
            result = problem.test_hypothesis(h, sample_size)
            results.append(result)
            self._experiments.append(result)
            self._stats["experiments_total"] += 1

            logger.info(f"[{problem_name}] Test: {result.description} → {'PASS' if result.passed else 'FAIL'}")

        return results

    # ── Cross-Domain Discovery ──

    def find_cross_domain_patterns(self, threshold: float = 0.3) -> list[dict]:
        """Hitta mönster som spänner över flera problem via HDC-similarity.
        
        Jämför HDC-vektorer från olika problem och rapporterar
        oväntade likheter.
        """
        discoveries = []

        # Gruppera fynd per problem
        by_problem: dict[str, list[ResearchFinding]] = defaultdict(list)
        for f in self._findings:
            if f.hdc_embedding:
                by_problem[f.problem].append(f)

        problems = list(by_problem.keys())
        for i in range(len(problems)):
            for j in range(i + 1, len(problems)):
                p1, p2 = problems[i], problems[j]
                for f1 in by_problem[p1][-10:]:  # Senaste 10 per problem
                    for f2 in by_problem[p2][-10:]:
                        hv1 = torch.tensor(f1.hdc_embedding, dtype=torch.float32)
                        hv2 = torch.tensor(f2.hdc_embedding, dtype=torch.float32)
                        sim = self.encoder.similarity(hv1, hv2)

                        if sim > threshold:
                            discovery = {
                                "type": "cross_domain",
                                "problem_1": p1,
                                "problem_2": p2,
                                "finding_1": f1.finding_id,
                                "finding_2": f2.finding_id,
                                "similarity": sim,
                                "description": f"Likhet ({sim:.3f}) mellan [{p1}] {f1.description[:60]} och [{p2}] {f2.description[:60]}",
                                "timestamp": time.time(),
                            }
                            discoveries.append(discovery)

        self._cross_domain.extend(discoveries)
        self._stats["cross_domain_total"] += len(discoveries)

        if discoveries:
            logger.info(f"Cross-domain: {len(discoveries)} mönster hittade")

        return discoveries

    # ── Full Research Cycle ──

    async def run_research_cycle(
        self,
        iterations: int = 10,
        range_size: int = 5000,
        callback=None,
    ) -> dict:
        """Kör en fullständig forskningscykel.
        
        Varje iteration:
        1. AIF väljer problem
        2. Utforska intervall
        3. Formulera hypoteser
        4. Testa hypoteser
        5. Cross-domain analys
        6. Logga till journal
        """
        self._running = True
        i = -1

        logger.info(f"Starting research cycle: {iterations} iterations")

        for i in range(iterations):
            if not self._running:
                break

            # 1. Välj problem
            problem_name = self.select_problem()
            counter = self._exploration_counter[problem_name]

            # Dynamiskt intervall baserat på hur mycket vi utforskat
            start = counter * range_size + 1
            end = start + range_size - 1

            # 2. Utforska
            findings = self.explore_problem(problem_name, start, end)

            # 3. Formulera hypoteser (var 3:e iteration)
            if (i + 1) % 3 == 0:
                self.generate_hypotheses(problem_name)

            # 4. Testa hypoteser (var 5:e iteration)
            if (i + 1) % 5 == 0:
                self.test_hypotheses(problem_name)

            # 5. Cross-domain (var 5:e iteration)
            if (i + 1) % 5 == 0:
                self.find_cross_domain_patterns()

            # 6. Logga
            self._log_iteration(i, problem_name, findings)

            await asyncio.sleep(0)

            if callback:
                callback(i, self.get_stats())

        self._running = False

        summary = self.get_stats()
        summary["iterations_completed"] = i + 1
        self._log_summary(summary)

        logger.info(f"Research cycle complete: {json.dumps(summary, indent=2, default=str)}")
        return summary

    def stop(self):
        self._running = False

    # ── Logging ──

    def _log_iteration(self, iteration: int, problem: str, findings: list[ResearchFinding]):
        log_file = os.path.join(JOURNAL_DIR, "research_journal.jsonl")
        try:
            entry = {
                "iteration": iteration,
                "problem": problem,
                "findings_count": len(findings),
                "findings": [{"id": f.finding_id, "category": f.category, "description": f.description[:200]} for f in findings[:10]],
                "timestamp": time.time(),
                "surprise": self.aif.get_surprise(),
            }
            with open(log_file, "a", encoding="utf-8") as fh:
                fh.write(json.dumps(entry, ensure_ascii=False) + "\n")
        except Exception as e:
            logger.warning(f"Could not write journal: {e}")

    def _log_summary(self, summary: dict):
        log_file = os.path.join(JOURNAL_DIR, "research_summaries.jsonl")
        try:
            with open(log_file, "a", encoding="utf-8") as fh:
                fh.write(json.dumps(summary, ensure_ascii=False, default=str) + "\n")
        except Exception as e:
            logger.warning(f"Could not write summary: {e}")

    # ── Stats & Export ──

    def get_stats(self) -> dict:
        return {
            "total_findings": len(self._findings),
            "total_hypotheses": len(self._hypotheses),
            "active_hypotheses": sum(1 for h in self._hypotheses if h.status == "active"),
            "supported_hypotheses": sum(1 for h in self._hypotheses if h.status == "supported"),
            "refuted_hypotheses": sum(1 for h in self._hypotheses if h.status == "refuted"),
            "total_experiments": len(self._experiments),
            "cross_domain_patterns": len(self._cross_domain),
            "problems_explored": dict(self._exploration_counter),
            "aif_surprise": self.aif.get_surprise(),
            "memory_stats": self.memory.get_stats(),
            "running": self._running,
            "findings_by_problem": dict(Counter(f.problem for f in self._findings)),
            "findings_by_category": dict(Counter(f.category for f in self._findings)),
        }

    def get_hypotheses(self) -> list[dict]:
        return [
            {
                "id": h.hypothesis_id,
                "problem": h.problem,
                "statement": h.statement,
                "confidence": h.confidence,
                "status": h.status,
                "tests_run": h.tests_run,
                "pass_rate": h.pass_rate,
                "tags": h.tags,
            }
            for h in self._hypotheses
        ]

    def get_findings(self, problem: Optional[str] = None) -> list[dict]:
        findings = self._findings if not problem else [f for f in self._findings if f.problem == problem]
        return [
            {
                "id": f.finding_id,
                "problem": f.problem,
                "category": f.category,
                "description": f.description,
                "significance": f.significance,
                "timestamp": f.timestamp,
            }
            for f in findings[-50:]
        ]

    def get_research_report(self) -> str:
        """Generera en läsbar forskningsrapport."""
        lines = [
            "# Frankenstein AI — Matematisk Forskningsrapport",
            f"Genererad: {time.strftime('%Y-%m-%d %H:%M:%S')}",
            "",
            "## Sammanfattning",
            f"- **Totalt fynd:** {len(self._findings)}",
            f"- **Hypoteser:** {len(self._hypotheses)} (aktiva: {sum(1 for h in self._hypotheses if h.status == 'active')})",
            f"- **Experiment:** {len(self._experiments)}",
            f"- **Cross-domain mönster:** {len(self._cross_domain)}",
            "",
        ]

        for pname, problem in self.problems.items():
            p_findings = [f for f in self._findings if f.problem == pname]
            p_hyps = [h for h in self._hypotheses if h.problem == pname]
            lines.append(f"## {problem.name}: {problem.description}")
            lines.append(f"Fynd: {len(p_findings)}, Hypoteser: {len(p_hyps)}")
            lines.append("")

            for h in p_hyps:
                emoji = {"active": "🔬", "supported": "✅", "refuted": "❌", "inconclusive": "❓"}.get(h.status, "")
                lines.append(f"### {emoji} {h.statement[:120]}")
                lines.append(f"Confidence: {h.confidence:.0%} | Tests: {h.tests_run} | Pass rate: {h.pass_rate:.0%} | Status: {h.status}")
                lines.append("")

        if self._cross_domain:
            lines.append("## Cross-Domain Mönster")
            for cd in self._cross_domain[:10]:
                lines.append(f"- {cd['description']}")
            lines.append("")

        return "\n".join(lines)


# ── Convenience ──

def run_quick_research(iterations: int = 5) -> dict:
    """Snabb synkron forskningskörning."""
    engine = MathResearchEngine()
    for i in range(iterations):
        problem = engine.select_problem()
        counter = engine._exploration_counter[problem]
        start = counter * 2000 + 1
        end = start + 1999
        findings = engine.explore_problem(problem, start, end)
        if findings:
            engine.generate_hypotheses(problem)
        if (i + 1) % 3 == 0:
            engine.test_hypotheses(problem)
    engine.find_cross_domain_patterns()
    return {
        "stats": engine.get_stats(),
        "hypotheses": engine.get_hypotheses(),
        "report": engine.get_research_report(),
    }


if __name__ == "__main__":
    print("=== Frankenstein AI — Math Research Engine Demo ===\n")
    result = run_quick_research(iterations=8)
    print(result["report"])
    print(f"\nStatistik: {json.dumps(result['stats'], indent=2, default=str)}")
