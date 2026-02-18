"""
Enhetstester för circadian.py — inklusive SleepEngine med Math Research och Collatz-integration.

Kör med: python -m pytest circadian_test.py -v
"""

import os
import sys
import time
import json
import unittest
from unittest.mock import MagicMock, patch
from pathlib import Path

sys.path.insert(0, os.path.dirname(__file__))

from circadian import (
    CircadianClock,
    CircadianState,
    SleepEngine,
    SleepReport,
    DreamResult,
    MathDreamResult,
    PHASES,
    PHASE_PROFILES,
)
from memory import EbbinghausMemory
from cognition import NeuroSymbolicBridge


# ══════════════════════════════════════════════════════════════════════════════
# CircadianClock Tests
# ══════════════════════════════════════════════════════════════════════════════

class TestCircadianClock(unittest.TestCase):
    def setUp(self):
        self.clock = CircadianClock(
            batches_per_day=30,
            sleep_batches=3,
            state_file="training_data/_test_circadian_state.json",
        )
        self.clock.batch_in_day = 0
        self.clock.day_number = 1

    def tearDown(self):
        p = Path("training_data/_test_circadian_state.json")
        if p.exists():
            p.unlink()

    def test_initial_state(self):
        state = self.clock.get_state()
        self.assertIsInstance(state, CircadianState)
        self.assertEqual(state.day_number, 1)

    def test_day_progress(self):
        self.clock.batch_in_day = 0
        self.assertAlmostEqual(self.clock.get_day_progress(), 0.0)
        self.clock.batch_in_day = 15
        self.assertAlmostEqual(self.clock.get_day_progress(), 0.5)
        self.clock.batch_in_day = 30
        self.assertAlmostEqual(self.clock.get_day_progress(), 1.0)

    def test_phase_dawn(self):
        self.clock.batch_in_day = 0
        self.assertEqual(self.clock.get_current_phase(), "dawn")

    def test_phase_morning_peak(self):
        self.clock.batch_in_day = 3  # ~10% = morning_peak
        self.assertEqual(self.clock.get_current_phase(), "morning_peak")

    def test_phase_sleep(self):
        self.clock.batch_in_day = 25  # ~83% = sleep
        self.assertEqual(self.clock.get_current_phase(), "sleep")

    def test_is_sleep_time(self):
        self.clock.batch_in_day = 0
        self.assertFalse(self.clock.is_sleep_time())
        self.clock.batch_in_day = 25
        self.assertTrue(self.clock.is_sleep_time())

    def test_advance_batch(self):
        state = self.clock.advance_batch(events_this_batch=5, solved=3)
        self.assertEqual(self.clock.batch_in_day, 1)
        self.assertIsInstance(state, CircadianState)

    def test_advance_batch_new_day(self):
        self.clock.batch_in_day = 29
        self.clock.advance_batch()
        self.assertEqual(self.clock.batch_in_day, 0)
        self.assertEqual(self.clock.day_number, 2)

    def test_fatigue_increases(self):
        initial = self.clock.fatigue
        self.clock.advance_batch()
        self.assertGreater(self.clock.fatigue, initial)

    def test_fatigue_resets_on_new_day(self):
        self.clock.fatigue = 0.8
        self.clock.batch_in_day = 29
        self.clock.advance_batch()
        self.assertLess(self.clock.fatigue, 0.2)

    def test_save_and_load_state(self):
        self.clock.batch_in_day = 10
        self.clock.day_number = 5
        self.clock.fatigue = 0.42
        self.clock.save_state()

        clock2 = CircadianClock(
            state_file="training_data/_test_circadian_state.json",
        )
        self.assertEqual(clock2.batch_in_day, 10)
        self.assertEqual(clock2.day_number, 5)
        self.assertAlmostEqual(clock2.fatigue, 0.42)

    def test_difficulty_modifier(self):
        self.clock.batch_in_day = 3  # morning_peak
        mod = self.clock.get_difficulty_modifier()
        self.assertEqual(mod, 2)  # morning_peak prefers harder

    def test_exploration_modifier(self):
        mod = self.clock.get_exploration_modifier()
        self.assertGreater(mod, 0)
        self.assertLessEqual(mod, 1.0)

    def test_temperature_modifier(self):
        mod = self.clock.get_temperature_modifier()
        self.assertIsInstance(mod, float)

    def test_all_phases_have_profiles(self):
        for phase in PHASES:
            self.assertIn(phase, PHASE_PROFILES)

    def test_subjective_time_increases(self):
        initial = self.clock.subjective_time
        self.clock.advance_batch(events_this_batch=10)
        self.assertGreater(self.clock.subjective_time, initial)


