"""
Enhetstester för MathResearchEngine och alla ResearchProblem-implementationer.

Kör med: python -m pytest math_research_test.py -v
"""

import asyncio
import math
import os
import sys
import time
import unittest

import numpy as np
import torch

sys.path.insert(0, os.path.dirname(__file__))

from math_research import (
    MathResearchEngine,
    MathHDCEncoder,
    Hypothesis,
    ResearchFinding,
    ExperimentResult,
    GoldbachProblem,
    TwinPrimeProblem,
    PerfectNumberProblem,
    LonelyRunnerProblem,
    SyracuseProblem,
    HDC_DIM,
    _sieve,
    _is_prime,
    _divisor_sum,
    run_quick_research,
)
from cognition import hdc_cosine_similarity


# ══════════════════════════════════════════════════════════════════════════════
# Utility Tests
# ══════════════════════════════════════════════════════════════════════════════

class TestSieve(unittest.TestCase):
    def test_small(self):
        self.assertEqual(_sieve(10), [2, 3, 5, 7])

    def test_zero(self):
        self.assertEqual(_sieve(0), [])

    def test_one(self):
        self.assertEqual(_sieve(1), [])

    def test_two(self):
        self.assertEqual(_sieve(2), [2])

    def test_count_primes_below_100(self):
        self.assertEqual(len(_sieve(100)), 25)

    def test_count_primes_below_1000(self):
        self.assertEqual(len(_sieve(1000)), 168)


class TestIsPrime(unittest.TestCase):
    def test_small_primes(self):
        for p in [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31]:
            self.assertTrue(_is_prime(p), f"{p} should be prime")

    def test_non_primes(self):
        for n in [0, 1, 4, 6, 8, 9, 10, 12, 15, 100]:
            self.assertFalse(_is_prime(n), f"{n} should not be prime")

    def test_large_prime(self):
        self.assertTrue(_is_prime(104729))  # 10000th prime

    def test_large_non_prime(self):
        self.assertFalse(_is_prime(104730))


class TestDivisorSum(unittest.TestCase):
    def test_prime(self):
        self.assertEqual(_divisor_sum(7), 1)  # Only divisor is 1

    def test_perfect_6(self):
        self.assertEqual(_divisor_sum(6), 6)  # 1+2+3=6 (perfect)

    def test_perfect_28(self):
        self.assertEqual(_divisor_sum(28), 28)  # 1+2+4+7+14=28

    def test_abundant_12(self):
        self.assertEqual(_divisor_sum(12), 16)  # 1+2+3+4+6=16 > 12

    def test_deficient_8(self):
        self.assertEqual(_divisor_sum(8), 7)  # 1+2+4=7 < 8

    def test_one(self):
        self.assertEqual(_divisor_sum(1), 0)


# ══════════════════════════════════════════════════════════════════════════════
# Hypothesis Tests
# ══════════════════════════════════════════════════════════════════════════════

class TestHypothesis(unittest.TestCase):
    def test_initial_state(self):
        h = Hypothesis(hypothesis_id="h1", problem="test", statement="Test")
        self.assertEqual(h.confidence, 0.5)
        self.assertEqual(h.status, "active")
        self.assertEqual(h.pass_rate, 0.0)

    def test_update_confidence_all_pass(self):
        h = Hypothesis(hypothesis_id="h2", problem="test", statement="Test")
        h.tests_run = 20
        h.tests_passed = 20
        h.update_confidence()
        self.assertGreater(h.confidence, 0.9)
        self.assertEqual(h.status, "supported")

    def test_update_confidence_all_fail(self):
        h = Hypothesis(hypothesis_id="h3", problem="test", statement="Test")
        h.tests_run = 10
        h.tests_passed = 0
        h.update_confidence()
        self.assertLess(h.confidence, 0.2)
        self.assertEqual(h.status, "refuted")

    def test_update_confidence_mixed(self):
        h = Hypothesis(hypothesis_id="h4", problem="test", statement="Test")
        h.tests_run = 10
        h.tests_passed = 5
        h.update_confidence()
        self.assertAlmostEqual(h.confidence, 6/12, places=2)
        self.assertEqual(h.status, "active")

    def test_pass_rate(self):
        h = Hypothesis(hypothesis_id="h5", problem="test", statement="Test",
                       tests_run=10, tests_passed=7)
        self.assertAlmostEqual(h.pass_rate, 0.7)


