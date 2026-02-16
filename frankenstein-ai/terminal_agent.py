"""
Terminal Agent for Frankenstein AI.

A sequential agent that solves terminal tasks by:
1. Observing the task instruction
2. Planning a sequence of bash commands via LLM
3. Executing each command and observing output
4. Adapting plan based on results (errors, unexpected output)
5. Learning from experience via HDC/AIF/Ebbinghaus

This is the "Terminus-style" agent loop adapted for Frankenstein's
cognitive architecture, inspired by Terminal-Bench 2.0.
"""

import time
import os
import re
import requests
from pathlib import Path
from dataclasses import dataclass, field
from typing import Optional

from terminal_env import (
    TerminalSandbox, TerminalTask, TerminalTestCase,
    TerminalEvalResult, BashResult, evaluate_terminal_task,
)
from terminal_solver import solve_deterministic

# Ladda API-nycklar från bridge/.env (samma mönster som code_agent.py)
_env_path = Path(__file__).parent.parent / "bridge" / ".env"
_env_vars: dict[str, str] = {}
if _env_path.exists():
    for line in _env_path.read_text().splitlines():
        if "=" in line and not line.startswith("#"):
            k, v = line.split("=", 1)
            _env_vars[k.strip()] = v.strip()

GEMINI_API_KEY = _env_vars.get("GEMINI_API_KEY", os.environ.get("GEMINI_API_KEY", ""))
XAI_API_KEY = _env_vars.get("XAI_API_KEY", os.environ.get("XAI_API_KEY", ""))


@dataclass
class TerminalAttempt:
    """Record of a terminal task attempt."""
    task_id: str
    commands: list[BashResult]
    score: float
    feedback: str
    strategy: str
    total_steps: int
    total_time_ms: float


