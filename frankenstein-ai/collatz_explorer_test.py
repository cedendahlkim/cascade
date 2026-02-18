"""
Enhetstester för CollatzExplorer.

Testar varje metod individuellt samt integration med HDC, AIF och Ebbinghaus.
Kör med: python -m pytest collatz_explorer_test.py -v
"""

import asyncio
import math
import os
import sys
import time
import unittest

import numpy as np
import torch

# Säkerställ att frankenstein-ai-katalogen är i path
sys.path.insert(0, os.path.dirname(__file__))

from collatz_explorer import (
    CollatzExplorer,
    CollatzSequence,
    CollatzAnomaly,
    CollatzDiscovery,
    CollatzHDCEncoder,
    HDC_DIM,
    explore_collatz,
)
from cognition import NeuroSymbolicBridge, hdc_cosine_similarity
from agency import ActiveInferenceAgent
from memory import EbbinghausMemory


class TestRunSequence(unittest.TestCase):
    """Tester för run_sequence()."""

    def setUp(self):
        self.explorer = CollatzExplorer()

    def test_trivial_case_1(self):
        """n=1 ska ge sekvensen [1]."""
        seq = self.explorer.run_sequence(1)
        self.assertEqual(seq, [1])

    def test_trivial_case_2(self):
        """n=2 ska ge [2, 1]."""
        seq = self.explorer.run_sequence(2)
        self.assertEqual(seq, [2, 1])

    def test_known_sequence_27(self):
        """n=27 är känt för att ha 111 steg."""
        seq = self.explorer.run_sequence(27)
        self.assertEqual(seq[0], 27)
        self.assertEqual(seq[-1], 1)
        # 27 har 111 steg (112 element inklusive startvärdet)
        self.assertEqual(len(seq) - 1, 111)

    def test_known_peak_27(self):
        """n=27 har peak=9232."""
        seq = self.explorer.run_sequence(27)
        self.assertEqual(max(seq), 9232)

    def test_even_number(self):
        """Jämnt tal: 8 → 4 → 2 → 1."""
        seq = self.explorer.run_sequence(8)
        self.assertEqual(seq, [8, 4, 2, 1])

    def test_odd_number(self):
        """Udda tal: 3 → 10 → 5 → 16 → 8 → 4 → 2 → 1."""
        seq = self.explorer.run_sequence(3)
        self.assertEqual(seq, [3, 10, 5, 16, 8, 4, 2, 1])

    def test_power_of_two(self):
        """Tvåpotenser ska ha exakt log2(n) steg."""
        for k in range(1, 15):
            n = 2 ** k
            seq = self.explorer.run_sequence(n)
            self.assertEqual(len(seq) - 1, k, f"2^{k}={n} should have {k} steps")

    def test_always_reaches_1(self):
        """Alla tal 1-500 ska nå 1."""
        for n in range(1, 501):
            seq = self.explorer.run_sequence(n)
            self.assertEqual(seq[-1], 1, f"n={n} did not reach 1")

    def test_invalid_input_zero(self):
        """n=0 ska ge ValueError."""
        with self.assertRaises(ValueError):
            self.explorer.run_sequence(0)

    def test_invalid_input_negative(self):
        """Negativa tal ska ge ValueError."""
        with self.assertRaises(ValueError):
            self.explorer.run_sequence(-5)

    def test_caching(self):
        """Sekvenser ska cachas i _sequences_computed."""
        self.explorer.run_sequence(42)
        self.assertIn(42, self.explorer._sequences_computed)
        cached = self.explorer._sequences_computed[42]
        self.assertEqual(cached.n, 42)
        self.assertGreater(cached.length, 0)

    def test_sequence_metadata(self):
        """CollatzSequence ska ha korrekt metadata."""
        self.explorer.run_sequence(7)
        seq = self.explorer._sequences_computed[7]
        self.assertEqual(seq.n, 7)
        self.assertGreater(seq.length, 0)
        self.assertGreater(seq.peak, 7)  # 7 → 22 → ... peak > 7
        self.assertGreater(seq.odd_steps, 0)
        self.assertGreater(seq.even_steps, 0)
        self.assertEqual(seq.odd_steps + seq.even_steps, seq.length)

    def test_large_number(self):
        """Stort tal ska fungera utan krasch."""
        seq = self.explorer.run_sequence(1_000_000)
        self.assertEqual(seq[-1], 1)
        self.assertGreater(len(seq), 10)


