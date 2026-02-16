#!/usr/bin/env node
/**
 * Cascade Remote Computer Agent
 * 
 * Lightweight agent that runs on each computer you want AI to control.
 * Connects to the bridge server via Socket.IO and executes tasks.
 * 
 * Usage:
 *   npx tsx computer-agent.ts --bridge http://localhost:3031 --name "Gaming PC"
 *   npx tsx computer-agent.ts --bridge https://your-tunnel.trycloudflare.com --name "Laptop"
 */
import { io as ioClient, Socket } from "socket.io-client";
import { execSync } from "child_process";
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from "fs";
import { join, resolve } from "path";
import os from "os";

// --- Parse CLI args ---
const args = process.argv.slice(2);
function getArg(name: string, defaultVal: string): string {
  const idx = args.indexOf(`--${name}`);
  return idx >= 0 && args[idx + 1] ? args[idx + 1] : defaultVal;
}

const BRIDGE_URL = getArg("bridge", process.env.CASCADE_BRIDGE_URL || "http://localhost:3031");
const COMPUTER_NAME = getArg("name", os.hostname());
const COMPUTER_ID = getArg("id", "");
const DESCRIPTION = getArg("description", `${os.hostname()} running ${os.platform()}`);
const TAGS = getArg("tags", "").split(",").filter(Boolean);

// --- Detect capabilities ---
function detectCapabilities() {
  const platform = os.platform();
  const osName = platform === "win32" ? "windows" : platform === "darwin" ? "macos" : "linux";
  const tools: string[] = ["command", "filesystem", "process"];

  // Check for desktop tools (only on desktop OS with display)
  if (platform === "win32" || platform === "darwin" || (platform === "linux" && process.env.DISPLAY)) {
    tools.push("desktop");
  }

  // Detect GPU
  let hasGpu = false;
  let gpuName: string | undefined;
  try {
    if (platform === "win32") {
      const gpuInfo = execSync("wmic path win32_VideoController get name", { encoding: "utf-8", timeout: 5000 });
      const lines = gpuInfo.split("\n").map(l => l.trim()).filter(l => l && l !== "Name");
      if (lines.length > 0) {
        gpuName = lines[0];
        hasGpu = !gpuName.toLowerCase().includes("basic") && !gpuName.toLowerCase().includes("virtual");
      }
    } else if (platform === "linux") {
      const gpuInfo = execSync("lspci | grep -i vga", { encoding: "utf-8", timeout: 5000 });
      if (gpuInfo.trim()) {
        gpuName = gpuInfo.trim().split(":").pop()?.trim();
        hasGpu = true;
      }
    }
  } catch { /* no GPU detection */ }

  // Detect CPU model
  let cpuModel: string | undefined;
  try {
    const cpus = os.cpus();
    if (cpus.length > 0) cpuModel = cpus[0].model;
  } catch { /* ignore */ }

  return {
    os: osName,
    arch: os.arch(),
    hasGpu,
    gpuName,
    ramGb: Math.round(os.totalmem() / (1024 * 1024 * 1024)),
    cpuCores: os.cpus().length,
    cpuModel,
    hostname: os.hostname(),
    username: os.userInfo().username,
    tools,
  };
}

// --- Task handlers ---

function handleCommand(payload: Record<string, unknown>): string {
  const cmd = payload.command as string;
  if (!cmd) return "Error: no command specified";
  const timeout = (payload.timeout as number) || 30000;
  const cwd = (payload.cwd as string) || process.cwd();

  try {
    return execSync(cmd, {
      encoding: "utf-8",
      timeout,
      cwd,
      maxBuffer: 1024 * 1024,
    });
  } catch (err: any) {
    return `Error: ${err.message}\n${err.stderr || ""}`;
  }
}

function handleFileRead(payload: Record<string, unknown>): string {
  const filePath = resolve(payload.path as string);
  if (!existsSync(filePath)) return `Error: File not found: ${filePath}`;
  try {
    return readFileSync(filePath, "utf-8");
  } catch (err: any) {
    return `Error: ${err.message}`;
  }
}

function handleFileWrite(payload: Record<string, unknown>): string {
  const filePath = resolve(payload.path as string);
  const content = payload.content as string;
  if (!content && content !== "") return "Error: no content specified";
  try {
    writeFileSync(filePath, content, "utf-8");
    return `Written ${content.length} chars to ${filePath}`;
  } catch (err: any) {
    return `Error: ${err.message}`;
  }
}

function handleSystemInfo(): string {
  return JSON.stringify({
    hostname: os.hostname(),
    platform: os.platform(),
    arch: os.arch(),
    release: os.release(),
    uptime: os.uptime(),
    totalMemory: os.totalmem(),
    freeMemory: os.freemem(),
    cpus: os.cpus().length,
    cpuModel: os.cpus()[0]?.model,
    loadAvg: os.loadavg(),
    networkInterfaces: Object.entries(os.networkInterfaces())
      .map(([name, addrs]) => ({
        name,
        addresses: addrs?.filter(a => !a.internal).map(a => a.address),
      })),
  }, null, 2);
}

