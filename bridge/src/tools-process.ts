/**
 * Process management tools for the AI agent.
 * 
 * List running processes, get system info, and manage processes
 * with security checks.
 */
import { execSync } from "child_process";
import Anthropic from "@anthropic-ai/sdk";
import { auditLog } from "./security.js";

function audit(tool: string, input: string, allowed: boolean, reason?: string) {
  auditLog({ timestamp: new Date().toISOString(), tool, input, allowed, reason });
}

export const PROCESS_TOOLS: Anthropic.Tool[] = [
  {
    name: "list_processes",
    description:
      "List running processes on the computer. Can filter by name. Shows PID, name, memory usage.",
    input_schema: {
      type: "object" as const,
      properties: {
        filter: { type: "string", description: "Filter processes by name (optional)" },
        top: { type: "number", description: "Show top N processes by memory (default: 20)" },
      },
    },
  },
  {
    name: "kill_process",
    description:
      "Kill a process by PID or name. Use with caution.",
    input_schema: {
      type: "object" as const,
      properties: {
        pid: { type: "number", description: "Process ID to kill" },
        name: { type: "string", description: "Process name to kill (alternative to PID)" },
      },
    },
  },
  {
    name: "system_info",
    description:
      "Get system information: OS, CPU, memory, disk usage, uptime.",
    input_schema: {
      type: "object" as const,
      properties: {},
    },
  },
  {
    name: "network_info",
    description:
      "Get network information: IP addresses, active connections, listening ports.",
    input_schema: {
      type: "object" as const,
      properties: {
        show_connections: { type: "boolean", description: "Show active connections (default: false)" },
      },
    },
  },
];

function execSafe(cmd: string, timeout: number = 10000): string {
  try {
    return execSync(cmd, {
      encoding: "utf-8",
      timeout,
      maxBuffer: 1024 * 1024,
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();
  } catch (err: unknown) {
    const e = err as { stdout?: string; stderr?: string };
    return (e.stdout || e.stderr || "Command failed").trim();
  }
}

export function handleProcessTool(name: string, input: Record<string, unknown>): string {
  switch (name) {
    case "list_processes": {
      const filter = input.filter as string | undefined;
      const top = (input.top as number) || 20;
      audit("list_processes", filter || "all", true);

      try {
        let cmd = `powershell -NoProfile -Command "Get-Process | Sort-Object WorkingSet64 -Descending | Select-Object -First ${top} Id, ProcessName, @{N='MemMB';E={[math]::Round($_.WorkingSet64/1MB,1)}}, CPU | Format-Table -AutoSize"`;
        if (filter) {
          cmd = `powershell -NoProfile -Command "Get-Process | Where-Object { $_.ProcessName -like '*${filter}*' } | Sort-Object WorkingSet64 -Descending | Select-Object Id, ProcessName, @{N='MemMB';E={[math]::Round($_.WorkingSet64/1MB,1)}}, CPU | Format-Table -AutoSize"`;
        }
        return execSafe(cmd);
      } catch (err) {
        return `Error listing processes: ${err}`;
      }
    }

    case "kill_process": {
      const pid = input.pid as number | undefined;
      const procName = input.name as string | undefined;

      if (!pid && !procName) return "Provide either 'pid' or 'name' to kill a process.";

      const target = pid ? `PID ${pid}` : `name '${procName}'`;
      audit("kill_process", target, true);

      try {
        if (pid) {
          execSafe(`taskkill /F /PID ${pid}`);
          return `Process ${pid} killed.`;
        } else {
          execSafe(`taskkill /F /IM ${procName}.exe`);
          return `Process '${procName}' killed.`;
        }
      } catch (err) {
        return `Error killing process: ${err}`;
      }
    }

    case "system_info": {
      audit("system_info", "query", true);

      const hostname = execSafe("hostname");
      const os = execSafe(`powershell -NoProfile -Command "(Get-CimInstance Win32_OperatingSystem).Caption"`);
      const uptime = execSafe(`powershell -NoProfile -Command "$os = Get-CimInstance Win32_OperatingSystem; (Get-Date) - $os.LastBootUpTime | ForEach-Object { '{0}d {1}h {2}m' -f $_.Days, $_.Hours, $_.Minutes }"`);
      const cpu = execSafe(`powershell -NoProfile -Command "(Get-CimInstance Win32_Processor).Name"`);
      const memTotal = execSafe(`powershell -NoProfile -Command "[math]::Round((Get-CimInstance Win32_ComputerSystem).TotalPhysicalMemory/1GB, 1)"`);
      const memFree = execSafe(`powershell -NoProfile -Command "[math]::Round((Get-CimInstance Win32_OperatingSystem).FreePhysicalMemory/1MB, 1)"`);
      const disk = execSafe(`powershell -NoProfile -Command "Get-PSDrive C | ForEach-Object { 'Used: {0:N1} GB / Free: {1:N1} GB' -f (($_.Used)/1GB), (($_.Free)/1GB) }"`);

      return [
        `Hostname: ${hostname}`,
        `OS: ${os}`,
        `Uptime: ${uptime}`,
        `CPU: ${cpu}`,
        `RAM: ${memFree} GB free / ${memTotal} GB total`,
        `Disk C: ${disk}`,
      ].join("\n");
    }

    case "network_info": {
      const showConn = (input.show_connections as boolean) || false;
      audit("network_info", showConn ? "with connections" : "basic", true);

      const ip = execSafe(`powershell -NoProfile -Command "Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -ne '127.0.0.1' } | Select-Object IPAddress, InterfaceAlias | Format-Table -AutoSize"`);
      let result = `IP Addresses:\n${ip}`;

      if (showConn) {
        const ports = execSafe(`powershell -NoProfile -Command "Get-NetTCPConnection -State Listen | Select-Object -First 15 LocalPort, OwningProcess | Sort-Object LocalPort | Format-Table -AutoSize"`);
        result += `\n\nListening Ports:\n${ports}`;
      }

      return result;
    }

    default:
      return `Unknown process tool: ${name}`;
  }
}
