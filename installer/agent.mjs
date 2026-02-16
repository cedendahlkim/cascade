#!/usr/bin/env node
/**
 * Gracestack AI Lab — Standalone Computer Agent
 * 
 * Connects to a Gracestack AI Lab bridge server and lets the AI
 * control this computer (run commands, read/write files, screenshots).
 * 
 * Usage:
 *   node agent.mjs https://your-bridge-url.trycloudflare.com
 *   CASCADE_BRIDGE_URL=https://... node agent.mjs
 */
import { io } from "socket.io-client";
import { execSync } from "child_process";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve } from "path";
import os from "os";

const BRIDGE_URL = process.argv[2] || process.env.GRACESTACK_BRIDGE_URL || process.env.CASCADE_BRIDGE_URL || "http://localhost:3031";
const NAME = process.env.GRACESTACK_NAME || process.env.CASCADE_NAME || os.hostname();

// --- Detect this computer's capabilities ---
function detect() {
  const p = os.platform();
  const osName = p === "win32" ? "windows" : p === "darwin" ? "macos" : "linux";
  const tools = ["command", "filesystem", "process"];
  if (p === "win32" || p === "darwin") tools.push("desktop");

  let hasGpu = false, gpuName;
  try {
    if (p === "win32") {
      const g = execSync("wmic path win32_VideoController get name", { encoding: "utf-8", timeout: 5000 });
      const lines = g.split("\n").map(l => l.trim()).filter(l => l && l !== "Name");
      if (lines.length > 0) { gpuName = lines[0]; hasGpu = !gpuName.toLowerCase().includes("basic"); }
    } else if (p === "linux") {
      const g = execSync("lspci | grep -i vga", { encoding: "utf-8", timeout: 5000 });
      if (g.trim()) { gpuName = g.trim().split(":").pop()?.trim(); hasGpu = true; }
    }
  } catch {}

  return {
    os: osName, arch: os.arch(), hasGpu, gpuName,
    ramGb: Math.round(os.totalmem() / 1073741824),
    cpuCores: os.cpus().length, cpuModel: os.cpus()[0]?.model,
    hostname: os.hostname(), username: os.userInfo().username, tools,
  };
}

// --- Task handlers ---
function handleTask(task) {
  const p = task.payload;
  switch (task.type) {
    case "command":
      try {
        const shellOpts = os.platform() === "win32" ? { shell: "powershell.exe" } : {};
        return execSync(p.command, { encoding: "utf-8", timeout: p.timeout || 30000, cwd: p.cwd || process.cwd(), maxBuffer: 1048576, ...shellOpts });
      }
      catch (e) { return "Error: " + e.message; }

    case "file_read":
      try { return readFileSync(resolve(p.path), "utf-8"); }
      catch (e) { return "Error: " + e.message; }

    case "file_write":
      try { writeFileSync(resolve(p.path), p.content, "utf-8"); return "OK: written " + p.content.length + " chars"; }
      catch (e) { return "Error: " + e.message; }

    case "system_info":
      return JSON.stringify({
        hostname: os.hostname(), platform: os.platform(), arch: os.arch(),
        username: os.userInfo().username, homedir: os.userInfo().homedir,
        uptime: os.uptime(), totalMemory: os.totalmem(), freeMemory: os.freemem(),
        cpus: os.cpus().length, cpuModel: os.cpus()[0]?.model,
      }, null, 2);

    case "screenshot":
      if (os.platform() === "win32") {
        try {
          const ps = `Add-Type -AssemblyName System.Windows.Forms;$s=[System.Windows.Forms.Screen]::PrimaryScreen.Bounds;$b=New-Object System.Drawing.Bitmap($s.Width,$s.Height);[System.Drawing.Graphics]::FromImage($b).CopyFromScreen($s.Location,[System.Drawing.Point]::Empty,$s.Size);$m=New-Object System.IO.MemoryStream;$b.Save($m,[System.Drawing.Imaging.ImageFormat]::Png);[Convert]::ToBase64String($m.ToArray())`;
          return "data:image/png;base64," + execSync(`powershell -Command "${ps}"`, { encoding: "utf-8", timeout: 10000, maxBuffer: 52428800 }).trim();
        } catch (e) { return "Error: " + e.message; }
      }
      return "Error: screenshots not supported on this OS via agent";

    case "desktop_action":
      if (os.platform() === "win32") {
        try { return execSync(`powershell -Command "${p.action}"`, { encoding: "utf-8", timeout: 10000 }) || "OK"; }
        catch (e) { return "Error: " + e.message; }
      }
      return "Error: desktop actions not supported on this OS";

    default:
      return "Error: Unknown task type: " + task.type;
  }
}

// --- Connect ---
const cap = detect();

console.log("");
console.log("  ╔══════════════════════════════════════╗");
console.log("  ║  Gracestack AI Lab — Computer Agent  ║");
console.log("  ╚══════════════════════════════════════╝");
console.log("");
console.log(`  Name:    ${NAME}`);
console.log(`  OS:      ${cap.os} (${cap.arch})`);
console.log(`  CPU:     ${cap.cpuModel} (${cap.cpuCores} cores)`);
console.log(`  RAM:     ${cap.ramGb} GB`);
console.log(`  GPU:     ${cap.hasGpu ? cap.gpuName : "None"}`);
console.log(`  Bridge:  ${BRIDGE_URL}`);
console.log("");
console.log("  Connecting...");

const socket = io(BRIDGE_URL, {
  transports: ["websocket", "polling"],
  reconnection: true,
  reconnectionDelay: 3000,
  reconnectionAttempts: Infinity,
});

let regId = "";

socket.on("connect", () => {
  console.log("  ✓ Connected to bridge!");
  socket.emit("computer_register", {
    id: regId || undefined,
    name: NAME,
    description: `${NAME} running ${cap.os}`,
    capabilities: cap,
  });
});

socket.on("computer_registered", (d) => {
  regId = d.id;
  console.log(`  ✓ Registered as: ${d.name} (${d.id})`);
  console.log("");
  console.log("  ✅ This computer is now controllable from the app!");
  console.log("  Press Ctrl+C to disconnect.");
  console.log("");
});

socket.on("computer_task", (task) => {
  console.log(`  → Task: ${task.type} (${task.id})`);
  try {
    const result = handleTask(task);
    socket.emit("task_result", { taskId: task.id, result });
    console.log(`  ✓ Done: ${result.slice(0, 80)}`);
  } catch (e) {
    socket.emit("task_error", { taskId: task.id, error: e.message });
    console.error(`  ✗ Failed: ${e.message}`);
  }
});

socket.on("disconnect", () => console.log("  ⚠ Disconnected. Reconnecting..."));
socket.on("connect_error", (e) => console.error(`  ✗ Connection error: ${e.message}`));

process.on("SIGINT", () => {
  console.log("\n  Shutting down...");
  socket.disconnect();
  process.exit(0);
});