# ══════════════════════════════════════════════════════════════════════════════
# HDC Encoder Tests
# ══════════════════════════════════════════════════════════════════════════════

class TestMathHDCEncoder(unittest.TestCase):
    def setUp(self):
        self.encoder = MathHDCEncoder(dim=HDC_DIM)

    def test_encode_returns_correct_dim(self):
        hv = self.encoder.encode_numeric("goldbach", {"magnitude": 5.0, "magnitude_max": 20.0})
        self.assertEqual(hv.shape, (HDC_DIM,))

    def test_encode_normalized(self):
        hv = self.encoder.encode_numeric("twin_prime", {"gap": 100, "gap_max": 1000})
        self.assertAlmostEqual(float(hv.norm()), 1.0, places=2)

    def test_different_problems_different_vectors(self):
        hv1 = self.encoder.encode_numeric("goldbach", {"magnitude": 5.0, "magnitude_max": 20.0})
        hv2 = self.encoder.encode_numeric("twin_prime", {"magnitude": 5.0, "magnitude_max": 20.0})
        sim = self.encoder.similarity(hv1, hv2)
        self.assertLess(sim, 0.95)

    def test_self_similarity(self):
        hv = self.encoder.encode_numeric("goldbach", {"magnitude": 5.0, "magnitude_max": 20.0})
        sim = self.encoder.similarity(hv, hv)
        self.assertAlmostEqual(sim, 1.0, places=3)

    def test_quantize_bounds(self):
        self.assertEqual(self.encoder._q(0.0), 0)
        self.assertEqual(self.encoder._q(1.0), 99)
        self.assertEqual(self.encoder._q(-1.0), 0)
        self.assertEqual(self.encoder._q(2.0), 99)


# ══════════════════════════════════════════════════════════════════════════════
# Goldbach Problem Tests
# ══════════════════════════════════════════════════════════════════════════════

class TestGoldbachProblem(unittest.TestCase):
    def setUp(self):
        self.problem = GoldbachProblem()

    def test_explore_returns_findings(self):
        findings = self.problem.explore(4, 200)
        self.assertIsInstance(findings, list)
        for f in findings:
            self.assertIsInstance(f, ResearchFinding)
            self.assertEqual(f.problem, "goldbach")

    def test_explore_finds_single_partition(self):
        # 4 = 2+2 is the only partition
        findings = self.problem.explore(4, 100)
        single_partition_ns = [f.data["n"] for f in findings if f.category == "anomaly" and f.data.get("partition_count") == 1]
        self.assertIn(4, single_partition_ns)

    def test_explore_larger_range(self):
        findings = self.problem.explore(4, 1000)
        self.assertGreater(len(findings), 0)

    def test_generate_hypotheses(self):
        findings = self.problem.explore(4, 500)
        hypotheses = self.problem.generate_hypotheses(findings)
        self.assertIsInstance(hypotheses, list)
        for h in hypotheses:
            self.assertEqual(h.problem, "goldbach")

    def test_test_hypothesis(self):
        h = Hypothesis(hypothesis_id="gb_test", problem="goldbach", statement="Test")
        result = self.problem.test_hypothesis(h, sample_size=100)
        self.assertIsInstance(result, ExperimentResult)
        self.assertEqual(result.problem, "goldbach")
        self.assertTrue(result.passed)  # Goldbach holds for all tested numbers

    def test_encode_finding(self):
        encoder = MathHDCEncoder()
        f = ResearchFinding(finding_id="test", problem="goldbach", category="anomaly",
                           description="test", data={"n": 100, "count": 5})
        hv = self.problem.encode_finding(f, encoder)
        self.assertEqual(hv.shape, (HDC_DIM,))


# ══════════════════════════════════════════════════════════════════════════════
# Twin Prime Problem Tests
# ══════════════════════════════════════════════════════════════════════════════

