"""
Reflektions-loop — Frankenstein ASI-komponent.

Om S2-lagret (LLM) tar >10 sekunder, aktiveras en "självkritik"-modul
som läser igenom lösningen efter logiska luckor INNAN den postas som färdig.

Arkitektur:
┌──────────────┐     ┌──────────────────┐     ┌──────────────┐
│  LLM Output  │ ──→ │  Reflection      │ ──→ │  Verified    │
│  (raw code)  │     │  Engine          │     │  Output      │
└──────────────┘     └────────┬─────────┘     └──────────────┘
                              │
                     ┌────────▼─────────┐
                     │  Self-Critique   │
                     │  Checks:         │
                     │  1. Input parsing │
                     │  2. Edge cases   │
                     │  3. Output format│
                     │  4. Logic gaps   │
                     │  5. Off-by-one   │
                     └──────────────────┘

Flöde:
1. DETECT: Mät tid — om >10s, aktivera reflektion
2. ANALYZE: Statisk analys av genererad kod
3. CRITIQUE: Identifiera potentiella problem
4. REPAIR: Generera fix-prompt om problem hittas
5. VERIFY: Dubbelkolla fixad kod
"""

import re
import time
from dataclasses import dataclass, field
from typing import Any


@dataclass
class ReflectionIssue:
    """Ett identifierat problem i koden."""
    severity: str           # "critical", "warning", "info"
    category: str           # "input_parsing", "edge_case", "output_format", "logic", "off_by_one"
    description: str
    line_hint: str = ""     # Vilken del av koden som berörs
    suggested_fix: str = ""


@dataclass
class ReflectionResult:
    """Resultat från reflektions-analys."""
    should_reflect: bool
    elapsed_ms: float
    issues: list[ReflectionIssue] = field(default_factory=list)
    critique_prompt: str = ""
    confidence_before: float = 0.0
    confidence_after: float = 0.0
    reflection_time_ms: float = 0.0


# Statiska analysregler
INPUT_PATTERNS = [
    (r"input\(\)", "input_call"),
    (r"sys\.stdin", "stdin_read"),
    (r"int\(input\(\)\)", "int_input"),
    (r"float\(input\(\)\)", "float_input"),
    (r"input\(\)\.split\(\)", "split_input"),
    (r"map\(int,\s*input\(\)\.split\(\)\)", "map_int_input"),
]

OUTPUT_PATTERNS = [
    (r"print\(", "print_call"),
    (r"sys\.stdout", "stdout_write"),
    (r"f\"", "fstring"),
    (r"\.format\(", "format_call"),
    (r":\.\d+f", "float_format"),
]

EDGE_CASE_RISKS = [
    (r"\/(?!\/)(?!0)", "division", "Division utan nollkontroll"),
    (r"\[.*-\s*1\]", "index_minus_one", "Index-1 — potentiell off-by-one"),
    (r"range\(.*len\(", "range_len", "range(len()) — kolla start/stop"),
    (r"while\s+True", "infinite_loop", "Oändlig loop — finns break?"),
    (r"\.pop\(", "pop_empty", "pop() på potentiellt tom lista"),
    (r"int\(.*\)", "int_conversion", "int() — hanteras ValueError?"),
    (r"float\(.*\)", "float_conversion", "float() — hanteras ValueError?"),
    (r"\*\*\s*\d{2,}", "large_exponent", "Stor exponent — kan orsaka overflow"),
]

LOGIC_CHECKS = [
    (r"if\s+.*==\s*True", "bool_compare", "Jämför med True — använd bara 'if x:'"),
    (r"except\s*:", "bare_except", "Bare except — fångar alla fel inklusive SystemExit"),
    (r"global\s+", "global_var", "Global variabel — potentiell sidoeffekt"),
    (r"eval\(", "eval_usage", "eval() — säkerhetsrisk och oförutsägbart"),
    (r"exec\(", "exec_usage", "exec() — säkerhetsrisk"),
]


