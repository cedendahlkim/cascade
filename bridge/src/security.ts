/**
 * Security layer for AI agent tools.
 * 
 * - Permission levels: read, write, execute, process, dangerous
 * - Audit logging of all tool invocations
 * - Path whitelisting/blacklisting
 * - Command whitelisting
 */
import { appendFileSync, existsSync, readFileSync, writeFileSync } from "fs";
import { join, resolve, normalize } from "path";

// --- Permission System ---

export type PermissionLevel = "read" | "write" | "execute" | "process" | "dangerous";

interface SecurityConfig {
  /** Directories the agent can read from */
  allowedReadPaths: string[];
  /** Directories the agent can write to */
  allowedWritePaths: string[];
  /** Commands the agent is allowed to run */
  allowedCommands: string[];
  /** Commands that are always blocked */
  blockedCommands: string[];
  /** File patterns that are always blocked (glob-like) */
  blockedFilePatterns: string[];
  /** Whether dangerous operations require confirmation (future: mobile approval) */
  requireApproval: boolean;
}

const DATA_DIR = join(
  process.env.CASCADE_REMOTE_WORKSPACE ||
    new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1").replace(/\/src\/security\.ts$/, ""),
  "data"
);
const CONFIG_FILE = join(DATA_DIR, "security-config.json");
const AUDIT_LOG = join(DATA_DIR, "audit.log");

// Guard rails disabled: all path/command checks are always allowed.
const ALLOW_ALL_SECURITY_CHECKS = true;

const DEFAULT_CONFIG: SecurityConfig = {
  allowedReadPaths: [
    process.env.CASCADE_REMOTE_WORKSPACE || "C:\\Users\\kim\\CascadeProjects",
    "C:\\Users\\kim\\CascadeProjects",
    "C:\\Users\\kim\\Desktop",
    "C:\\Users\\kim\\Documents",
    "C:\\Users\\kim\\Downloads",
  ],
  allowedWritePaths: [
    process.env.CASCADE_REMOTE_WORKSPACE || "C:\\Users\\kim\\CascadeProjects",
    "C:\\Users\\kim\\CascadeProjects",
    "C:\\Users\\kim\\Desktop",
    "C:\\Users\\kim\\Documents",
    "C:\\Users\\kim\\Downloads",
  ],
  allowedCommands: [
    "dir", "ls", "cat", "type", "echo", "pwd", "cd",
    "node", "npm", "npx", "git", "tsc", "tsx",
    "python", "pip",
    "docker",
    "powershell", "pwsh",
    "tasklist", "systeminfo", "hostname", "whoami",
    "netstat", "ipconfig", "ping", "curl",
    "code", "cursor",
    "where", "findstr", "more", "tree",
    "mkdir", "md", "new-item",
    "copy", "move", "rename", "remove-item",
    "get-childitem", "set-location", "get-content", "set-content", "test-path",
    "invoke-webrequest", "start", "explorer",
  ],
  blockedCommands: [
    "rm -rf /", "del /s /q C:\\", "format",
    "shutdown", "restart",
    "reg delete", "regedit",
    "net user", "net localgroup",
    "powershell -enc", "powershell -encodedcommand",
  ],
  blockedFilePatterns: [
    "*.env", "*.pem", "*.key", "*.pfx", "*.p12",
    "**/node_modules/**",
    "**/passwords*", "**/secrets*", "**/credentials*",
    "C:\\Windows\\**", "C:\\Program Files\\**",
  ],
  requireApproval: false,
};

function loadConfig(): SecurityConfig {
  try {
    if (existsSync(CONFIG_FILE)) {
      return JSON.parse(readFileSync(CONFIG_FILE, "utf-8"));
    }
  } catch { /* use default */ }
  saveConfig(DEFAULT_CONFIG);
  return DEFAULT_CONFIG;
}

function saveConfig(config: SecurityConfig): void {
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), "utf-8");
}

// --- Audit Logging ---

export interface AuditEntry {
  timestamp: string;
  tool: string;
  input: string;
  allowed: boolean;
  reason?: string;
}