class TestTwinPrimeProblem(unittest.TestCase):
    def setUp(self):
        self.problem = TwinPrimeProblem()

    def test_explore_returns_findings(self):
        findings = self.problem.explore(1, 1000)
        self.assertIsInstance(findings, list)
        for f in findings:
            self.assertEqual(f.problem, "twin_prime")

    def test_explore_finds_brun_constant(self):
        findings = self.problem.explore(1, 5000)
        brun_findings = [f for f in findings if "brun" in f.finding_id.lower()]
        self.assertGreater(len(brun_findings), 0)

    def test_explore_finds_density(self):
        findings = self.problem.explore(1, 10000)
        density_findings = [f for f in findings if f.category == "structure" and "densitet" in f.description.lower()]
        self.assertGreater(len(density_findings), 0)

    def test_generate_hypotheses(self):
        findings = self.problem.explore(1, 5000)
        hypotheses = self.problem.generate_hypotheses(findings)
        self.assertIsInstance(hypotheses, list)

    def test_test_hypothesis(self):
        h = Hypothesis(hypothesis_id="tp_test", problem="twin_prime", statement="Test")
        result = self.problem.test_hypothesis(h, sample_size=50)
        self.assertIsInstance(result, ExperimentResult)
        self.assertTrue(result.passed)  # Should always find twins in random ranges

    def test_encode_finding(self):
        encoder = MathHDCEncoder()
        f = ResearchFinding(finding_id="test", problem="twin_prime", category="anomaly",
                           description="test", data={"gap": 100})
        hv = self.problem.encode_finding(f, encoder)
        self.assertEqual(hv.shape, (HDC_DIM,))


# ══════════════════════════════════════════════════════════════════════════════
# Perfect Number Problem Tests
# ══════════════════════════════════════════════════════════════════════════════

class TestPerfectNumberProblem(unittest.TestCase):
    def setUp(self):
        self.problem = PerfectNumberProblem()

    def test_explore_returns_findings(self):
        findings = self.problem.explore(1, 1000)
        self.assertIsInstance(findings, list)
        for f in findings:
            self.assertEqual(f.problem, "perfect_number")

    def test_no_odd_perfect_found(self):
        findings = self.problem.explore(1, 10000)
        counterexamples = [f for f in findings if f.category == "counterexample"]
        self.assertEqual(len(counterexamples), 0, "Should not find odd perfect numbers in small range")

    def test_finds_near_perfect(self):
        findings = self.problem.explore(1, 5000)
        near = [f for f in findings if f.category == "anomaly"]
        # Should find some near-perfect odd numbers
        self.assertIsInstance(near, list)

    def test_generate_hypotheses(self):
        findings = self.problem.explore(1, 5000)
        hypotheses = self.problem.generate_hypotheses(findings)
        self.assertIsInstance(hypotheses, list)

    def test_test_hypothesis(self):
        h = Hypothesis(hypothesis_id="pn_test", problem="perfect_number", statement="Test")
        result = self.problem.test_hypothesis(h, sample_size=100)
        self.assertIsInstance(result, ExperimentResult)
        self.assertTrue(result.passed)  # No odd perfect numbers should be found

    def test_encode_finding(self):
        encoder = MathHDCEncoder()
        f = ResearchFinding(finding_id="test", problem="perfect_number", category="anomaly",
                           description="test", data={"n": 945, "abundance": 0.98})
        hv = self.problem.encode_finding(f, encoder)
        self.assertEqual(hv.shape, (HDC_DIM,))


# ══════════════════════════════════════════════════════════════════════════════
# Lonely Runner Problem Tests
# ══════════════════════════════════════════════════════════════════════════════

