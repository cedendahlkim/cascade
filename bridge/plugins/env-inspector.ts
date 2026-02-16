/**
 * Environment Inspector Plugin — Miljövariabler, Node.js info, paths
 */
import type { PluginManifest } from "../src/plugin-loader.js";

const plugin: PluginManifest = {
  name: "Environment Inspector",
  version: "1.0.0",
  description: "Inspektera körmiljön: Node.js version, miljövariabler, PATH, installerade verktyg",
  author: "Gracestack",
  tools: [
    {
      name: "env_info",
      description: "Get environment information: Node.js version, npm version, OS, architecture, environment variables (filtered for safety)",
      parameters: {
        showAll: { type: "boolean", description: "Show all env vars (default: false, only shows safe ones)" },
      },
      handler: (input) => {
        const showAll = input.showAll as boolean;
        const safeKeys = [
          "NODE_ENV", "PATH", "HOME", "USERPROFILE", "SHELL", "TERM",
          "LANG", "LC_ALL", "EDITOR", "VISUAL", "HOSTNAME",
          "USER", "USERNAME", "LOGNAME", "PWD", "OLDPWD",
          "TEMP", "TMP", "TMPDIR", "OS", "PROCESSOR_ARCHITECTURE",
          "NUMBER_OF_PROCESSORS", "COMPUTERNAME",
        ];

        const env: Record<string, string> = {};
        if (showAll) {
          for (const [k, v] of Object.entries(process.env)) {
            if (v && !k.toLowerCase().includes("key") && !k.toLowerCase().includes("secret") &&
                !k.toLowerCase().includes("token") && !k.toLowerCase().includes("password")) {
              env[k] = v.length > 200 ? v.slice(0, 200) + "..." : v;
            }
          }
        } else {
          for (const key of safeKeys) {
            if (process.env[key]) {
              const val = process.env[key]!;
              env[key] = val.length > 200 ? val.slice(0, 200) + "..." : val;
            }
          }
        }

        return JSON.stringify({
          node: {
            version: process.version,
            platform: process.platform,
            arch: process.arch,
            pid: process.pid,
            cwd: process.cwd(),
            execPath: process.execPath,
          },
          memory: {
            rss: (process.memoryUsage().rss / 1048576).toFixed(1) + " MB",
            heapUsed: (process.memoryUsage().heapUsed / 1048576).toFixed(1) + " MB",
            heapTotal: (process.memoryUsage().heapTotal / 1048576).toFixed(1) + " MB",
          },
          uptime: process.uptime().toFixed(0) + "s",
          envVars: env,
          envVarCount: Object.keys(process.env).length,
        }, null, 2);
      },
    },
    {
      name: "check_tools",
      description: "Check if common development tools are installed and available: git, node, npm, python, docker, etc.",
      parameters: {
        tools: { type: "string", description: "Comma-separated tool names to check (default: common dev tools)" },
      },
      handler: (input) => {
        const { execSync } = require("child_process");
        const defaultTools = "git,node,npm,npx,python,python3,pip,docker,curl,wget,ssh,code,tsc,eslint";
        const toolList = ((input.tools as string) || defaultTools).split(",").map((t: string) => t.trim());

        const results: { tool: string; installed: boolean; version: string }[] = [];

        for (const tool of toolList) {
          try {
            const cmd = process.platform === "win32" ? `where ${tool} 2>nul && ${tool} --version 2>nul` : `which ${tool} && ${tool} --version 2>/dev/null`;
            const output = execSync(cmd, { encoding: "utf-8", timeout: 3000 }).trim();
            const versionMatch = output.match(/(\d+\.\d+[\.\d]*)/);
            results.push({
              tool,
              installed: true,
              version: versionMatch ? versionMatch[1] : "found",
            });
          } catch {
            results.push({ tool, installed: false, version: "not found" });
          }
        }

        const installed = results.filter(r => r.installed).length;
        return JSON.stringify({
          checked: results.length,
          installed,
          missing: results.length - installed,
          tools: results,
        }, null, 2);
      },
    },
  ],
};

export default plugin;