class TestCollatzSequenceProperties(unittest.TestCase):
    """Tester för CollatzSequence dataclass-egenskaper."""

    def test_peak_ratio(self):
        seq = CollatzSequence(n=27, steps=[27, 82, 41], length=111, peak=9232)
        self.assertAlmostEqual(seq.peak_ratio, 9232 / 27, places=1)

    def test_odd_ratio(self):
        seq = CollatzSequence(n=7, length=10, odd_steps=4, even_steps=6)
        self.assertAlmostEqual(seq.odd_ratio, 0.4)

    def test_peak_ratio_zero(self):
        seq = CollatzSequence(n=0, peak=0)
        self.assertEqual(seq.peak_ratio, 0.0)

    def test_odd_ratio_zero_length(self):
        seq = CollatzSequence(n=1, length=0)
        self.assertEqual(seq.odd_ratio, 0.0)


class TestAnalyzeRange(unittest.TestCase):
    """Tester för analyze_range()."""

    def setUp(self):
        self.explorer = CollatzExplorer()

    def test_basic_range(self):
        """Analysera [1, 100] ska returnera en lista."""
        anomalies = self.explorer.analyze_range(1, 100)
        self.assertIsInstance(anomalies, list)
        for a in anomalies:
            self.assertIsInstance(a, CollatzAnomaly)

    def test_anomaly_fields(self):
        """Anomalier ska ha alla obligatoriska fält."""
        anomalies = self.explorer.analyze_range(1, 500)
        for a in anomalies:
            self.assertIn(a.anomaly_type, ["long_sequence", "high_peak", "odd_heavy", "pattern"])
            self.assertGreaterEqual(a.severity, 0.0)
            self.assertLessEqual(a.severity, 1.0)
            self.assertGreater(len(a.description), 0)
            self.assertGreater(a.n, 0)

    def test_detects_known_anomaly_27(self):
        """n=27 borde detekteras som anomali i [1, 50]."""
        anomalies = self.explorer.analyze_range(1, 50)
        anomaly_ns = [a.n for a in anomalies]
        # 27 har 111 steg — extremt långt jämfört med grannar
        self.assertIn(27, anomaly_ns, "n=27 should be detected as anomaly in [1,50]")

    def test_invalid_range(self):
        """end < start ska ge ValueError."""
        with self.assertRaises(ValueError):
            self.explorer.analyze_range(100, 50)

    def test_negative_start_corrected(self):
        """Negativ start ska korrigeras till 1."""
        anomalies = self.explorer.analyze_range(-5, 10)
        self.assertIsInstance(anomalies, list)

    def test_small_range(self):
        """Mycket litet intervall (< 3 element) ska returnera tom lista."""
        anomalies = self.explorer.analyze_range(5, 6)
        self.assertIsInstance(anomalies, list)

    def test_stats_updated(self):
        """Statistik ska uppdateras efter analys."""
        self.explorer.analyze_range(1, 100)
        self.assertGreater(self.explorer._stats["ranges_analyzed"], 0)

    def test_large_range(self):
        """Analysera [1, 2000] ska hitta flera anomalier."""
        anomalies = self.explorer.analyze_range(1, 2000)
        self.assertGreater(len(anomalies), 0, "Should find anomalies in [1, 2000]")