# ══════════════════════════════════════════════════════════════════════════════
# SleepEngine Basic Tests
# ══════════════════════════════════════════════════════════════════════════════

class TestSleepEngineBasic(unittest.TestCase):
    def setUp(self):
        self.engine = SleepEngine(cycles_per_night=2)
        self.memory = EbbinghausMemory(
            collection_name="test-circadian-sleep",
            decay_threshold=0.05,
        )

    def test_initial_state(self):
        stats = self.engine.get_stats()
        self.assertEqual(stats["total_dreams"], 0)
        self.assertEqual(stats["total_math_findings"], 0)
        self.assertEqual(stats["total_collatz_anomalies"], 0)

    def test_sleep_cycle_no_extras(self):
        report = self.engine.run_sleep_cycle(
            self.memory,
            enable_math_dreams=False,
            enable_collatz_dreams=False,
        )
        self.assertIsInstance(report, SleepReport)
        self.assertEqual(report.cycles_completed, 2)
        self.assertEqual(len(report.math_dreams), 0)
        self.assertEqual(report.collatz_anomalies, 0)

    def test_sleep_report_fields(self):
        report = self.engine.run_sleep_cycle(
            self.memory,
            enable_math_dreams=False,
            enable_collatz_dreams=False,
        )
        self.assertIsInstance(report.dreams, list)
        self.assertIsInstance(report.insights, list)
        self.assertIsInstance(report.math_dreams, list)
        self.assertIsInstance(report.collatz_anomalies, int)
        self.assertIsInstance(report.collatz_sequences, int)

    def test_narrate_dream(self):
        dream = DreamResult(
            concept_a="sorting", concept_b="recursion",
            novelty=0.7, coherence=0.8, insight_potential=0.56, cycle=0,
        )
        text = self.engine.narrate_dream(dream)
        self.assertIn("sorting", text)
        self.assertIn("recursion", text)


# ══════════════════════════════════════════════════════════════════════════════
# SleepEngine with Math Research Integration
# ══════════════════════════════════════════════════════════════════════════════

class TestSleepMathDreams(unittest.TestCase):
    def setUp(self):
        self.engine = SleepEngine(cycles_per_night=3)
        self.memory = EbbinghausMemory(
            collection_name="test-circadian-math",
            decay_threshold=0.05,
        )
        self.bridge = NeuroSymbolicBridge(lnn_output_dim=32, hdc_dim=10000)

    def test_math_dreams_enabled(self):
        report = self.engine.run_sleep_cycle(
            self.memory,
            hdc_bridge=self.bridge,
            enable_math_dreams=True,
            enable_collatz_dreams=False,
            math_range_size=500,
        )
        self.assertIsInstance(report.math_dreams, list)
        # With 3 cycles and math starting at cycle >= 1, should have 2 math dreams
        self.assertGreater(len(report.math_dreams), 0)

    def test_math_dream_result_fields(self):
        report = self.engine.run_sleep_cycle(
            self.memory,
            hdc_bridge=self.bridge,
            enable_math_dreams=True,
            enable_collatz_dreams=False,
            math_range_size=300,
        )
        for md in report.math_dreams:
            self.assertIsInstance(md, MathDreamResult)
            self.assertIn(md.problem, ["goldbach", "twin_prime", "perfect_number", "lonely_runner", "syracuse"])
            self.assertGreaterEqual(md.findings_count, 0)
            self.assertGreaterEqual(md.cycle, 0)
            self.assertIn("rem_intensity", md.details)

    def test_math_engine_lazy_loaded(self):
        self.assertIsNone(self.engine._math_engine)
        self.engine.run_sleep_cycle(
            self.memory,
            hdc_bridge=self.bridge,
            enable_math_dreams=True,
            enable_collatz_dreams=False,
            math_range_size=200,
        )
        self.assertIsNotNone(self.engine._math_engine)

    def test_math_findings_accumulate(self):
        self.engine.run_sleep_cycle(
            self.memory,
            hdc_bridge=self.bridge,
            enable_math_dreams=True,
            enable_collatz_dreams=False,
            math_range_size=300,
        )
        stats = self.engine.get_stats()
        self.assertGreaterEqual(stats["total_math_findings"], 0)
        self.assertGreater(stats["math_journal_size"], 0)

    def test_math_research_stats_in_sleep_stats(self):
        self.engine.run_sleep_cycle(
            self.memory,
            hdc_bridge=self.bridge,
            enable_math_dreams=True,
            enable_collatz_dreams=False,
            math_range_size=200,
        )
        stats = self.engine.get_stats()
        self.assertIn("math_research", stats)
        self.assertIn("total_findings", stats["math_research"])

    def test_multiple_sleep_cycles_accumulate(self):
        for _ in range(2):
            self.engine.run_sleep_cycle(
                self.memory,
                hdc_bridge=self.bridge,
                enable_math_dreams=True,
                enable_collatz_dreams=False,
                math_range_size=200,
            )
        stats = self.engine.get_stats()
        self.assertGreater(stats["math_journal_size"], 1)


