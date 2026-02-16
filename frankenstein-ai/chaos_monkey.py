"""
Chaos Monkey for Frankenstein AI — Self-Correction Training.

Introduces subtle bugs into correct solutions to test whether
the LLM agent can identify and fix them autonomously.

Mutation types:
1. Off-by-one errors (change < to <=, range(n) to range(n-1))
2. Wrong operator (+/-, *//, and/or)
3. Variable swap (swap two variable names)
4. Missing edge case (remove if-guard for empty input)
5. Output format error (change separator, add/remove newline)
"""

import random
import re
import ast
from dataclasses import dataclass
from programming_env import Task, TestCase


@dataclass
class ChaosTask:
    """A task with a known-correct solution that has been intentionally broken."""
    original_task: Task
    correct_code: str
    broken_code: str
    mutation_type: str
    mutation_description: str


def mutate_solution(code: str) -> tuple[str, str, str] | None:
    """Apply a random mutation to correct code.
    
    Returns (broken_code, mutation_type, description) or None if no mutation possible.
    """
    mutations = [
        _mutate_off_by_one,
        _mutate_wrong_operator,
        _mutate_comparison_flip,
        _mutate_output_format,
        _mutate_index_error,
        _mutate_wrong_init,
    ]
    random.shuffle(mutations)
    for mutator in mutations:
        result = mutator(code)
        if result:
            return result
    return None


def _mutate_off_by_one(code: str) -> tuple[str, str, str] | None:
    """Change range(n) to range(n-1) or range(n+1)."""
    pattern = r'range\((\w+)\)'
    matches = list(re.finditer(pattern, code))
    if not matches:
        return None
    match = random.choice(matches)
    var = match.group(1)
    if random.random() < 0.5:
        replacement = f'range({var}-1)'
        desc = f"Off-by-one: range({var}) → range({var}-1)"
    else:
        replacement = f'range({var}+1)'
        desc = f"Off-by-one: range({var}) → range({var}+1)"
    broken = code[:match.start()] + replacement + code[match.end():]
    return broken, "off_by_one", desc


def _mutate_wrong_operator(code: str) -> tuple[str, str, str] | None:
    """Swap + with -, or * with //."""
    swaps = [
        (r'(?<!=)\+(?!=)', '-', "Operator swap: + → -"),
        (r'(?<!=)-(?!=)', '+', "Operator swap: - → +"),
        (r'\*(?!\*)', '//', "Operator swap: * → //"),
    ]
    random.shuffle(swaps)
    for pattern, replacement, desc in swaps:
        matches = list(re.finditer(pattern, code))
        # Filter out matches inside strings
        code_matches = [m for m in matches if not _in_string(code, m.start())]
        if code_matches:
            match = random.choice(code_matches)
            broken = code[:match.start()] + replacement + code[match.end():]
            if broken != code:
                return broken, "wrong_operator", desc
    return None


def _mutate_comparison_flip(code: str) -> tuple[str, str, str] | None:
    """Flip < to <=, > to >=, == to !=."""
    swaps = [
        (r'(?<!=)<(?!=)', '<=', "Comparison flip: < → <="),
        (r'(?<!=)>(?!=)', '>=', "Comparison flip: > → >="),
        (r'<=', '<', "Comparison flip: <= → <"),
        (r'>=', '>', "Comparison flip: >= → >"),
    ]
    random.shuffle(swaps)
    for pattern, replacement, desc in swaps:
        matches = list(re.finditer(pattern, code))
        code_matches = [m for m in matches if not _in_string(code, m.start())]
        if code_matches:
            match = random.choice(code_matches)
            broken = code[:match.start()] + replacement + code[match.end():]
            if broken != code:
                return broken, "comparison_flip", desc
    return None


def _mutate_output_format(code: str) -> tuple[str, str, str] | None:
    """Change output separator or add extra whitespace."""
    if "' '.join" in code:
        broken = code.replace("' '.join", "','.join", 1)
        return broken, "output_format", "Output format: space-separated → comma-separated"
    if "print(" in code and "\\n" not in code:
        # Add extra print at end
        broken = code + "\nprint()"
        return broken, "output_format", "Output format: extra empty line at end"
    return None


def _mutate_index_error(code: str) -> tuple[str, str, str] | None:
    """Change [0] to [1] or [-1] to [-2]."""
    patterns = [
        (r'\[0\]', '[1]', "Index error: [0] → [1]"),
        (r'\[-1\]', '[-2]', "Index error: [-1] → [-2]"),
    ]
    random.shuffle(patterns)
    for pattern, replacement, desc in patterns:
        matches = list(re.finditer(pattern, code))
        if matches:
            match = random.choice(matches)
            broken = code[:match.start()] + replacement + code[match.end():]
            return broken, "index_error", desc
    return None