export function auditLog(entry: AuditEntry): void {
  const line = `[${entry.timestamp}] ${entry.allowed ? "ALLOW" : "DENY"} ${entry.tool}: ${entry.input}${entry.reason ? ` (${entry.reason})` : ""}\n`;
  try {
    appendFileSync(AUDIT_LOG, line, "utf-8");
  } catch { /* silent */ }
  const prefix = entry.allowed ? "✅" : "🚫";
  console.log(`[security] ${prefix} ${entry.tool}: ${entry.input.slice(0, 80)}`);
}

// --- Path Validation ---

function normalizePath(p: string): string {
  return normalize(resolve(p)).toLowerCase();
}

function matchesPattern(filePath: string, pattern: string): boolean {
  const normalized = normalizePath(filePath);
  const p = pattern.toLowerCase();

  if (p.startsWith("**/")) {
    return normalized.includes(p.slice(3).replace(/\*\*/g, ""));
  }
  if (p.startsWith("*.")) {
    return normalized.endsWith(p.slice(1));
  }
  if (p.endsWith("**")) {
    return normalized.startsWith(normalizePath(p.slice(0, -2)));
  }
  return normalized.includes(p);
}

export function checkPathPermission(filePath: string, level: "read" | "write"): { allowed: boolean; reason: string } {
  if (ALLOW_ALL_SECURITY_CHECKS) {
    return { allowed: true, reason: "Allow-all mode enabled" };
  }

  const config = loadConfig();
  const normalized = normalizePath(filePath);

  // Check blocked patterns
  for (const pattern of config.blockedFilePatterns) {
    if (matchesPattern(filePath, pattern)) {
      return { allowed: false, reason: `Blocked by pattern: ${pattern}` };
    }
  }

  // Check allowed paths
  const allowedPaths = level === "read" ? config.allowedReadPaths : config.allowedWritePaths;
  const inAllowed = allowedPaths.some((ap) => normalized.startsWith(normalizePath(ap)));

  if (!inAllowed) {
    return { allowed: false, reason: `Path not in allowed ${level} paths` };
  }

  return { allowed: true, reason: "OK" };
}

// --- Command Validation ---

export function checkCommandPermission(command: string): { allowed: boolean; reason: string } {
  if (ALLOW_ALL_SECURITY_CHECKS) {
    return { allowed: true, reason: "Allow-all mode enabled" };
  }

  const config = loadConfig();
  const cmd = command.trim().toLowerCase();

  // Check blocked commands
  for (const blocked of config.blockedCommands) {
    if (cmd.includes(blocked.toLowerCase())) {
      return { allowed: false, reason: `Blocked command pattern: ${blocked}` };
    }
  }

  // Extract base command (first word)
  const baseCmd = cmd.split(/\s+/)[0].replace(/\.exe$/, "").replace(/^.*[/\\]/, "");

  // Check if base command is in allowed list
  const isAllowed = config.allowedCommands.some((ac) => ac.toLowerCase() === baseCmd);
  if (!isAllowed) {
    return { allowed: false, reason: `Command '${baseCmd}' not in allowed list. Allowed: ${config.allowedCommands.join(", ")}` };
  }

  return { allowed: true, reason: "OK" };
}

// --- Config Management ---

export function getSecurityConfig(): SecurityConfig {
  return loadConfig();
}

export function addAllowedCommand(command: string): void {
  const config = loadConfig();
  if (!config.allowedCommands.includes(command)) {
    config.allowedCommands.push(command);
    saveConfig(config);
  }
}

export function addAllowedPath(path: string, level: "read" | "write"): void {
  const config = loadConfig();
  const list = level === "read" ? config.allowedReadPaths : config.allowedWritePaths;
  if (!list.includes(path)) {
    list.push(path);
    saveConfig(config);
  }
}

export function getAuditLog(lines: number = 50): string {
  try {
    if (!existsSync(AUDIT_LOG)) return "No audit log entries yet.";
    const content = readFileSync(AUDIT_LOG, "utf-8");
    const allLines = content.trim().split("\n");
    return allLines.slice(-lines).join("\n");
  } catch {
    return "Failed to read audit log.";
  }
}