class ReflectionEngine:
    """Självkritik-motor som analyserar kod efter logiska luckor."""

    # Tröskelvärde i millisekunder — aktivera reflektion om lösningen tog längre
    SLOW_THRESHOLD_MS = 10_000

    def __init__(self, threshold_ms: float = 10_000):
        self.threshold_ms = threshold_ms
        self.reflections_triggered: int = 0
        self.issues_found: int = 0
        self.issues_fixed: int = 0
        self.total_reflection_time_ms: float = 0.0
        self.category_counts: dict[str, int] = {}

    def should_reflect(self, elapsed_ms: float, score: float, attempt_num: int) -> bool:
        """Bestäm om reflektion ska aktiveras.

        Aktiveras om:
        - Lösningen tog >threshold_ms OCH score < 1.0
        - ELLER score < 1.0 och det är sista försöket (attempt_num >= 2)
        - ELLER score > 0 men < 1.0 (partiell lösning — nästan rätt)
        """
        if score >= 1.0:
            return False

        if elapsed_ms > self.threshold_ms:
            return True

        if attempt_num >= 2 and score < 1.0:
            return True

        if 0 < score < 1.0:
            return True

        return False

    def reflect(self, code: str, task_description: str, test_cases_info: str,
                feedback: str, elapsed_ms: float) -> ReflectionResult:
        """Kör fullständig reflektions-analys på koden.

        Args:
            code: Genererad Python-kod
            task_description: Uppgiftsbeskrivning
            test_cases_info: Info om testfall (input/output)
            feedback: Feedback från evaluering
            elapsed_ms: Tid som lösningen tog
        """
        t_start = time.time()
        self.reflections_triggered += 1
        issues: list[ReflectionIssue] = []

        # 1. Kontrollera input-parsing
        issues.extend(self._check_input_parsing(code, task_description))

        # 2. Kontrollera edge cases
        issues.extend(self._check_edge_cases(code))

        # 3. Kontrollera output-format
        issues.extend(self._check_output_format(code, task_description, feedback))

        # 4. Kontrollera logiska luckor
        issues.extend(self._check_logic(code, feedback))

        # 5. Kontrollera off-by-one
        issues.extend(self._check_off_by_one(code, feedback))

        # 6. Kontrollera mot feedback
        issues.extend(self._check_against_feedback(code, feedback))

        self.issues_found += len(issues)
        for issue in issues:
            self.category_counts[issue.category] = self.category_counts.get(issue.category, 0) + 1

        # Generera critique-prompt om problem hittades
        critique_prompt = ""
        if issues:
            critique_prompt = self._build_critique_prompt(code, issues, task_description, test_cases_info)

        # Beräkna konfidens
        critical_count = sum(1 for i in issues if i.severity == "critical")
        warning_count = sum(1 for i in issues if i.severity == "warning")
        confidence_before = max(0.0, 1.0 - critical_count * 0.3 - warning_count * 0.1)
        confidence_after = min(1.0, confidence_before + 0.2) if critique_prompt else confidence_before

        reflection_time = (time.time() - t_start) * 1000
        self.total_reflection_time_ms += reflection_time

        return ReflectionResult(
            should_reflect=True,
            elapsed_ms=elapsed_ms,
            issues=issues,
            critique_prompt=critique_prompt,
            confidence_before=confidence_before,
            confidence_after=confidence_after,
            reflection_time_ms=reflection_time,
        )

    def record_fix_outcome(self, fixed: bool) -> None:
        """Registrera om reflektionens fix ledde till korrekt lösning."""
        if fixed:
            self.issues_fixed += 1

    def _check_input_parsing(self, code: str, description: str) -> list[ReflectionIssue]:
        """Kontrollera att input parsas korrekt."""
        issues = []

        has_input = any(re.search(pat, code) for pat, _ in INPUT_PATTERNS)
        if not has_input and "input()" not in code and "sys.stdin" not in code:
            issues.append(ReflectionIssue(
                severity="critical",
                category="input_parsing",
                description="Koden laser INTE fran stdin — input() eller sys.stdin saknas",
                suggested_fix="Lagg till input()-anrop for att lasa data",
            ))

        # Kolla om antal input()-anrop matchar förväntad input
        input_count = len(re.findall(r"input\(\)", code))
        desc_lower = description.lower()
        if "n rader" in desc_lower or "n lines" in desc_lower:
            if "for" not in code and "while" not in code and input_count < 3:
                issues.append(ReflectionIssue(
                    severity="warning",
                    category="input_parsing",
                    description="Uppgiften kraver multipla rader input men koden har fa input()-anrop och ingen loop",
                    suggested_fix="Anvand en loop for att lasa N rader",
                ))

        # Kolla om float-input behövs men int används
        if any(kw in desc_lower for kw in ["decimal", "float", "0.01", ".2f", "avrund"]):
            if "float(" not in code and "float(input" not in code:
                if "int(input" in code:
                    issues.append(ReflectionIssue(
                        severity="critical",
                        category="input_parsing",
                        description="Uppgiften kraver float-varden men koden laser int",
                        suggested_fix="Byt int(input()) mot float(input())",
                    ))

        return issues

    def _check_edge_cases(self, code: str) -> list[ReflectionIssue]:
        """Kontrollera potentiella edge case-problem."""
        issues = []

        for pattern, name, desc in EDGE_CASE_RISKS:
            if re.search(pattern, code):
                # Kontrollera om det finns en guard
                if name == "division":
                    if "/ 0" not in code and ("if" in code or "max(" in code):
                        continue  # Troligen hanterat
                if name == "infinite_loop":
                    if "break" in code:
                        continue  # Har break
                if name == "pop_empty":
                    if "if " in code and "len(" in code:
                        continue  # Troligen kontrollerat

                issues.append(ReflectionIssue(
                    severity="warning",
                    category="edge_case",
                    description=desc,
                    line_hint=name,
                ))

        return issues

    def _check_output_format(self, code: str, description: str, feedback: str) -> list[ReflectionIssue]:
        """Kontrollera att output-formatet matchar."""
        issues = []

        has_print = "print(" in code
        if not has_print:
            issues.append(ReflectionIssue(
                severity="critical",
                category="output_format",
                description="Koden har INGEN print() — output saknas",
                suggested_fix="Lagg till print() for att skriva ut resultatet",
            ))

        # Kolla om feedback nämner format-problem
        fb_lower = feedback.lower()
        if "expected" in fb_lower and "got" in fb_lower:
            issues.append(ReflectionIssue(
                severity="critical",
                category="output_format",
                description="Output matchar inte forvantad — kontrollera format (mellanslag, radbrytningar, decimaler)",
                suggested_fix="Jamfor din output med forvantad output tecken for tecken",
            ))

        # Kolla decimal-precision
        desc_lower = description.lower()
        decimal_match = re.search(r"(\d+)\s*decimal", desc_lower)
        if decimal_match:
            n_decimals = int(decimal_match.group(1))
            format_pattern = f":.{n_decimals}f"
            if format_pattern not in code and f"round(" not in code:
                issues.append(ReflectionIssue(
                    severity="warning",
                    category="output_format",
                    description=f"Uppgiften kraver {n_decimals} decimaler men koden saknar formatering",
                    suggested_fix=f"Anvand f'{{value:.{n_decimals}f}}' eller round(value, {n_decimals})",
                ))

        return issues

    def _check_logic(self, code: str, feedback: str) -> list[ReflectionIssue]:
        """Kontrollera logiska luckor."""
        issues = []

        for pattern, name, desc in LOGIC_CHECKS:
            if re.search(pattern, code):
                issues.append(ReflectionIssue(
                    severity="info",
                    category="logic",
                    description=desc,
                    line_hint=name,
                ))

        # Kontrollera om koden har oanvända variabler (enkel heuristik)
        assignments = re.findall(r"^(\w+)\s*=", code, re.MULTILINE)
        for var in assignments:
            if var in ("_", "i", "j", "k", "n", "m", "t"):
                continue
            # Kolla om variabeln används efter tilldelning
            uses = len(re.findall(rf"\b{re.escape(var)}\b", code))
            if uses <= 1:
                issues.append(ReflectionIssue(
                    severity="info",
                    category="logic",
                    description=f"Variabel '{var}' tilldelas men anvands aldrig",
                    line_hint=var,
                ))

        return issues

    def _check_off_by_one(self, code: str, feedback: str) -> list[ReflectionIssue]:
        """Kontrollera off-by-one-fel."""
        issues = []

        # Kolla range() med potentiella off-by-one
        range_matches = re.findall(r"range\(([^)]+)\)", code)
        for match in range_matches:
            parts = [p.strip() for p in match.split(",")]
            if len(parts) >= 2:
                start, stop = parts[0], parts[1]
                # Vanligt off-by-one: range(1, n) vs range(0, n) vs range(1, n+1)
                if "len(" in stop and start == "1":
                    issues.append(ReflectionIssue(
                        severity="warning",
                        category="off_by_one",
                        description=f"range(1, len(...)) — missar sista elementet? Borde det vara range(1, len(...)+1)?",
                        line_hint=f"range({match})",
                    ))

        # Kolla index-access med -1
        if "[-1]" in code and feedback and "index" in feedback.lower():
            issues.append(ReflectionIssue(
                severity="warning",
                category="off_by_one",
                description="Anvander [-1] index — kan ge fel pa tom lista",
                line_hint="[-1]",
            ))

        return issues

    def _check_against_feedback(self, code: str, feedback: str) -> list[ReflectionIssue]:
        """Analysera feedback för att hitta specifika problem."""
        issues = []
        fb_lower = feedback.lower()

        if "timeout" in fb_lower or "timed out" in fb_lower:
            issues.append(ReflectionIssue(
                severity="critical",
                category="performance",
                description="Koden tar for lang tid — optimera algoritmen",
                suggested_fix="Byt till en effektivare algoritm (t.ex. O(n) istallet for O(n^2))",
            ))

        if "syntax" in fb_lower:
            issues.append(ReflectionIssue(
                severity="critical",
                category="syntax",
                description="Syntaxfel i koden",
                suggested_fix="Kontrollera indentation, parenteser, kolon",
            ))

        if "nameerror" in fb_lower:
            # Försök hitta vilken variabel
            name_match = re.search(r"name '(\w+)' is not defined", feedback)
            if name_match:
                var_name = name_match.group(1)
                issues.append(ReflectionIssue(
                    severity="critical",
                    category="logic",
                    description=f"Variabel '{var_name}' anvands men ar inte definierad",
                    suggested_fix=f"Definiera '{var_name}' innan den anvands",
                ))

        if "indexerror" in fb_lower:
            issues.append(ReflectionIssue(
                severity="critical",
                category="off_by_one",
                description="IndexError — index utanfor listans granser",
                suggested_fix="Kontrollera listans langd innan index-access",
            ))

        if "valueerror" in fb_lower:
            issues.append(ReflectionIssue(
                severity="critical",
                category="input_parsing",
                description="ValueError — felaktig typkonvertering",
                suggested_fix="Kontrollera att input-data har ratt format innan konvertering",
            ))

        return issues

    def _build_critique_prompt(self, code: str, issues: list[ReflectionIssue],
                                task_description: str, test_cases_info: str) -> str:
        """Bygg en critique-prompt som tvingar LLM att fixa identifierade problem."""
        parts = [
            "SJALVKRITIK — Din losning har identifierade problem. FIXA ALLA:\n\n",
        ]

        # Gruppera issues per severity
        critical = [i for i in issues if i.severity == "critical"]
        warnings = [i for i in issues if i.severity == "warning"]

        if critical:
            parts.append("KRITISKA PROBLEM (MASTE fixas):\n")
            for i, issue in enumerate(critical, 1):
                parts.append(f"  {i}. [{issue.category}] {issue.description}\n")
                if issue.suggested_fix:
                    parts.append(f"     FIX: {issue.suggested_fix}\n")
            parts.append("\n")

        if warnings:
            parts.append("VARNINGAR (BOR fixas):\n")
            for i, issue in enumerate(warnings, 1):
                parts.append(f"  {i}. [{issue.category}] {issue.description}\n")
                if issue.suggested_fix:
                    parts.append(f"     FIX: {issue.suggested_fix}\n")
            parts.append("\n")

        # Testfall-simulering: tvinga LLM att mentalt köra koden
        if test_cases_info:
            parts.append(
                "MENTAL TESTKORNING — Gor detta INNAN du skriver fixad kod:\n"
                "For varje testfall nedan:\n"
                "  a) Folj koden rad for rad med testfallets input\n"
                "  b) Skriv ner varje variabels varde\n"
                "  c) Jamfor din output med forvantad output\n"
                "  d) Om de INTE matchar — hitta EXAKT vilken rad som ar fel\n\n"
                f"TESTFALL ATT SIMULERA:\n{test_cases_info[:500]}\n\n"
            )

        parts.append(
            "INSTRUKTIONER:\n"
            "1. Las igenom din kod noggrant\n"
            "2. Fixa ALLA kritiska problem\n"
            "3. KOR koden mentalt mot VARJE testfall ovan\n"
            "4. Kontrollera output-format EXAKT (decimaler, mellanslag, radbrytningar)\n"
            "5. Om output INTE matchar — SKRIV OM losningen fran scratch\n"
            "6. Svara med KOMPLETT fixad kod i ```python``` block\n\n"
        )

        parts.append(f"DIN NUVARANDE KOD:\n```python\n{code}\n```\n\n")
        parts.append(f"UPPGIFT: {task_description[:500]}\n\n")
        parts.append("Svara BARA med fixad ```python``` kod:")

        return "".join(parts)

    def get_stats(self) -> dict:
        return {
            "reflections_triggered": self.reflections_triggered,
            "issues_found": self.issues_found,
            "issues_fixed": self.issues_fixed,
            "fix_rate": self.issues_fixed / max(self.reflections_triggered, 1),
            "avg_reflection_time_ms": self.total_reflection_time_ms / max(self.reflections_triggered, 1),
            "category_counts": dict(self.category_counts),
        }