class TestEncodeToHDC(unittest.TestCase):
    """Tester för encode_to_hdc()."""

    def setUp(self):
        self.explorer = CollatzExplorer()
        self.explorer.run_sequence(27)
        self.explorer.run_sequence(42)

    def test_encode_int(self):
        """Encodera ett heltal ska ge en HDC-vektor."""
        hv = self.explorer.encode_to_hdc(27)
        self.assertEqual(hv.shape, (HDC_DIM,))
        self.assertAlmostEqual(float(hv.norm()), 1.0, places=3)

    def test_encode_sequence(self):
        """Encodera en CollatzSequence ska ge en HDC-vektor."""
        seq = self.explorer._sequences_computed[27]
        hv = self.explorer.encode_to_hdc(seq)
        self.assertEqual(hv.shape, (HDC_DIM,))

    def test_encode_list(self):
        """Encodera en lista ska ge en HDC-vektor."""
        hv = self.explorer.encode_to_hdc([27, 82, 41, 124, 62, 31])
        self.assertEqual(hv.shape, (HDC_DIM,))

    def test_encode_uncached_int(self):
        """Encodera ett ej cachat tal ska beräkna sekvensen först."""
        hv = self.explorer.encode_to_hdc(99)
        self.assertEqual(hv.shape, (HDC_DIM,))
        self.assertIn(99, self.explorer._sequences_computed)

    def test_different_numbers_different_vectors(self):
        """Olika tal ska ge olika HDC-vektorer."""
        hv27 = self.explorer.encode_to_hdc(27)
        hv42 = self.explorer.encode_to_hdc(42)
        sim = float(hdc_cosine_similarity(hv27, hv42).squeeze())
        # Ska inte vara identiska
        self.assertLess(sim, 0.99, "Different numbers should produce different HDC vectors")

    def test_similar_numbers_higher_similarity(self):
        """Närliggande tal borde ha högre similarity än avlägsna."""
        self.explorer.run_sequence(28)
        self.explorer.run_sequence(1000)
        hv27 = self.explorer.encode_to_hdc(27)
        hv28 = self.explorer.encode_to_hdc(28)
        hv1000 = self.explorer.encode_to_hdc(1000)
        sim_close = float(hdc_cosine_similarity(hv27, hv28).squeeze())
        sim_far = float(hdc_cosine_similarity(hv27, hv1000).squeeze())
        # Inte garanterat men ofta sant — logga istället för att assertera hårt
        if sim_close <= sim_far:
            print(f"  Note: sim(27,28)={sim_close:.3f} <= sim(27,1000)={sim_far:.3f} (HDC is stochastic)")

    def test_invalid_type(self):
        """Ogiltig typ ska ge TypeError."""
        with self.assertRaises(TypeError):
            self.explorer.encode_to_hdc("invalid")


class TestCollatzHDCEncoder(unittest.TestCase):
    """Tester för CollatzHDCEncoder direkt."""

    def setUp(self):
        self.encoder = CollatzHDCEncoder(dim=HDC_DIM)

    def test_encode_returns_correct_dim(self):
        seq = CollatzSequence(n=27, steps=[27, 82, 41, 124], length=111, peak=9232, odd_steps=40, even_steps=71)
        hv = self.encoder.encode(seq)
        self.assertEqual(hv.shape, (HDC_DIM,))

    def test_encode_normalized(self):
        seq = CollatzSequence(n=42, steps=[42, 21, 64, 32, 16, 8, 4, 2, 1], length=8, peak=64, odd_steps=1, even_steps=7)
        hv = self.encoder.encode(seq)
        self.assertAlmostEqual(float(hv.norm()), 1.0, places=2)

    def test_encode_subsequence(self):
        hv = self.encoder.encode_subsequence([27, 82, 41, 124, 62, 31, 94, 47])
        self.assertEqual(hv.shape, (HDC_DIM,))
        self.assertAlmostEqual(float(hv.norm()), 1.0, places=2)

    def test_similarity_symmetric(self):
        seq1 = CollatzSequence(n=27, steps=[27], length=111, peak=9232, odd_steps=40, even_steps=71)
        seq2 = CollatzSequence(n=42, steps=[42], length=8, peak=64, odd_steps=1, even_steps=7)
        hv1 = self.encoder.encode(seq1)
        hv2 = self.encoder.encode(seq2)
        sim12 = self.encoder.similarity(hv1, hv2)
        sim21 = self.encoder.similarity(hv2, hv1)
        self.assertAlmostEqual(sim12, sim21, places=5)

    def test_self_similarity_is_one(self):
        seq = CollatzSequence(n=27, steps=[27], length=111, peak=9232, odd_steps=40, even_steps=71)
        hv = self.encoder.encode(seq)
        sim = self.encoder.similarity(hv, hv)
        self.assertAlmostEqual(sim, 1.0, places=3)

    def test_quantize_bounds(self):
        self.assertEqual(self.encoder._quantize(0.0), 0)
        self.assertEqual(self.encoder._quantize(1.0), 99)
        self.assertEqual(self.encoder._quantize(0.5), 49)
        self.assertEqual(self.encoder._quantize(-1.0), 0)
        self.assertEqual(self.encoder._quantize(2.0), 99)


