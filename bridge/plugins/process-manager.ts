/**
 * Process Manager Plugin — Lista, sök och hantera processer
 */
import type { PluginManifest } from "../src/plugin-loader.js";
import { execSync } from "child_process";
import { platform } from "os";

const plugin: PluginManifest = {
  name: "Process Manager",
  version: "1.0.0",
  description: "Processhantering: lista körande processer, sök, visa resursanvändning, hitta port-användare",
  author: "Gracestack",
  tools: [
    {
      name: "list_processes",
      description: "List running processes sorted by CPU or memory usage. Returns top N processes with PID, name, CPU%, memory.",
      parameters: {
        sortBy: { type: "string", description: "Sort by: cpu, memory, name (default: cpu)" },
        limit: { type: "number", description: "Max processes to show (default: 15, max: 50)" },
        filter: { type: "string", description: "Filter by process name (optional)" },
      },
      handler: (input) => {
        const sortBy = ((input.sortBy as string) || "cpu").toLowerCase();
        const limit = Math.min((input.limit as number) || 15, 50);
        const filter = (input.filter as string) || "";

        try {
          if (platform() === "win32") {
            const cmd = 'powershell -Command "Get-Process | Sort-Object -Property ' +
              (sortBy === "memory" ? "WorkingSet64" : "CPU") +
              ' -Descending | Select-Object -First ' + (limit * 2) +
              ' | Format-Table Id, ProcessName, @{N=\\"CPU(s)\\";E={[math]::Round($_.CPU,1)}}, @{N=\\"Mem(MB)\\";E={[math]::Round($_.WorkingSet64/1MB,1)}} -AutoSize"';
            const output = execSync(cmd, { encoding: "utf-8", timeout: 10000 });

            const lines = output.trim().split("\n").filter(l => l.trim());
            if (filter) {
              const filtered = lines.filter((l, i) => i < 2 || l.toLowerCase().includes(filter.toLowerCase()));
              return filtered.slice(0, limit + 2).join("\n");
            }
            return lines.slice(0, limit + 2).join("\n");
          } else {
            const sortFlag = sortBy === "memory" ? "-m" : "-c";
            const cmd = `ps aux --sort=${sortFlag === "-m" ? "-%mem" : "-%cpu"} | head -${limit + 1}`;
            let output = execSync(cmd, { encoding: "utf-8", timeout: 5000 });
            if (filter) {
              const lines = output.split("\n");
              output = [lines[0], ...lines.slice(1).filter(l => l.toLowerCase().includes(filter.toLowerCase()))].join("\n");
            }
            return output;
          }
        } catch (err) {
          return "Error listing processes: " + (err instanceof Error ? err.message : String(err));
        }
      },
    },
    {
      name: "find_port_user",
      description: "Find which process is using a specific TCP port. Useful for debugging 'port already in use' errors.",
      parameters: {
        port: { type: "number", description: "Port number to check" },
      },
      handler: (input) => {
        const port = (input.port as number);
        if (!port) return "Error: port is required";

        try {
          if (platform() === "win32") {
            const output = execSync(`netstat -ano | findstr :${port}`, { encoding: "utf-8", timeout: 5000 });
            const lines = output.trim().split("\n").filter(l => l.trim());
            if (lines.length === 0) return `No process found on port ${port}`;

            const pids = new Set<string>();
            const connections: { protocol: string; local: string; foreign: string; state: string; pid: string }[] = [];

            for (const line of lines) {
              const parts = line.trim().split(/\s+/);
              if (parts.length >= 5) {
                const pid = parts[parts.length - 1];
                pids.add(pid);
                connections.push({
                  protocol: parts[0],
                  local: parts[1],
                  foreign: parts[2],
                  state: parts[3],
                  pid,
                });
              }
            }

            const processInfo: Record<string, string> = {};
            for (const pid of pids) {
              try {
                const name = execSync(`tasklist /FI "PID eq ${pid}" /FO CSV /NH`, { encoding: "utf-8", timeout: 3000 }).trim();
                const match = name.match(/"([^"]+)"/);
                if (match) processInfo[pid] = match[1];
              } catch { processInfo[pid] = "unknown"; }
            }

            return JSON.stringify({
              port,
              connections: connections.slice(0, 10),
              processes: Object.entries(processInfo).map(([pid, name]) => ({ pid, name })),
            }, null, 2);
          } else {
            const output = execSync(`lsof -i :${port} 2>/dev/null || ss -tlnp | grep :${port}`, { encoding: "utf-8", timeout: 5000 });
            return output.trim() || `No process found on port ${port}`;
          }
        } catch {
          return `No process found on port ${port}`;
        }
      },
    },
  ],
};

export default plugin;
