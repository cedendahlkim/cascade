/**
 * Cascade Remote Bridge — Service Wrapper
 * 
 * This wrapper is used by the Windows Service to start the bridge.
 * It spawns tsx to run the TypeScript source directly.
 * node-windows will monitor this process and restart on crash.
 */
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

const bridgeDir = __dirname;
const envPath = path.join(bridgeDir, ".env");

// Load .env into process.env
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, "utf-8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx > 0) {
        const key = trimmed.slice(0, eqIdx).trim();
        const val = trimmed.slice(eqIdx + 1).trim();
        process.env[key] = val;
      }
    }
  }
}

const tsxBin = path.join(bridgeDir, "node_modules", ".bin", "tsx.cmd");
const entryPoint = path.join(bridgeDir, "src", "index.ts");

console.log(`[service] Starting Cascade Remote Bridge...`);
console.log(`[service] tsx: ${tsxBin}`);
console.log(`[service] entry: ${entryPoint}`);
console.log(`[service] cwd: ${bridgeDir}`);

const child = spawn(tsxBin, ["--no-warnings", entryPoint], {
  cwd: bridgeDir,
  env: { ...process.env },
  stdio: "inherit",
  shell: true,
});

child.on("error", (err) => {
  console.error(`[service] Failed to start: ${err.message}`);
  process.exit(1);
});

child.on("exit", (code) => {
  console.log(`[service] Bridge exited with code ${code}`);
  process.exit(code || 0);
});

// Forward signals
process.on("SIGTERM", () => { child.kill("SIGTERM"); });
process.on("SIGINT", () => { child.kill("SIGINT"); });
