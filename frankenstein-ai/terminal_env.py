"""
Terminal Environment for Frankenstein AI.

Provides a sandboxed bash execution environment where the agent can:
- Execute sequences of bash commands
- Observe stdout/stderr output
- Manipulate files in a temporary workspace
- Be verified against state-based test conditions

Inspired by Terminal-Bench 2.0 (Stanford/Laude Institute) but adapted
for continuous training with generated tasks.
"""

import subprocess
import tempfile
import shutil
import os
import time
import re
from pathlib import Path
from dataclasses import dataclass, field
from typing import Optional


@dataclass
class BashResult:
    """Result from a single bash command execution."""
    command: str
    stdout: str
    stderr: str
    exit_code: int
    elapsed_ms: float
    timed_out: bool = False


@dataclass
class TerminalTestCase:
    """A test condition that checks the final state of the workspace.
    
    Unlike stdin/stdout tests, these check filesystem state, file contents,
    command outputs, etc.
    """
    description: str
    check_type: str  # "file_exists", "file_contains", "file_equals", "command_output", "file_not_exists", "dir_exists", "file_permissions"
    target: str      # filepath or command
    expected: str    # expected value/pattern
    case_sensitive: bool = True


@dataclass
class TerminalTask:
    """A terminal-based task requiring sequential bash commands."""
    id: str
    title: str
    description: str
    instruction: str  # Detailed instruction for the agent
    difficulty: int   # 1-10
    category: str
    test_cases: list[TerminalTestCase]
    hints: list[str] = field(default_factory=list)
    tags: list[str] = field(default_factory=list)
    max_steps: int = 15        # Max bash commands allowed
    time_limit_s: float = 60.0  # Total time limit
    setup_commands: list[str] = field(default_factory=list)  # Commands to run before agent starts


@dataclass
class TerminalEvalResult:
    """Result from evaluating a terminal task."""
    task_id: str
    score: float  # 0.0 - 1.0
    passed: int
    total: int
    details: list[dict]
    commands_used: list[BashResult]
    total_steps: int
    total_time_ms: float
    feedback: str


