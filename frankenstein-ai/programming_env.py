"""
Programmeringsmiljö för Frankenstein AI.

Tillhandahåller:
- Säker kodexekvering i subprocess med timeout
- Testfall med input/output-verifiering
- Poängsystem (0.0-1.0) baserat på antal passerade test
- Detaljerad feedback för lärande
"""

import subprocess
import sys
import tempfile
import os
import time
from dataclasses import dataclass, field


@dataclass
class TestCase:
    """Ett testfall med input och förväntat output."""
    input_data: str
    expected_output: str
    description: str = ""


@dataclass
class Task:
    """En programmeringsuppgift."""
    id: str
    title: str
    description: str
    difficulty: int  # 1-5
    category: str
    test_cases: list[TestCase]
    hints: list[str] = field(default_factory=list)
    solution_template: str = ""
    tags: list[str] = field(default_factory=list)


@dataclass
class ExecutionResult:
    """Resultat från kodexekvering."""
    success: bool
    stdout: str
    stderr: str
    exit_code: int
    elapsed_ms: float
    timed_out: bool = False


@dataclass
class EvalResult:
    """Resultat från evaluering av en lösning."""
    task_id: str
    score: float  # 0.0 - 1.0
    passed: int
    total: int
    details: list[dict]
    code: str
    execution_time_ms: float
    feedback: str


def execute_code(code: str, input_data: str = "", timeout: float = 5.0) -> ExecutionResult:
    """Kör Python-kod säkert i en subprocess.
    
    Args:
        code: Python-kod att köra
        input_data: Stdin-data
        timeout: Max exekveringstid i sekunder
    """
    with tempfile.NamedTemporaryFile(mode="w", suffix=".py", delete=False, encoding="utf-8") as f:
        f.write(code)
        tmp_path = f.name

    t_start = time.time()
    try:
        result = subprocess.run(
            [sys.executable, tmp_path],
            input=input_data,
            capture_output=True,
            text=True,
            timeout=timeout,
            env={**os.environ, "PYTHONDONTWRITEBYTECODE": "1", "PYTHONIOENCODING": "utf-8"},
            encoding="utf-8",
            errors="replace",
        )
        elapsed = (time.time() - t_start) * 1000
        return ExecutionResult(
            success=result.returncode == 0,
            stdout=result.stdout.strip(),
            stderr=result.stderr.strip(),
            exit_code=result.returncode,
            elapsed_ms=elapsed,
        )
    except subprocess.TimeoutExpired:
        elapsed = (time.time() - t_start) * 1000
        return ExecutionResult(
            success=False,
            stdout="",
            stderr=f"Timeout efter {timeout}s",
            exit_code=-1,
            elapsed_ms=elapsed,
            timed_out=True,
        )
    except Exception as e:
        elapsed = (time.time() - t_start) * 1000
        return ExecutionResult(
            success=False,
            stdout="",
            stderr=str(e),
            exit_code=-1,
            elapsed_ms=elapsed,
        )
    finally:
        try:
            os.unlink(tmp_path)
        except OSError:
            pass


def evaluate_solution(task: Task, code: str) -> EvalResult:
    """Evaluera en lösning mot alla testfall.
    
    Returns:
        EvalResult med score 0.0-1.0
    """
    details = []
    passed = 0
    total_time = 0.0

    for i, tc in enumerate(task.test_cases):
        result = execute_code(code, input_data=tc.input_data)
        total_time += result.elapsed_ms

        actual = result.stdout.strip()
        expected = tc.expected_output.strip()
        ok = actual == expected

        if ok:
            passed += 1

        details.append({
            "test": i + 1,
            "description": tc.description,
            "input": tc.input_data.strip(),
            "expected": expected,
            "actual": actual,
            "passed": ok,
            "error": result.stderr if not result.success else "",
            "timed_out": result.timed_out,
        })

    total = len(task.test_cases)
    score = passed / total if total > 0 else 0.0

    # Generera feedback
    if score == 1.0:
        feedback = f"Perfekt! Alla {total} test passerade."
    elif score >= 0.5:
        failed = [d for d in details if not d["passed"]]
        feedback = f"{passed}/{total} test passerade. "
        if failed:
            f = failed[0]
            if f["error"]:
                feedback += f"Fel: {f['error'][:200]}"
            else:
                feedback += f"Test {f['test']}: Förväntade '{f['expected']}' men fick '{f['actual']}'"
    elif score > 0:
        failed = [d for d in details if not d["passed"]]
        f = failed[0]
        if f["timed_out"]:
            feedback = "Koden tog för lång tid. Optimera din lösning."
        elif f["error"]:
            feedback = f"Syntaxfel eller runtime-fel: {f['error'][:300]}"
        else:
            feedback = f"Fel output. Förväntade '{f['expected']}' men fick '{f['actual']}'. Kontrollera din logik."
    else:
        first = details[0] if details else {}
        if first.get("timed_out"):
            feedback = "Timeout på alla test. Koden kanske har en oändlig loop."
        elif first.get("error"):
            feedback = f"Koden kraschar: {first['error'][:300]}"
        else:
            feedback = f"Inget test passerade. Förväntade '{first.get('expected', '?')}' men fick '{first.get('actual', 'inget')}'"

    return EvalResult(
        task_id=task.id,
        score=score,
        passed=passed,
        total=total,
        details=details,
        code=code,
        execution_time_ms=total_time,
        feedback=feedback,
    )