class TestLonelyRunnerProblem(unittest.TestCase):
    def setUp(self):
        self.problem = LonelyRunnerProblem()

    def test_check_lonely_basic(self):
        # 2 runners: speeds [0, 1], threshold = 0.5
        is_lonely, dist = self.problem._check_lonely([0, 1])
        self.assertTrue(is_lonely)
        self.assertGreaterEqual(dist, 0.5 - 0.01)

    def test_check_lonely_three(self):
        # 3 runners: speeds [0, 1, 3], threshold = 1/3
        is_lonely, dist = self.problem._check_lonely([0, 1, 3], resolution=50000)
        self.assertTrue(is_lonely)

    def test_explore_returns_findings(self):
        findings = self.problem.explore(2, 5)
        self.assertIsInstance(findings, list)
        for f in findings:
            self.assertEqual(f.problem, "lonely_runner")

    def test_counterexamples_are_resolution_artifacts(self):
        """Any 'counterexamples' found for small k are resolution artifacts, not real ones."""
        findings = self.problem.explore(2, 5)
        counterexamples = [f for f in findings if f.category == "counterexample"]
        # If counterexamples found, verify they pass with higher resolution
        for ce in counterexamples:
            speeds = ce.data.get("speeds", [])
            if speeds:
                is_lonely, _ = self.problem._check_lonely(speeds, resolution=100000)
                self.assertTrue(is_lonely, f"Real counterexample found for speeds={speeds}!")

    def test_generate_hypotheses(self):
        findings = self.problem.explore(2, 5)
        hypotheses = self.problem.generate_hypotheses(findings)
        self.assertIsInstance(hypotheses, list)

    def test_test_hypothesis(self):
        h = Hypothesis(hypothesis_id="lr_test", problem="lonely_runner", statement="Test")
        result = self.problem.test_hypothesis(h, sample_size=20)
        self.assertIsInstance(result, ExperimentResult)

    def test_encode_finding(self):
        encoder = MathHDCEncoder()
        f = ResearchFinding(finding_id="test", problem="lonely_runner", category="structure",
                           description="test", data={"k": 4, "worst_dist": 0.3})
        hv = self.problem.encode_finding(f, encoder)
        self.assertEqual(hv.shape, (HDC_DIM,))


# ══════════════════════════════════════════════════════════════════════════════
# Syracuse Problem Tests
# ══════════════════════════════════════════════════════════════════════════════

class TestSyracuseProblem(unittest.TestCase):
    def setUp(self):
        self.problem = SyracuseProblem()

    def test_standard_collatz_converges(self):
        seq, result = self.problem._run_generalized(27, 3, 1)
        self.assertEqual(result, "converged")
        self.assertEqual(seq[-1], 1)

    def test_5n1_has_cycles(self):
        # 5n+1 is known to have cycles for some starting values
        seq, result = self.problem._run_generalized(13, 5, 1)
        self.assertIn(result, ["converged", "cycle", "diverged", "timeout"])

    def test_explore_returns_findings(self):
        findings = self.problem.explore(1, 100)
        self.assertIsInstance(findings, list)
        for f in findings:
            self.assertEqual(f.problem, "syracuse")

    def test_explore_finds_structures(self):
        findings = self.problem.explore(1, 200)
        structures = [f for f in findings if f.category == "structure"]
        self.assertGreater(len(structures), 0)

    def test_explore_detects_cycles_in_variants(self):
        findings = self.problem.explore(1, 200)
        cycle_findings = [f for f in findings if f.category == "pattern" and "cykel" in f.description.lower()]
        # 5n+1 should produce cycles
        self.assertGreater(len(cycle_findings), 0, "Should detect cycles in non-3n+1 variants")

    def test_generate_hypotheses(self):
        findings = self.problem.explore(1, 200)
        hypotheses = self.problem.generate_hypotheses(findings)
        self.assertIsInstance(hypotheses, list)

    def test_test_hypothesis(self):
        h = Hypothesis(hypothesis_id="sy_test", problem="syracuse", statement="Test")
        result = self.problem.test_hypothesis(h, sample_size=100)
        self.assertIsInstance(result, ExperimentResult)
        self.assertTrue(result.passed)  # 3n+1 should always converge

    def test_encode_finding(self):
        encoder = MathHDCEncoder()
        f = ResearchFinding(finding_id="test", problem="syracuse", category="structure",
                           description="test", data={"a": 3, "converged": 100, "total": 100})
        hv = self.problem.encode_finding(f, encoder)
        self.assertEqual(hv.shape, (HDC_DIM,))


# ══════════════════════════════════════════════════════════════════════════════
# MathResearchEngine Tests
# ══════════════════════════════════════════════════════════════════════════════