def _mutate_wrong_init(code: str) -> tuple[str, str, str] | None:
    """Change initial value: 0 to 1, or float('inf') to 0."""
    if "= 0\n" in code:
        # Change first "= 0" to "= 1"
        broken = code.replace("= 0\n", "= 1\n", 1)
        return broken, "wrong_init", "Wrong init: = 0 → = 1"
    if "float('inf')" in code:
        broken = code.replace("float('inf')", "0", 1)
        return broken, "wrong_init", "Wrong init: float('inf') → 0"
    if "float('-inf')" in code:
        broken = code.replace("float('-inf')", "0", 1)
        return broken, "wrong_init", "Wrong init: float('-inf') → 0"
    return None


def _in_string(code: str, pos: int) -> bool:
    """Check if position is inside a string literal (rough heuristic)."""
    line_start = code.rfind('\n', 0, pos) + 1
    line = code[line_start:pos]
    return line.count("'") % 2 == 1 or line.count('"') % 2 == 1


def create_chaos_task(task: Task, correct_code: str) -> ChaosTask | None:
    """Create a chaos task from a correct solution.
    
    Returns ChaosTask with broken code, or None if mutation failed.
    """
    result = mutate_solution(correct_code)
    if not result:
        return None
    broken_code, mutation_type, description = result
    
    # Verify the broken code actually fails (otherwise mutation was trivial)
    from programming_env import evaluate_solution
    broken_result = evaluate_solution(task, broken_code)
    if broken_result.score >= 1.0:
        # Mutation didn't break anything — try again
        return None
    
    # Create a new task that asks the agent to fix the broken code
    fix_task = Task(
        id=f"chaos-{mutation_type}-{task.id}",
        title=f"Fixa bugg: {task.title}",
        description=(
            f"Följande kod ska lösa: {task.description}\n\n"
            f"Men koden har en bugg. Identifiera och fixa buggen.\n\n"
            f"Buggig kod:\n```python\n{broken_code}\n```\n\n"
            f"Skriv den korrigerade koden."
        ),
        difficulty=task.difficulty + 1,
        category="chaos_" + task.category,
        test_cases=task.test_cases,
        hints=[f"Buggen är av typen: {mutation_type.replace('_', ' ')}"],
        tags=["chaos_monkey", "debugging", mutation_type] + task.tags,
    )
    
    return ChaosTask(
        original_task=task,
        correct_code=correct_code,
        broken_code=broken_code,
        mutation_type=mutation_type,
        mutation_description=description,
    )


def generate_refactor_task(task: Task, correct_code: str) -> Task | None:
    """Create a refactoring challenge from a correct but naive solution.
    
    Asks the agent to optimize the code (e.g., reduce time complexity,
    use fewer lines, or use a different algorithm).
    """
    lines = correct_code.strip().split('\n')
    if len(lines) < 3:
        return None
    
    # Pick a refactoring challenge type
    challenges = []
    
    if 'for' in correct_code and correct_code.count('for') >= 2:
        challenges.append(("optimize", 
            "Optimera koden så att den använder färre nästlade loopar. "
            "Tidskomplexiteten ska vara bättre än O(n²) om möjligt."))
    
    if len(lines) > 8:
        challenges.append(("compact",
            "Skriv om koden mer kompakt — max hälften så många rader, "
            "men fortfarande läsbar och korrekt."))
    
    if 'import' not in correct_code and any(kw in correct_code for kw in ['sorted', 'sum', 'max', 'min']):
        challenges.append(("functional",
            "Skriv om koden i funktionell stil med map/filter/reduce "
            "eller list comprehensions istället för explicita loopar."))
    
    if not challenges:
        return None
    
    challenge_type, challenge_desc = random.choice(challenges)
    
    return Task(
        id=f"refactor-{challenge_type}-{task.id}",
        title=f"Refaktorera: {task.title}",
        description=(
            f"Originaluppgift: {task.description}\n\n"
            f"Nuvarande lösning:\n```python\n{correct_code}\n```\n\n"
            f"UTMANING: {challenge_desc}\n\n"
            f"Koden måste fortfarande producera exakt samma output."
        ),
        difficulty=min(10, task.difficulty + 2),
        category="refactor_" + task.category,
        test_cases=task.test_cases,
        hints=["Behåll samma I/O-beteende, ändra bara implementationen"],
        tags=["refactor", challenge_type] + task.tags,
    )