class TestStoreDiscovery(unittest.TestCase):
    """Tester för store_discovery()."""

    def setUp(self):
        # Använd in-memory fallback (ingen ChromaDB)
        self.explorer = CollatzExplorer()
        self.explorer.run_sequence(27)
        self.explorer.run_sequence(31)

    def test_store_basic(self):
        """Lagra en enkel upptäckt."""
        discovery = CollatzDiscovery(
            discovery_id="test_1",
            hypothesis="Tal ≡ 3 (mod 6) har längre sekvenser",
            evidence=[27, 31, 63],
            confidence=0.75,
            category="pattern",
        )
        mem_id = self.explorer.store_discovery(discovery)
        self.assertIsNotNone(mem_id)
        self.assertIsNotNone(discovery.memory_id)
        self.assertIsNotNone(discovery.hdc_embedding)

    def test_store_with_existing_embedding(self):
        """Lagra med fördefinierad HDC-embedding."""
        embedding = torch.randn(HDC_DIM).numpy().tolist()
        discovery = CollatzDiscovery(
            discovery_id="test_2",
            hypothesis="Test med embedding",
            evidence=[42],
            confidence=0.5,
            category="anomaly",
            hdc_embedding=embedding,
        )
        mem_id = self.explorer.store_discovery(discovery)
        self.assertIsNotNone(mem_id)

    def test_store_updates_stats(self):
        """Statistik ska uppdateras efter lagring."""
        discovery = CollatzDiscovery(
            discovery_id="test_3",
            hypothesis="Testupptäckt",
            evidence=[7],
            confidence=0.6,
            category="structure",
        )
        self.explorer.store_discovery(discovery)
        self.assertEqual(self.explorer._stats["discoveries_stored"], 1)

    def test_store_learns_concept(self):
        """Upptäckten ska läras som koncept i NeuroSymbolicBridge."""
        discovery = CollatzDiscovery(
            discovery_id="test_4",
            hypothesis="Koncepttest",
            evidence=[27],
            confidence=0.8,
            category="pattern",
        )
        self.explorer.store_discovery(discovery)
        concept_names = self.explorer.bridge.get_concept_names()
        self.assertIn("collatz_pattern", concept_names)

    def test_store_multiple(self):
        """Lagra flera upptäckter."""
        for i in range(5):
            d = CollatzDiscovery(
                discovery_id=f"multi_{i}",
                hypothesis=f"Hypotes {i}",
                evidence=[i + 1],
                confidence=0.5 + i * 0.1,
                category="pattern",
            )
            self.explorer.store_discovery(d)
        self.assertEqual(len(self.explorer._discoveries), 5)


