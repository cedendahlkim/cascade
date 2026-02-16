/**
 * System Monitor Plugin — CPU, RAM, disk, nätverk, processer
 */
import type { PluginManifest } from "../src/plugin-loader.js";
import { cpus, totalmem, freemem, hostname, platform, uptime, networkInterfaces, arch, release } from "os";
import { execSync } from "child_process";

const plugin: PluginManifest = {
  name: "System Monitor",
  version: "1.0.0",
  description: "Övervaka systemresurser: CPU, RAM, disk, nätverk, processer",
  author: "Gracestack",
  tools: [
    {
      name: "system_info",
      description: "Get comprehensive system information: CPU, memory, uptime, network interfaces, OS details",
      parameters: {},
      handler: () => {
        const cpuInfo = cpus();
        const nets = networkInterfaces();
        const addresses: { iface: string; address: string; mac: string }[] = [];
        for (const [name, addrs] of Object.entries(nets)) {
          for (const a of (addrs || [])) {
            if (!a.internal && a.family === "IPv4") {
              addresses.push({ iface: name, address: a.address, mac: a.mac });
            }
          }
        }

        const totalMem = totalmem();
        const freeMem = freemem();
        const usedMem = totalMem - freeMem;

        return JSON.stringify({
          hostname: hostname(),
          platform: platform(),
          arch: arch(),
          release: release(),
          cpu: {
            model: cpuInfo[0]?.model || "unknown",
            cores: cpuInfo.length,
            speed: cpuInfo[0]?.speed + " MHz",
          },
          memory: {
            total: (totalMem / 1073741824).toFixed(2) + " GB",
            used: (usedMem / 1073741824).toFixed(2) + " GB",
            free: (freeMem / 1073741824).toFixed(2) + " GB",
            usagePercent: ((usedMem / totalMem) * 100).toFixed(1) + "%",
          },
          uptime: {
            seconds: uptime(),
            human: formatUptime(uptime()),
          },
          network: addresses,
        }, null, 2);
      },
    },
    {
      name: "disk_usage",
      description: "Get disk usage information for all drives",
      parameters: {},
      handler: () => {
        try {
          if (platform() === "win32") {
            const output = execSync("wmic logicaldisk get size,freespace,caption", { encoding: "utf-8", timeout: 5000 });
            const lines = output.trim().split("\n").slice(1).filter(l => l.trim());
            const drives = lines.map(line => {
              const parts = line.trim().split(/\s+/);
              if (parts.length >= 3) {
                const caption = parts[0];
                const free = parseInt(parts[1]) || 0;
                const size = parseInt(parts[2]) || 0;
                const used = size - free;
                return {
                  drive: caption,
                  total: (size / 1073741824).toFixed(1) + " GB",
                  used: (used / 1073741824).toFixed(1) + " GB",
                  free: (free / 1073741824).toFixed(1) + " GB",
                  usagePercent: size > 0 ? ((used / size) * 100).toFixed(1) + "%" : "N/A",
                };
              }
              return null;
            }).filter(Boolean);
            return JSON.stringify(drives, null, 2);
          } else {
            const output = execSync("df -h --output=source,size,used,avail,pcent 2>/dev/null || df -h", { encoding: "utf-8", timeout: 5000 });
            return output;
          }
        } catch (err) {
          return "Disk info unavailable: " + (err instanceof Error ? err.message : String(err));
        }
      },
    },
  ],
};

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const parts: string[] = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  parts.push(`${m}m`);
  return parts.join(" ");
}

export default plugin;