function handleScreenshot(): string {
  // Attempt screenshot via PowerShell on Windows
  if (os.platform() === "win32") {
    try {
      const script = `
Add-Type -AssemblyName System.Windows.Forms
$screen = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
$bitmap = New-Object System.Drawing.Bitmap($screen.Width, $screen.Height)
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.CopyFromScreen($screen.Location, [System.Drawing.Point]::Empty, $screen.Size)
$ms = New-Object System.IO.MemoryStream
$bitmap.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
[Convert]::ToBase64String($ms.ToArray())
`;
      const result = execSync(`powershell -Command "${script.replace(/\n/g, "; ")}"`, {
        encoding: "utf-8",
        timeout: 10000,
        maxBuffer: 50 * 1024 * 1024,
      });
      return `data:image/png;base64,${result.trim()}`;
    } catch (err: any) {
      return `Error: Screenshot failed: ${err.message}`;
    }
  }
  return "Error: Screenshot not supported on this platform via agent";
}

function handleDesktopAction(payload: Record<string, unknown>): string {
  const action = payload.action as string;
  if (!action) return "Error: no action specified";

  if (os.platform() === "win32") {
    try {
      // Use PowerShell for desktop actions
      const result = execSync(`powershell -Command "${action}"`, {
        encoding: "utf-8",
        timeout: 10000,
      });
      return result || "Action executed";
    } catch (err: any) {
      return `Error: ${err.message}`;
    }
  }
  return "Error: Desktop actions not supported on this platform via agent";
}

function handleTask(task: { id: string; type: string; payload: Record<string, unknown> }): string {
  switch (task.type) {
    case "command": return handleCommand(task.payload);
    case "file_read": return handleFileRead(task.payload);
    case "file_write": return handleFileWrite(task.payload);
    case "system_info": return handleSystemInfo();
    case "screenshot": return handleScreenshot();
    case "desktop_action": return handleDesktopAction(task.payload);
    case "custom": {
      // Custom tasks run a command from payload
      if (task.payload.command) return handleCommand(task.payload);
      return "Error: custom task requires a command";
    }
    default: return `Error: Unknown task type: ${task.type}`;
  }
}

// --- Connect to bridge ---

console.log(`[agent] Cascade Remote Computer Agent`);
console.log(`[agent] Name: ${COMPUTER_NAME}`);
console.log(`[agent] Bridge: ${BRIDGE_URL}`);
console.log(`[agent] Detecting capabilities...`);

const capabilities = detectCapabilities();
console.log(`[agent] OS: ${capabilities.os} (${capabilities.arch})`);
console.log(`[agent] CPU: ${capabilities.cpuModel} (${capabilities.cpuCores} cores)`);
console.log(`[agent] RAM: ${capabilities.ramGb} GB`);
console.log(`[agent] GPU: ${capabilities.hasGpu ? capabilities.gpuName : "None"}`);
console.log(`[agent] Tools: ${capabilities.tools.join(", ")}`);
console.log(`[agent] Connecting...`);

const socket: Socket = ioClient(BRIDGE_URL, {
  transports: ["websocket", "polling"],
  reconnection: true,
  reconnectionDelay: 3000,
  reconnectionAttempts: Infinity,
});

let registeredId = COMPUTER_ID;

socket.on("connect", () => {
  console.log(`[agent] Connected to bridge`);

  socket.emit("computer_register", {
    id: registeredId || undefined,
    name: COMPUTER_NAME,
    description: DESCRIPTION,
    capabilities,
    tags: TAGS,
  });
});

socket.on("computer_registered", (data: { id: string; name: string }) => {
  registeredId = data.id;
  console.log(`[agent] Registered as: ${data.name} (${data.id})`);
});

socket.on("computer_task", (task: { id: string; type: string; payload: Record<string, unknown> }) => {
  console.log(`[agent] Task received: ${task.type} (${task.id})`);

  try {
    const result = handleTask(task);
    socket.emit("task_result", { taskId: task.id, result });
    console.log(`[agent] Task completed: ${task.id} (${result.slice(0, 100)})`);
  } catch (err: any) {
    socket.emit("task_error", { taskId: task.id, error: err.message });
    console.error(`[agent] Task failed: ${task.id}:`, err.message);
  }
});

socket.on("disconnect", () => {
  console.log(`[agent] Disconnected from bridge. Reconnecting...`);
});

socket.on("connect_error", (err: Error) => {
  console.error(`[agent] Connection error: ${err.message}`);
});

// Keep alive
process.on("SIGINT", () => {
  console.log(`[agent] Shutting down...`);
  socket.disconnect();
  process.exit(0);
});

console.log(`[agent] Ready. Press Ctrl+C to stop.`);