class TerminalAgent:
    """Agent that solves terminal tasks via sequential bash command execution.
    
    Architecture:
    ┌──────────────┐     ┌───────────┐     ┌──────────────┐
    │  Instruction  │ →  │  LLM Plan │ →  │  Bash Execute │
    │  + Context    │    │  (Steps)  │    │  (Sandbox)    │
    └──────────────┘     └───────────┘     └──────┬───────┘
                                                   │
                              ┌─────────────────────▼──────┐
                              │     Observe Output         │
                              │  (stdout/stderr/exitcode)  │
                              └─────────────────────┬──────┘
                                                    │
                              ┌──────────────────────▼─────┐
                              │  Adapt: Re-plan if error   │
                              │  or unexpected output      │
                              └────────────────────────────┘
    """

    def __init__(self):
        self.total_tasks = 0
        self.total_solved = 0
        self.all_attempts: list[TerminalAttempt] = []
        self.command_patterns: dict[str, list[str]] = {}  # category → successful command sequences
        self.llm_stats = {
            "calls": 0, "successes": 0, "failures": 0,
            "rate_limits": 0, "retries": 0,
        }
        self._last_llm_call = 0.0

    def solve_task(self, task: TerminalTask, verbose: bool = True, step_callback=None) -> TerminalEvalResult:
        """Solve a terminal task using sequential bash commands.
        
        Flow:
        1. Setup sandbox + run setup commands
        2. Get initial plan from LLM
        3. Execute commands one by one
        4. After each command: observe, decide next action
        5. Evaluate final state against test cases
        
        step_callback: optional callable(step, command, result) for live updates
        """
        self.total_tasks += 1
        t_start = time.time()

        with TerminalSandbox() as sandbox:
            # Setup workspace
            if task.setup_commands:
                sandbox.setup(task.setup_commands)

            # Try deterministic solver first (guaranteed correct if matched)
            plan = solve_deterministic(task)
            if plan:
                if verbose:
                    print(f"    [solver] Deterministic match ({len(plan)} cmds)")
            else:
                # Fallback to LLM
                plan = self._get_plan(task, [], sandbox)
                if not plan:
                    plan = self._heuristic_plan(task)

            # Execute plan step by step
            step = 0
            while step < task.max_steps and plan:
                command = plan.pop(0)

                if verbose:
                    print(f"    [{step+1}] $ {command[:80]}", end="")

                result = sandbox.execute(command, timeout=15.0)

                if verbose:
                    if result.exit_code == 0:
                        out_preview = result.stdout[:60].replace("\n", " ") if result.stdout else ""
                        print(f" → ok{' (' + out_preview + ')' if out_preview else ''}")
                    else:
                        err_preview = result.stderr[:60].replace("\n", " ") if result.stderr else ""
                        print(f" → ERR({result.exit_code}) {err_preview}")

                step += 1

                # Live callback for real-time UI
                if step_callback:
                    try:
                        step_callback(step, command, result)
                    except Exception:
                        pass

                # If error and no more planned commands: re-plan
                if result.exit_code != 0 and not plan and step < task.max_steps - 1:
                    if verbose:
                        print(f"    [re-plan] Error detected, asking LLM for recovery...")
                    plan = self._get_recovery_plan(task, sandbox, result)

                # If plan is empty but we have steps left: check if we need more
                if not plan and step < task.max_steps - 2:
                    # Quick check: are we done?
                    quick_eval = evaluate_terminal_task(task, sandbox)
                    if quick_eval.score < 1.0:
                        # Not done yet, get more commands
                        plan = self._get_continuation_plan(task, sandbox)

            # Final evaluation
            eval_result = evaluate_terminal_task(task, sandbox)

        total_time = (time.time() - t_start) * 1000

        # Record attempt
        attempt = TerminalAttempt(
            task_id=task.id,
            commands=sandbox.command_history if hasattr(sandbox, 'command_history') else [],
            score=eval_result.score,
            feedback=eval_result.feedback,
            strategy="terminal_agent",
            total_steps=eval_result.total_steps,
            total_time_ms=total_time,
        )
        self.all_attempts.append(attempt)

        if eval_result.score >= 1.0:
            self.total_solved += 1
            # Store successful command pattern
            cmds = [r.command for r in eval_result.commands_used]
            self.command_patterns.setdefault(task.category, []).append(cmds)
            # Keep only last 10 patterns per category
            if len(self.command_patterns[task.category]) > 10:
                self.command_patterns[task.category] = self.command_patterns[task.category][-10:]

        return eval_result

    def _get_plan(self, task: TerminalTask, history: list[BashResult], sandbox: TerminalSandbox) -> list[str]:
        """Get a plan (list of bash commands) from LLM."""
        # Check for known patterns first
        if task.category in self.command_patterns and self.command_patterns[task.category]:
            # Use pattern as hint
            pattern_hint = "\n".join(f"  {c}" for c in self.command_patterns[task.category][-1][:5])
        else:
            pattern_hint = ""

        prompt = self._build_plan_prompt(task, history, pattern_hint)
        response = self._call_llm(prompt, temperature=0.3)

        if not response:
            return []

        return self._parse_commands(response)

    def _get_recovery_plan(self, task: TerminalTask, sandbox: TerminalSandbox, error: BashResult) -> list[str]:
        """Get recovery commands after an error."""
        prompt = (
            f"Du försökte lösa en terminal-uppgift men fick ett fel.\n\n"
            f"UPPGIFT: {task.instruction}\n\n"
            f"SENASTE KOMMANDO: {error.command}\n"
            f"FEL: {error.stderr[:500]}\n"
            f"EXIT CODE: {error.exit_code}\n\n"
            f"TIDIGARE KOMMANDON:\n"
        )
        for r in sandbox.command_history[-5:]:
            status = "OK" if r.exit_code == 0 else f"ERR({r.exit_code})"
            prompt += f"  $ {r.command} → {status}\n"

        prompt += (
            f"\nFIXA felet och fortsätt lösa uppgiften.\n"
            f"Svara BARA med bash-kommandon, ett per rad. Inga förklaringar.\n"
            f"Max 5 kommandon."
        )

        response = self._call_llm(prompt, temperature=0.4)
        if not response:
            return []
        return self._parse_commands(response)[:5]

    def _get_continuation_plan(self, task: TerminalTask, sandbox: TerminalSandbox) -> list[str]:
        """Get additional commands to complete the task."""
        prompt = (
            f"Du håller på att lösa en terminal-uppgift men är inte klar.\n\n"
            f"UPPGIFT: {task.instruction}\n\n"
            f"UTFÖRDA KOMMANDON:\n"
        )
        for r in sandbox.command_history[-8:]:
            status = "OK" if r.exit_code == 0 else f"ERR({r.exit_code})"
            out = r.stdout[:100].replace("\n", " ") if r.stdout else ""
            prompt += f"  $ {r.command} → {status} {out}\n"

        # Show current workspace state
        files = sandbox.list_files()
        if files:
            prompt += f"\nFILER I WORKSPACE:\n  " + "\n  ".join(files[:20]) + "\n"

        prompt += (
            f"\nVad mer behövs? Svara BARA med bash-kommandon, ett per rad.\n"
            f"Max 5 kommandon."
        )

        response = self._call_llm(prompt, temperature=0.3)
        if not response:
            return []
        return self._parse_commands(response)[:5]

    def _heuristic_plan(self, task: TerminalTask) -> list[str]:
        """Generate a simple heuristic plan without LLM."""
        commands = []
        instruction = task.instruction.lower()

        # File creation
        if "skapa filen" in instruction or "create" in instruction:
            # Try to extract filename and content from instruction
            pass

        # Directory creation
        if "katalog" in instruction or "mkdir" in instruction:
            for tc in task.test_cases:
                if tc.check_type == "dir_exists":
                    commands.append(f"mkdir -p '{tc.target}'")

        # File existence checks suggest we need to create files
        for tc in task.test_cases:
            if tc.check_type == "file_exists" and tc.target not in [t.target for t in task.test_cases if t.check_type == "file_equals"]:
                commands.append(f"touch '{tc.target}'")

        return commands

    def _build_plan_prompt(self, task: TerminalTask, history: list[BashResult], pattern_hint: str = "") -> str:
        """Build the LLM prompt for planning."""
        prompt = (
            "Du ar en expert terminal-agent. Svara BARA med bash-kommandon, ett per rad.\n"
            "Inga forklaringar, inga kommentarer, bara kommandon.\n"
            "Varje kommando kors i en sandboxad Linux workspace-katalog.\n\n"
            "VIKTIGA REGLER:\n"
            "- Anvand python3 (INTE python)\n"
            "- For att skapa filer med innehall: anvand heredoc (cat > fil << 'EOF'\\n...\\nEOF)\n"
            "- Skriv KOMPAKTA kommandon. Undvik onodigt manga steg.\n"
            "- Alla filer skapas relativt till workspace-katalogen.\n\n"
        )

        prompt += f"UPPGIFT: {task.title}\n"
        prompt += f"INSTRUKTION:\n{task.instruction}\n\n"

        # Show what files already exist in workspace
        if task.setup_commands:
            prompt += "FILER SOM REDAN FINNS I WORKSPACE (skapade automatiskt, anvand dem):\n"
            for sc in task.setup_commands:
                prompt += f"  setup: {sc}\n"
            prompt += "\n"

        if task.hints:
            prompt += f"TIPS: {'; '.join(task.hints)}\n\n"

        if pattern_hint:
            prompt += f"LIKNANDE LOST UPPGIFT (anvand som inspiration):\n{pattern_hint}\n\n"

        if history:
            prompt += "TIDIGARE KOMMANDON:\n"
            for r in history[-5:]:
                status = "OK" if r.exit_code == 0 else f"ERR({r.exit_code})"
                prompt += f"  $ {r.command} → {status}\n"
            prompt += "\n"

        prompt += f"Svara med max {task.max_steps} bash-kommandon:\n"

        return prompt

    def _parse_commands(self, response: str) -> list[str]:
        """Parse bash commands from LLM response.
        
        Handles:
        - Heredocs (cat > file << 'EOF' ... EOF)
        - Backslash line continuations
        - Markdown code blocks
        - Numbered lists and prompt markers
        """
        commands = []
        lines = response.strip().split("\n")
        in_heredoc = False
        heredoc_marker = ""
        heredoc_buf = []
        in_code_block = False

        for line in lines:
            raw_line = line
            line = line.strip()

            # Track markdown code blocks
            if line.startswith("```"):
                in_code_block = not in_code_block
                continue

            # Inside heredoc: accumulate until marker
            if in_heredoc:
                if line == heredoc_marker:
                    heredoc_buf.append(line)
                    commands.append("\n".join(heredoc_buf))
                    heredoc_buf = []
                    in_heredoc = False
                    heredoc_marker = ""
                else:
                    heredoc_buf.append(raw_line)  # Preserve indentation
                continue

            # Skip empty lines and comments
            if not line or line.startswith("#") or line.startswith("//"):
                continue

            # Remove leading $ or > prompt markers
            if line.startswith("$ "):
                line = line[2:]
            elif line.startswith("> "):
                line = line[2:]

            # Remove numbered list prefixes (1. 2. etc)
            line = re.sub(r"^\d+\.\s*", "", line)

            # Skip if it looks like explanation text (not a command)
            if not line:
                continue
            if len(line) > 300:
                continue
            if line.endswith(":") and not line.endswith(";;"):
                continue
            if any(line.startswith(w) for w in ["Förklaring", "Obs:", "Notera:", "This ", "Note:"]):
                continue

            # Check for heredoc start
            heredoc_match = re.search(r"<<\s*['\"]?(\w+)['\"]?\s*$", line)
            if heredoc_match:
                heredoc_marker = heredoc_match.group(1)
                heredoc_buf = [line]
                in_heredoc = True
                continue

            # Backslash continuation
            if commands and commands[-1].endswith("\\"):
                commands[-1] = commands[-1][:-1] + " " + line
                continue

            if line:
                commands.append(line)

        # If heredoc was never closed, still add what we have
        if heredoc_buf:
            commands.append("\n".join(heredoc_buf))

        return commands

    def _call_llm(self, prompt: str, temperature: float = 0.3) -> Optional[str]:
        """Call LLM API with throttling."""
        if not GEMINI_API_KEY and not XAI_API_KEY:
            return None

        providers = []
        if GEMINI_API_KEY:
            providers.append("gemini")
        if XAI_API_KEY:
            providers.append("grok")

        for provider in providers:
            for attempt in range(3):
                # Throttle: 5s between calls
                elapsed = time.time() - self._last_llm_call
                if elapsed < 5.0:
                    time.sleep(5.0 - elapsed)
                self._last_llm_call = time.time()

                self.llm_stats["calls"] += 1
                try:
                    if provider == "gemini":
                        resp = requests.post(
                            f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={GEMINI_API_KEY}",
                            json={
                                "contents": [{"parts": [{"text": prompt}]}],
                                "generationConfig": {"temperature": temperature, "maxOutputTokens": 1024},
                            },
                            timeout=30,
                        )
                    else:  # grok
                        resp = requests.post(
                            "https://api.x.ai/v1/chat/completions",
                            headers={"Authorization": f"Bearer {XAI_API_KEY}"},
                            json={
                                "model": "grok-3-mini-fast",
                                "messages": [{"role": "user", "content": prompt}],
                                "temperature": temperature,
                                "max_tokens": 1024,
                            },
                            timeout=30,
                        )

                    if resp.status_code == 200:
                        self.llm_stats["successes"] += 1
                        if provider == "gemini":
                            data = resp.json()
                            return data["candidates"][0]["content"]["parts"][0]["text"]
                        else:
                            data = resp.json()
                            return data["choices"][0]["message"]["content"]

                    if resp.status_code == 429:
                        self.llm_stats["rate_limits"] += 1
                        wait = min(2 ** attempt * 3, 20)
                        time.sleep(wait)
                        self.llm_stats["retries"] += 1
                        continue

                    self.llm_stats["failures"] += 1
                    break

                except requests.exceptions.Timeout:
                    self.llm_stats["failures"] += 1
                    continue
                except Exception:
                    self.llm_stats["failures"] += 1
                    break

        return None

    def get_stats(self) -> dict:
        """Get agent statistics."""
        return {
            "total_tasks": self.total_tasks,
            "total_solved": self.total_solved,
            "solve_rate": self.total_solved / max(self.total_tasks, 1),
            "known_patterns": sum(len(v) for v in self.command_patterns.values()),
            "categories_learned": list(self.command_patterns.keys()),
            "llm_stats": dict(self.llm_stats),
        }