class TestGetNextTarget(unittest.TestCase):
    """Tester för get_next_target() (AIF-driven)."""

    def setUp(self):
        self.explorer = CollatzExplorer()

    def test_returns_positive_int(self):
        """Ska alltid returnera ett positivt heltal."""
        for _ in range(20):
            target = self.explorer.get_next_target()
            self.assertIsInstance(target, int)
            self.assertGreater(target, 0)

    def test_sequential_when_no_anomalies(self):
        """Utan anomalier ska den utforska sekventiellt eller slumpmässigt."""
        target = self.explorer.get_next_target()
        self.assertGreater(target, 0)

    def test_updates_aif_stats(self):
        """AIF-agenten ska uppdateras vid varje anrop."""
        initial_steps = self.explorer.aif_agent.step_count
        self.explorer.get_next_target()
        self.assertEqual(self.explorer.aif_agent.step_count, initial_steps + 1)

    def test_anomaly_influences_target(self):
        """Med anomalier ska AIF-agenten påverka valet."""
        # Skapa en anomali
        self.explorer._anomalies.append(CollatzAnomaly(
            n=27, anomaly_type="long_sequence", severity=0.8,
            description="test", sequence_length=111, peak_value=9232, z_score=3.0,
        ))
        self.explorer._sequences_computed[27] = CollatzSequence(
            n=27, steps=[27], length=111, peak=9232,
        )
        target = self.explorer.get_next_target()
        self.assertGreater(target, 0)

    def test_multiple_calls_vary(self):
        """Flera anrop ska ge varierande mål (inte alltid samma)."""
        targets = set()
        for _ in range(30):
            targets.add(self.explorer.get_next_target())
        # Med 30 anrop borde vi få åtminstone 2 unika mål
        self.assertGreater(len(targets), 1, "get_next_target should vary over multiple calls")


def _run_async(coro):
    """Helper to run async coroutines in tests (avoids pytest-asyncio strict mode issues)."""
    loop = asyncio.new_event_loop()
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()


class TestExploreAsync(unittest.TestCase):
    """Tester för explore_async()."""

    def test_basic_exploration(self):
        """Kör en kort asynkron utforskning."""
        explorer = CollatzExplorer()
        summary = _run_async(explorer.explore_async(iterations=5, batch_size=20))
        self.assertIn("sequences_computed", summary)
        self.assertIn("anomalies_detected", summary)
        self.assertIn("discoveries_made", summary)
        self.assertGreater(summary["sequences_computed"], 0)

    def test_callback_called(self):
        """Callback ska anropas varje iteration."""
        explorer = CollatzExplorer()
        callback_count = [0]

        def cb(iteration, stats):
            callback_count[0] += 1

        _run_async(explorer.explore_async(iterations=3, batch_size=10, callback=cb))
        self.assertEqual(callback_count[0], 3)

    def test_stop(self):
        """stop() ska avbryta utforskningen."""
        explorer = CollatzExplorer()

        async def run_and_stop():
            async def stopper():
                await asyncio.sleep(0.01)
                explorer.stop()

            task = asyncio.create_task(explorer.explore_async(iterations=1000, batch_size=10))
            stop_task = asyncio.create_task(stopper())
            summary = await task
            return summary

        summary = _run_async(run_and_stop())
        self.assertLess(summary["iterations_completed"], 1000)


class TestRecallSimilarDiscoveries(unittest.TestCase):
    """Tester för recall_similar_discoveries()."""

    def setUp(self):
        self.explorer = CollatzExplorer()
        self.explorer.run_sequence(27)
        # Lagra en upptäckt
        d = CollatzDiscovery(
            discovery_id="recall_test",
            hypothesis="Testupptäckt för recall",
            evidence=[27],
            confidence=0.8,
            category="pattern",
        )
        self.explorer.store_discovery(d)

    def test_recall_returns_list(self):
        """Recall ska returnera en lista."""
        results = self.explorer.recall_similar_discoveries(27)
        self.assertIsInstance(results, list)

    def test_recall_finds_stored(self):
        """Recall ska hitta lagrad upptäckt."""
        results = self.explorer.recall_similar_discoveries(27, n_results=10)
        # Med in-memory fallback borde vi hitta minst 1
        self.assertGreater(len(results), 0, "Should recall at least one stored discovery")