class TerminalSandbox:
    """Sandboxed terminal environment using WSL bash on Windows.
    
    Creates workspace in WSL's /tmp/ filesystem and executes all commands
    via 'bash -c "cd <wsl_path> && ..."'. File I/O also goes through bash.
    """

    BLOCKED_COMMANDS = {
        "rm -rf /", "rm -rf /*", "mkfs", "dd if=/dev/zero",
        ":(){ :|:& };:", "shutdown", "reboot", "halt",
        "curl", "wget",
    }

    BLOCKED_PATTERNS = [
        r"rm\s+-rf\s+/[^a-zA-Z]",
        r">\s*/dev/sd",
        r"chmod\s+777\s+/",
    ]

    def __init__(self, workspace_dir: Optional[str] = None):
        if workspace_dir:
            self.wsl_workspace = workspace_dir
            self._owns_workspace = False
        else:
            # Create workspace in WSL /tmp/ via bash
            result = subprocess.run(
                ["bash", "-c", "mktemp -d /tmp/frank_XXXXXX"],
                capture_output=True, text=True, timeout=10,
            )
            self.wsl_workspace = result.stdout.strip()
            if not self.wsl_workspace or result.returncode != 0:
                # Fallback
                import uuid
                self.wsl_workspace = f"/tmp/frank_{uuid.uuid4().hex[:8]}"
                subprocess.run(["bash", "-c", f"mkdir -p {self.wsl_workspace}"],
                               capture_output=True, timeout=10)
            self._owns_workspace = True

        # Keep Path for compatibility but it won't be used for file I/O
        self.workspace = Path(self.wsl_workspace)
        self.command_history: list[BashResult] = []
        self.total_time_ms = 0.0

    def setup(self, commands: list[str]) -> None:
        """Run setup commands to prepare the workspace."""
        for cmd in commands:
            self.execute(cmd, timeout=30.0, record=False)

    def execute(self, command: str, timeout: float = 10.0, record: bool = True) -> BashResult:
        """Execute a bash command in the WSL sandbox."""
        if self._is_blocked(command):
            result = BashResult(
                command=command,
                stdout="",
                stderr=f"BLOCKED: Command '{command}' is not allowed in sandbox.",
                exit_code=126,
                elapsed_ms=0.0,
            )
            if record:
                self.command_history.append(result)
            return result

        # Wrap command: cd to workspace first
        wrapped = f"cd {self.wsl_workspace} && {command}"

        t_start = time.time()
        try:
            proc = subprocess.run(
                ["bash", "-c", wrapped],
                capture_output=True,
                text=True,
                timeout=timeout,
                env={
                    **os.environ,
                    "HOME": self.wsl_workspace,
                    "WORKSPACE": self.wsl_workspace,
                    "LANG": "en_US.UTF-8",
                    "PYTHONDONTWRITEBYTECODE": "1",
                    "TERM": "dumb",
                },
            )
            elapsed = (time.time() - t_start) * 1000
            result = BashResult(
                command=command,
                stdout=proc.stdout[:5000],
                stderr=proc.stderr[:2000],
                exit_code=proc.returncode,
                elapsed_ms=elapsed,
            )
        except subprocess.TimeoutExpired:
            elapsed = (time.time() - t_start) * 1000
            result = BashResult(
                command=command,
                stdout="",
                stderr=f"Timeout after {timeout}s",
                exit_code=-1,
                elapsed_ms=elapsed,
                timed_out=True,
            )
        except Exception as e:
            elapsed = (time.time() - t_start) * 1000
            result = BashResult(
                command=command,
                stdout="",
                stderr=str(e)[:500],
                exit_code=-1,
                elapsed_ms=elapsed,
            )

        if record:
            self.command_history.append(result)
            self.total_time_ms += result.elapsed_ms

        return result

    def _is_blocked(self, command: str) -> bool:
        """Check if a command is blocked for safety."""
        cmd_lower = command.strip().lower()
        for blocked in self.BLOCKED_COMMANDS:
            if blocked in cmd_lower:
                return True
        for pattern in self.BLOCKED_PATTERNS:
            if re.search(pattern, command):
                return True
        return False

    def read_file(self, path: str) -> Optional[str]:
        """Read a file from the WSL workspace via bash cat."""
        result = subprocess.run(
            ["bash", "-c", f"cat '{self.wsl_workspace}/{path}' 2>/dev/null"],
            capture_output=True, text=True, timeout=5,
        )
        if result.returncode != 0:
            return None
        return result.stdout[:10000]

    def list_files(self, path: str = ".") -> list[str]:
        """List files in the WSL workspace via bash find."""
        target = f"{self.wsl_workspace}/{path}" if path != "." else self.wsl_workspace
        result = subprocess.run(
            ["bash", "-c", f"find '{target}' -type f 2>/dev/null | head -50"],
            capture_output=True, text=True, timeout=5,
        )
        if result.returncode != 0 or not result.stdout.strip():
            return []
        files = []
        for line in result.stdout.strip().split("\n"):
            # Make relative to workspace
            rel = line.replace(self.wsl_workspace + "/", "").strip()
            if rel:
                files.append(rel)
        return files

    def cleanup(self) -> None:
        """Remove the WSL workspace."""
        if self._owns_workspace:
            try:
                subprocess.run(
                    ["bash", "-c", f"rm -rf '{self.wsl_workspace}'"],
                    capture_output=True, timeout=10,
                )
            except Exception:
                pass

    def __enter__(self):
        return self

    def __exit__(self, *args):
        self.cleanup()