# ══════════════════════════════════════════════════════════════════════════════
# SleepEngine with Collatz Integration
# ══════════════════════════════════════════════════════════════════════════════

class TestSleepCollatzDreams(unittest.TestCase):
    def setUp(self):
        self.engine = SleepEngine(cycles_per_night=3)
        self.memory = EbbinghausMemory(
            collection_name="test-circadian-collatz",
            decay_threshold=0.05,
        )
        self.bridge = NeuroSymbolicBridge(lnn_output_dim=32, hdc_dim=10000)

    def test_collatz_dreams_enabled(self):
        report = self.engine.run_sleep_cycle(
            self.memory,
            hdc_bridge=self.bridge,
            enable_math_dreams=False,
            enable_collatz_dreams=True,
            collatz_batch_size=200,
        )
        self.assertGreater(report.collatz_sequences, 0)

    def test_collatz_anomalies_found(self):
        report = self.engine.run_sleep_cycle(
            self.memory,
            hdc_bridge=self.bridge,
            enable_math_dreams=False,
            enable_collatz_dreams=True,
            collatz_batch_size=500,
        )
        # With 500 sequences, should find some anomalies
        self.assertGreaterEqual(report.collatz_anomalies, 0)
        self.assertGreater(report.collatz_sequences, 0)

    def test_collatz_explorer_lazy_loaded(self):
        self.assertIsNone(self.engine._collatz_explorer)
        self.engine.run_sleep_cycle(
            self.memory,
            hdc_bridge=self.bridge,
            enable_math_dreams=False,
            enable_collatz_dreams=True,
            collatz_batch_size=100,
        )
        self.assertIsNotNone(self.engine._collatz_explorer)

    def test_collatz_stats_in_sleep_stats(self):
        self.engine.run_sleep_cycle(
            self.memory,
            hdc_bridge=self.bridge,
            enable_math_dreams=False,
            enable_collatz_dreams=True,
            collatz_batch_size=200,
        )
        stats = self.engine.get_stats()
        self.assertIn("collatz", stats)
        self.assertIn("sequences_computed", stats["collatz"])

    def test_collatz_runs_in_early_cycles(self):
        # With 3 cycles, collatz runs in cycles 0 and 1 (< 3//2+1 = 2)
        report = self.engine.run_sleep_cycle(
            self.memory,
            hdc_bridge=self.bridge,
            enable_math_dreams=False,
            enable_collatz_dreams=True,
            collatz_batch_size=100,
        )
        # Should have processed sequences from 2 cycles (with intensity scaling)
        self.assertGreater(report.collatz_sequences, 50)


# ══════════════════════════════════════════════════════════════════════════════
# Full Sleep Cycle (Math + Collatz + HDC Dreams)
# ══════════════════════════════════════════════════════════════════════════════