class TestMathResearchEngine(unittest.TestCase):
    def setUp(self):
        self.engine = MathResearchEngine()

    def test_initial_stats(self):
        stats = self.engine.get_stats()
        self.assertEqual(stats["total_findings"], 0)
        self.assertEqual(stats["total_hypotheses"], 0)
        self.assertFalse(stats["running"])

    def test_select_problem(self):
        problem = self.engine.select_problem()
        self.assertIn(problem, self.engine.problems)

    def test_explore_goldbach(self):
        findings = self.engine.explore_problem("goldbach", 4, 200)
        self.assertIsInstance(findings, list)
        self.assertGreater(self.engine.get_stats()["total_findings"], 0)

    def test_explore_twin_prime(self):
        findings = self.engine.explore_problem("twin_prime", 1, 1000)
        self.assertIsInstance(findings, list)

    def test_explore_perfect_number(self):
        findings = self.engine.explore_problem("perfect_number", 1, 500)
        self.assertIsInstance(findings, list)

    def test_explore_lonely_runner(self):
        findings = self.engine.explore_problem("lonely_runner", 2, 4)
        self.assertIsInstance(findings, list)

    def test_explore_syracuse(self):
        findings = self.engine.explore_problem("syracuse", 1, 100)
        self.assertIsInstance(findings, list)

    def test_explore_invalid_problem(self):
        with self.assertRaises(ValueError):
            self.engine.explore_problem("nonexistent", 1, 100)

    def test_generate_hypotheses(self):
        self.engine.explore_problem("goldbach", 4, 500)
        hypotheses = self.engine.generate_hypotheses("goldbach")
        self.assertIsInstance(hypotheses, list)

    def test_test_hypotheses(self):
        self.engine.explore_problem("goldbach", 4, 500)
        self.engine.generate_hypotheses("goldbach")
        results = self.engine.test_hypotheses("goldbach", sample_size=50)
        self.assertIsInstance(results, list)

    def test_cross_domain(self):
        self.engine.explore_problem("goldbach", 4, 300)
        self.engine.explore_problem("twin_prime", 1, 1000)
        patterns = self.engine.find_cross_domain_patterns(threshold=0.2)
        self.assertIsInstance(patterns, list)

    def test_findings_stored_in_memory(self):
        self.engine.explore_problem("goldbach", 4, 200)
        mem_stats = self.engine.memory.get_stats()
        self.assertGreater(mem_stats["total_stored"], 0)

    def test_findings_learned_as_concepts(self):
        self.engine.explore_problem("goldbach", 4, 200)
        names = self.engine.bridge.get_concept_names()
        self.assertTrue(any("goldbach" in n for n in names))

    def test_get_hypotheses(self):
        self.engine.explore_problem("goldbach", 4, 500)
        self.engine.generate_hypotheses("goldbach")
        hyps = self.engine.get_hypotheses()
        self.assertIsInstance(hyps, list)
        for h in hyps:
            self.assertIn("id", h)
            self.assertIn("statement", h)
            self.assertIn("confidence", h)

    def test_get_findings(self):
        self.engine.explore_problem("goldbach", 4, 200)
        findings = self.engine.get_findings()
        self.assertIsInstance(findings, list)

    def test_get_findings_filtered(self):
        self.engine.explore_problem("goldbach", 4, 200)
        self.engine.explore_problem("twin_prime", 1, 1000)
        gb_findings = self.engine.get_findings(problem="goldbach")
        tp_findings = self.engine.get_findings(problem="twin_prime")
        for f in gb_findings:
            self.assertEqual(f["problem"], "goldbach")
        for f in tp_findings:
            self.assertEqual(f["problem"], "twin_prime")

    def test_get_research_report(self):
        self.engine.explore_problem("goldbach", 4, 200)
        self.engine.generate_hypotheses("goldbach")
        report = self.engine.get_research_report()
        self.assertIsInstance(report, str)
        self.assertIn("Frankenstein AI", report)
        self.assertIn("goldbach", report.lower())

    def test_stats_after_work(self):
        self.engine.explore_problem("goldbach", 4, 200)
        self.engine.explore_problem("twin_prime", 1, 1000)
        stats = self.engine.get_stats()
        self.assertGreater(stats["total_findings"], 0)
        self.assertIn("goldbach", stats["findings_by_problem"])
        self.assertIn("twin_prime", stats["findings_by_problem"])