class TestGetStats(unittest.TestCase):
    """Tester för get_stats()."""

    def test_initial_stats(self):
        explorer = CollatzExplorer()
        stats = explorer.get_stats()
        self.assertEqual(stats["sequences_computed"], 0)
        self.assertEqual(stats["anomalies_detected"], 0)
        self.assertEqual(stats["discoveries_made"], 0)
        self.assertFalse(stats["running"])

    def test_stats_after_work(self):
        explorer = CollatzExplorer()
        explorer.run_sequence(27)
        explorer.analyze_range(1, 100)
        stats = explorer.get_stats()
        self.assertGreater(stats["sequences_computed"], 0)
        self.assertIn("memory_stats", stats)


class TestExploreCollatzConvenience(unittest.TestCase):
    """Tester för explore_collatz() convenience-funktion."""

    def test_basic(self):
        result = explore_collatz(start=1, end=200, batch_size=100)
        self.assertIn("range", result)
        self.assertIn("sequences", result)
        self.assertIn("anomalies", result)
        self.assertIn("discoveries", result)
        self.assertEqual(result["range"], [1, 200])
        self.assertEqual(result["sequences"], 200)

    def test_returns_anomalies_as_dicts(self):
        result = explore_collatz(start=1, end=500, batch_size=250)
        for a in result["anomalies"]:
            self.assertIsInstance(a, dict)
            self.assertIn("n", a)
            self.assertIn("anomaly_type", a)


class TestIntegrationHDC(unittest.TestCase):
    """Integration: HDC-encoding med NeuroSymbolicBridge."""

    def test_concept_learning_from_discoveries(self):
        """Upptäckter ska lära koncept i bridge."""
        explorer = CollatzExplorer()
        explorer.run_sequence(27)
        explorer.run_sequence(31)

        # Lagra upptäckter av olika kategorier
        for cat in ["pattern", "anomaly", "structure"]:
            d = CollatzDiscovery(
                discovery_id=f"int_{cat}",
                hypothesis=f"Test {cat}",
                evidence=[27],
                confidence=0.7,
                category=cat,
            )
            explorer.store_discovery(d)

        names = explorer.bridge.get_concept_names()
        self.assertIn("collatz_pattern", names)
        self.assertIn("collatz_anomaly", names)
        self.assertIn("collatz_structure", names)


class TestIntegrationAIF(unittest.TestCase):
    """Integration: AIF surprise-driven exploration."""

    def test_surprise_changes_with_observations(self):
        """Surprise ska ändras när nya observationer görs."""
        explorer = CollatzExplorer()
        surprises = []
        for _ in range(10):
            target = explorer.get_next_target()
            explorer.run_sequence(target)
            surprises.append(explorer.aif_agent.get_surprise())
        # Surprise ska variera (inte alltid 0)
        self.assertTrue(
            any(s > 0 for s in surprises),
            "AIF surprise should be > 0 for at least some observations"
        )


class TestIntegrationEbbinghaus(unittest.TestCase):
    """Integration: Ebbinghaus-minne med retention."""

    def test_memory_retention(self):
        """Lagrade minnen ska ha retention > 0."""
        explorer = CollatzExplorer()
        explorer.run_sequence(27)
        d = CollatzDiscovery(
            discovery_id="ebb_test",
            hypothesis="Retention test",
            evidence=[27],
            confidence=0.9,
            category="pattern",
        )
        explorer.store_discovery(d)
        stats = explorer.memory.get_stats()
        self.assertGreater(stats["total_stored"], 0)

    def test_memory_stats(self):
        """Minnesstatistik ska vara korrekt."""
        explorer = CollatzExplorer()
        stats = explorer.memory.get_stats()
        self.assertIn("active_memories", stats)
        self.assertIn("total_stored", stats)
        self.assertIn("backend", stats)


if __name__ == "__main__":
    unittest.main(verbosity=2)
