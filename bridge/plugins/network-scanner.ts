/**
 * Network Scanner Plugin — DNS lookup, port check, IP info
 */
import type { PluginManifest } from "../src/plugin-loader.js";
import { execSync } from "child_process";
import { lookup } from "dns";

const plugin: PluginManifest = {
  name: "Network Scanner",
  version: "1.0.0",
  description: "Nätverksverktyg: DNS lookup, port-skanning, whois, traceroute, IP-info",
  author: "Gracestack",
  tools: [
    {
      name: "dns_lookup",
      description: "Perform DNS lookup for a hostname. Returns IP addresses, CNAME, MX records.",
      parameters: {
        hostname: { type: "string", description: "Hostname to look up (e.g. 'google.com')" },
      },
      handler: (input) => {
        const host = (input.hostname as string) || "";
        if (!host) return "Error: hostname is required";

        return new Promise<string>((resolve) => {
          lookup(host, { all: true }, (err, addresses) => {
            if (err) {
              resolve(`DNS lookup failed for ${host}: ${err.message}`);
              return;
            }
            const results = (addresses as Array<{ address: string; family: number }>).map(a => ({
              address: a.address,
              family: a.family === 4 ? "IPv4" : "IPv6",
            }));
            resolve(JSON.stringify({ hostname: host, records: results }, null, 2));
          });
        });
      },
    },
    {
      name: "port_check",
      description: "Check if a TCP port is open on a host. Useful for debugging connectivity issues.",
      parameters: {
        host: { type: "string", description: "Host to check (IP or hostname)" },
        port: { type: "number", description: "Port number to check" },
        timeout: { type: "number", description: "Timeout in ms (default: 3000)" },
      },
      handler: async (input) => {
        const host = (input.host as string) || "localhost";
        const port = (input.port as number) || 80;
        const timeout = (input.timeout as number) || 3000;

        const net = await import("net");
        return new Promise<string>((resolve) => {
          const socket = new net.Socket();
          const start = Date.now();

          socket.setTimeout(timeout);
          socket.on("connect", () => {
            const elapsed = Date.now() - start;
            socket.destroy();
            resolve(JSON.stringify({
              host, port, status: "open", latency: elapsed + "ms",
            }, null, 2));
          });
          socket.on("timeout", () => {
            socket.destroy();
            resolve(JSON.stringify({ host, port, status: "timeout", timeout: timeout + "ms" }, null, 2));
          });
          socket.on("error", (err: Error) => {
            resolve(JSON.stringify({ host, port, status: "closed", error: err.message }, null, 2));
          });
          socket.connect(port, host);
        });
      },
    },
    {
      name: "network_info",
      description: "Get local network configuration: interfaces, IPs, MAC addresses, default gateway",
      parameters: {},
      handler: () => {
        const os = require("os");
        const nets = os.networkInterfaces();
        const interfaces: { name: string; address: string; family: string; mac: string; internal: boolean }[] = [];

        for (const [name, addrs] of Object.entries(nets)) {
          for (const a of (addrs as any[] || [])) {
            interfaces.push({
              name,
              address: a.address,
              family: a.family,
              mac: a.mac,
              internal: a.internal,
            });
          }
        }

        let gateway = "unknown";
        try {
          if (os.platform() === "win32") {
            const out = execSync("ipconfig | findstr /i \"Default Gateway\"", { encoding: "utf-8", timeout: 3000 });
            const m = out.match(/:\s*([\d.]+)/);
            if (m) gateway = m[1];
          } else {
            const out = execSync("ip route | grep default | awk '{print $3}'", { encoding: "utf-8", timeout: 3000 });
            gateway = out.trim() || "unknown";
          }
        } catch { /* ignore */ }

        return JSON.stringify({
          hostname: os.hostname(),
          platform: os.platform(),
          defaultGateway: gateway,
          interfaces: interfaces.filter(i => !i.internal),
        }, null, 2);
      },
    },
  ],
};

export default plugin;