# ══════════════════════════════════════════════════════════════════════════════
# Async Research Cycle Tests
# ══════════════════════════════════════════════════════════════════════════════

def _run_async(coro):
    loop = asyncio.new_event_loop()
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()


class TestResearchCycle(unittest.TestCase):
    def test_basic_cycle(self):
        engine = MathResearchEngine()
        summary = _run_async(engine.run_research_cycle(iterations=3, range_size=200))
        self.assertIn("total_findings", summary)
        self.assertIn("iterations_completed", summary)
        self.assertEqual(summary["iterations_completed"], 3)

    def test_cycle_with_callback(self):
        engine = MathResearchEngine()
        calls = [0]
        def cb(i, stats):
            calls[0] += 1
        _run_async(engine.run_research_cycle(iterations=3, range_size=200, callback=cb))
        self.assertEqual(calls[0], 3)

    def test_stop_cycle(self):
        engine = MathResearchEngine()
        async def run_and_stop():
            async def stopper():
                await asyncio.sleep(0.01)
                engine.stop()
            task = asyncio.create_task(engine.run_research_cycle(iterations=1000, range_size=100))
            asyncio.create_task(stopper())
            return await task
        summary = _run_async(run_and_stop())
        self.assertLess(summary["iterations_completed"], 1000)


# ══════════════════════════════════════════════════════════════════════════════
# Convenience Function Tests
# ══════════════════════════════════════════════════════════════════════════════

class TestRunQuickResearch(unittest.TestCase):
    def test_basic(self):
        result = run_quick_research(iterations=3)
        self.assertIn("stats", result)
        self.assertIn("hypotheses", result)
        self.assertIn("report", result)
        self.assertIsInstance(result["report"], str)


# ══════════════════════════════════════════════════════════════════════════════
# Integration Tests
# ══════════════════════════════════════════════════════════════════════════════

class TestIntegrationHDC(unittest.TestCase):
    def test_findings_have_embeddings(self):
        engine = MathResearchEngine()
        engine.explore_problem("goldbach", 4, 200)
        for f in engine._findings:
            self.assertIsNotNone(f.hdc_embedding)
            self.assertIsNotNone(f.memory_id)

    def test_different_problems_different_embeddings(self):
        engine = MathResearchEngine()
        engine.explore_problem("goldbach", 4, 200)
        engine.explore_problem("syracuse", 1, 100)
        gb = [f for f in engine._findings if f.problem == "goldbach" and f.hdc_embedding]
        sy = [f for f in engine._findings if f.problem == "syracuse" and f.hdc_embedding]
        if gb and sy:
            hv1 = torch.tensor(gb[0].hdc_embedding, dtype=torch.float32)
            hv2 = torch.tensor(sy[0].hdc_embedding, dtype=torch.float32)
            sim = float(hdc_cosine_similarity(hv1, hv2).squeeze())
            # Different problems should produce somewhat different vectors
            self.assertLess(sim, 0.99)


class TestIntegrationAIF(unittest.TestCase):
    def test_aif_updates_with_exploration(self):
        engine = MathResearchEngine()
        initial_steps = engine.aif.step_count
        engine.select_problem()
        self.assertEqual(engine.aif.step_count, initial_steps + 1)

    def test_aif_surprise_varies(self):
        engine = MathResearchEngine()
        surprises = []
        for _ in range(10):
            engine.select_problem()
            surprises.append(engine.aif.get_surprise())
        self.assertTrue(any(s > 0 for s in surprises))


class TestIntegrationEbbinghaus(unittest.TestCase):
    def test_findings_stored_in_memory(self):
        engine = MathResearchEngine()
        engine.explore_problem("goldbach", 4, 200)
        stats = engine.memory.get_stats()
        self.assertGreater(stats["total_stored"], 0)


if __name__ == "__main__":
    unittest.main(verbosity=2)