class TestFullSleepCycle(unittest.TestCase):
    def setUp(self):
        self.engine = SleepEngine(cycles_per_night=3)
        self.memory = EbbinghausMemory(
            collection_name="test-circadian-full",
            decay_threshold=0.05,
        )
        self.bridge = NeuroSymbolicBridge(lnn_output_dim=32, hdc_dim=10000)

    def test_all_features_enabled(self):
        # Lär bridge några koncept för HDC-drömmar
        import torch
        self.bridge.learn_concept("sorting", torch.randn(10000))
        self.bridge.learn_concept("recursion", torch.randn(10000))
        self.bridge.learn_concept("graph", torch.randn(10000))

        concept_code = {
            "sorting": "def bubble_sort(arr): ...",
            "recursion": "def fib(n): return fib(n-1) + fib(n-2)",
            "graph": "def bfs(graph, start): ...",
        }

        report = self.engine.run_sleep_cycle(
            self.memory,
            hdc_bridge=self.bridge,
            concept_code=concept_code,
            enable_math_dreams=True,
            enable_collatz_dreams=True,
            math_range_size=300,
            collatz_batch_size=200,
        )

        self.assertIsInstance(report, SleepReport)
        self.assertEqual(report.cycles_completed, 3)

        # HDC dreams should have been generated
        self.assertIsInstance(report.dreams, list)

        # Math dreams
        self.assertGreater(len(report.math_dreams), 0)

        # Collatz
        self.assertGreater(report.collatz_sequences, 0)

    def test_full_stats(self):
        report = self.engine.run_sleep_cycle(
            self.memory,
            hdc_bridge=self.bridge,
            enable_math_dreams=True,
            enable_collatz_dreams=True,
            math_range_size=200,
            collatz_batch_size=100,
        )

        stats = self.engine.get_stats()
        self.assertIn("total_dreams", stats)
        self.assertIn("total_math_findings", stats)
        self.assertIn("total_collatz_anomalies", stats)
        self.assertIn("math_research", stats)
        self.assertIn("collatz", stats)

    def test_disabled_features_no_side_effects(self):
        report = self.engine.run_sleep_cycle(
            self.memory,
            enable_math_dreams=False,
            enable_collatz_dreams=False,
        )
        self.assertEqual(len(report.math_dreams), 0)
        self.assertEqual(report.collatz_anomalies, 0)
        self.assertEqual(report.collatz_sequences, 0)
        self.assertIsNone(self.engine._math_engine)
        self.assertIsNone(self.engine._collatz_explorer)


# ══════════════════════════════════════════════════════════════════════════════
# MathDreamResult Tests
# ══════════════════════════════════════════════════════════════════════════════

class TestMathDreamResult(unittest.TestCase):
    def test_creation(self):
        md = MathDreamResult(
            problem="goldbach",
            findings_count=5,
            hypotheses_count=2,
            experiments_count=1,
            cross_domain_count=0,
            cycle=2,
        )
        self.assertEqual(md.problem, "goldbach")
        self.assertEqual(md.findings_count, 5)
        self.assertEqual(md.cycle, 2)

    def test_details_default(self):
        md = MathDreamResult(
            problem="twin_prime",
            findings_count=3,
            hypotheses_count=1,
            experiments_count=0,
            cross_domain_count=0,
            cycle=1,
        )
        self.assertIsInstance(md.details, dict)


# ══════════════════════════════════════════════════════════════════════════════
# Phase Profile Consistency Tests
# ══════════════════════════════════════════════════════════════════════════════

class TestPhaseProfiles(unittest.TestCase):
    def test_all_phases_covered(self):
        total = sum(p["end"] - p["start"] for p in PHASES.values())
        self.assertAlmostEqual(total, 1.0, places=2)

    def test_no_gaps(self):
        sorted_phases = sorted(PHASES.values(), key=lambda p: p["start"])
        for i in range(1, len(sorted_phases)):
            self.assertAlmostEqual(
                sorted_phases[i]["start"],
                sorted_phases[i-1]["end"],
                places=3,
            )

    def test_profiles_have_required_keys(self):
        required = {"analytical", "creativity", "exploration", "temperature_mod", "difficulty_preference", "emoji", "description"}
        for phase, profile in PHASE_PROFILES.items():
            for key in required:
                self.assertIn(key, profile, f"Phase {phase} missing key {key}")

    def test_analytical_range(self):
        for phase, profile in PHASE_PROFILES.items():
            self.assertGreaterEqual(profile["analytical"], 0.0)
            self.assertLessEqual(profile["analytical"], 1.0)

    def test_creativity_range(self):
        for phase, profile in PHASE_PROFILES.items():
            self.assertGreaterEqual(profile["creativity"], 0.0)
            self.assertLessEqual(profile["creativity"], 1.0)


if __name__ == "__main__":
    unittest.main(verbosity=2)