def evaluate_terminal_task(task: TerminalTask, sandbox: TerminalSandbox) -> TerminalEvalResult:
    """Evaluate a terminal task by checking test conditions against workspace state.
    
    Args:
        task: The terminal task with test cases
        sandbox: The sandbox after agent has executed commands
        
    Returns:
        TerminalEvalResult with score and details
    """
    details = []
    passed = 0

    for i, tc in enumerate(task.test_cases):
        ok = False
        actual = ""

        try:
            if tc.check_type == "file_exists":
                chk = sandbox.execute(f"test -f '{tc.target}' && echo YES || echo NO", timeout=5.0, record=False)
                ok = chk.stdout.strip() == "YES"
                actual = "exists" if ok else "not found"

            elif tc.check_type == "file_not_exists":
                chk = sandbox.execute(f"test -e '{tc.target}' && echo YES || echo NO", timeout=5.0, record=False)
                ok = chk.stdout.strip() == "NO"
                actual = "not found" if ok else "exists"

            elif tc.check_type == "dir_exists":
                chk = sandbox.execute(f"test -d '{tc.target}' && echo YES || echo NO", timeout=5.0, record=False)
                ok = chk.stdout.strip() == "YES"
                actual = "directory exists" if ok else "not a directory"

            elif tc.check_type == "file_contains":
                content = sandbox.read_file(tc.target) or ""
                if tc.case_sensitive:
                    ok = tc.expected in content
                else:
                    ok = tc.expected.lower() in content.lower()
                actual = f"{'contains' if ok else 'missing'} '{tc.expected[:50]}'"

            elif tc.check_type == "file_equals":
                content = (sandbox.read_file(tc.target) or "").strip()
                expected = tc.expected.strip()
                if tc.case_sensitive:
                    ok = content == expected
                else:
                    ok = content.lower() == expected.lower()
                actual = content[:200] if content else "(empty)"

            elif tc.check_type == "command_output":
                result = sandbox.execute(tc.target, timeout=10.0, record=False)
                actual = result.stdout.strip()
                expected = tc.expected.strip()
                if tc.case_sensitive:
                    ok = actual == expected
                else:
                    ok = actual.lower() == expected.lower()

            elif tc.check_type == "file_permissions":
                result = sandbox.execute(f"stat -c '%a' '{tc.target}'", timeout=5.0, record=False)
                actual = result.stdout.strip()
                ok = actual == tc.expected.strip()

            elif tc.check_type == "file_line_count":
                content = sandbox.read_file(tc.target) or ""
                line_count = len(content.strip().split("\n")) if content.strip() else 0
                actual = str(line_count)
                ok = actual == tc.expected.strip()

            elif tc.check_type == "file_matches_regex":
                content = sandbox.read_file(tc.target) or ""
                ok = bool(re.search(tc.expected, content))
                actual = f"{'matches' if ok else 'no match'} /{tc.expected[:50]}/"

            else:
                actual = f"Unknown check_type: {tc.check_type}"

        except Exception as e:
            actual = f"Error: {str(e)[:200]}"

        if ok:
            passed += 1

        details.append({
            "test": i + 1,
            "description": tc.description,
            "check_type": tc.check_type,
            "target": tc.target,
            "expected": tc.expected[:200],
            "actual": actual,
            "passed": ok,
        })

    total = len(task.test_cases)
    score = passed / total if total > 0 else 0.0

    # Generate feedback
    if score == 1.0:
        feedback = f"Perfekt! Alla {total} villkor uppfyllda."
    elif score > 0:
        failed = [d for d in details if not d["passed"]]
        f = failed[0]
        feedback = (
            f"{passed}/{total} villkor uppfyllda. "
            f"Missade: {f['description']} — "
            f"förväntade '{f['expected'][:100]}' men fick '{f['actual'][:100]}'"
        )
    else:
        first = details[0] if details else {}
        feedback = (
            f"Inget villkor uppfyllt. "
            f"Första: {first.get('description', '?')} — "
            f"förväntade '{first.get('expected', '?')[:100]}' men fick '{first.get('actual', '?')[:100]}'"
        )

    return TerminalEvalResult(
        task_id=task.id,
        score=score,
        passed=passed,
        total=total,
        details=details,
        commands_used=sandbox.command_history,
        total_steps=len(sandbox.command_history),
        total_time_ms=sandbox.total_time_ms,
        feedback=feedback,
    )
