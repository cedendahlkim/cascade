/**
 * System command tools for the AI agent.
 * 
 * Allows running shell commands with security checks,
 * timeout protection, and output capture.
 * Uses PowerShell as default shell on Windows.
 */
import { execFileSync, execSync } from "child_process";
import Anthropic from "@anthropic-ai/sdk";
import { checkCommandPermission, auditLog } from "./security.js";
import { isAbsolute, join } from "path";

function audit(tool: string, input: string, allowed: boolean, reason?: string) {
  auditLog({ timestamp: new Date().toISOString(), tool, input, allowed, reason });
}

const MAX_OUTPUT = 8000;

export const COMMAND_TOOLS: Anthropic.Tool[] = [
  {
    name: "run_command",
    description:
      "Run a shell command on the computer (PowerShell on Windows). Use for git, npm, build, test, file operations, system queries, etc. Commands are validated against a security whitelist.",
    input_schema: {
      type: "object" as const,
      properties: {
        command: { type: "string", description: "The command to run (PowerShell syntax)" },
        cwd: { type: "string", description: "Working directory (optional, defaults to workspace root)" },
        runner: { type: "string", description: "Execution runner: 'host' (default) or 'kali' (docker exec into Kali toolbox container)" },
        timeout: { type: "number", description: "Timeout in seconds (default: 15, max: 60)" },
      },
      required: ["command"],
    },
  },
];

function truncateOutput(output: string): string {
  if (output.length <= MAX_OUTPUT) return output;
  return output.slice(0, MAX_OUTPUT) + `\n\n... (output truncated, ${output.length - MAX_OUTPUT} chars omitted)`;
}

export function handleCommandTool(name: string, input: Record<string, unknown>): string {
  switch (name) {
    case "run_command": {
      const command = input.command as string;
      const rawCwd = (input.cwd as string) || process.env.CASCADE_REMOTE_WORKSPACE || process.cwd();
      const runner = (input.runner as string) === "kali" ? "kali" : "host";
      const timeoutSec = Math.min((input.timeout as number) || 30, 300);

      const workspaceRoot = process.env.CASCADE_REMOTE_WORKSPACE || process.cwd();
      const cwd = isAbsolute(rawCwd) ? rawCwd : join(workspaceRoot, rawCwd);

      const isWindows = process.platform === "win32";
      const hostShell = isWindows ? "powershell.exe" : "/bin/bash";

      if (runner === "kali" && isWindows) {
        return "🚫 runner='kali' is only supported on Linux Docker deployments.";
      }

      const kaliContainer = process.env.KALI_CONTAINER_NAME || "gracestack-kali";
      const check = checkCommandPermission(command);
      audit("run_command", `${runner}: ${command}`, check.allowed, check.reason);
      if (!check.allowed) return `🚫 Command blocked: ${check.reason}`;

      try {
        const output = runner === "kali"
          ? execFileSync(
            "docker",
            ["exec", "-i", "-w", cwd, kaliContainer, "bash", "-lc", command],
            {
              timeout: timeoutSec * 1000,
              encoding: "utf-8",
              maxBuffer: 1024 * 1024,
              stdio: ["pipe", "pipe", "pipe"],
            },
          )
          : execSync(command, {
            cwd,
            timeout: timeoutSec * 1000,
            encoding: "utf-8",
            maxBuffer: 1024 * 1024,
            shell: hostShell,
            stdio: ["pipe", "pipe", "pipe"],
          });
        return truncateOutput(output || "(no output)");
      } catch (err: unknown) {
        const execErr = err as { stdout?: string; stderr?: string; status?: number; message?: string };
        const stdout = execErr.stdout || "";
        const stderr = execErr.stderr || "";
        const status = execErr.status ?? "unknown";
        return truncateOutput(`Exit code: ${status}\n${stdout}\n${stderr}`.trim());
      }
    }

    default:
      return `Unknown command tool: ${name}`;
  }
}
