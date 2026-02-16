/**
 * Cascade Remote Bridge — Windows Service Installer
 * 
 * Installs the bridge server as a Windows Service that:
 * - Starts automatically on boot
 * - Restarts on crash (max 3 retries, 10s between)
 * - Runs in the background without a console window
 * - Logs to Windows Event Log
 * 
 * Usage (run as Administrator):
 *   node service-install.cjs
 */
const path = require("path");
const { Service } = require("node-windows");

const bridgeDir = __dirname;
// Use the wrapper script — it loads .env and spawns tsx
const scriptPath = path.join(bridgeDir, "service-wrapper.cjs");

const svc = new Service({
  name: "CascadeRemoteBridge",
  description: "Cascade Remote Bridge — AI Research Lab & Remote Control Server",
  script: scriptPath,
  workingDirectory: bridgeDir,
  allowServiceLogon: true,
  env: [
    { name: "NODE_ENV", value: "production" },
  ],

  // Restart on crash
  wait: 10,        // 10 seconds between restarts
  grow: 0.5,       // grow restart interval by 50%
  maxRestarts: 3,  // max 3 restarts before giving up
});

svc.on("install", () => {
  console.log("\n✅ Service installed successfully!");
  console.log("   Name: CascadeRemoteBridge");
  console.log("   Starting service...");
  svc.start();
});

svc.on("start", () => {
  console.log("   ✅ Service started!");
  console.log("\n📋 Manage the service:");
  console.log("   - Start:   net start CascadeRemoteBridge");
  console.log("   - Stop:    net stop CascadeRemoteBridge");
  console.log("   - Status:  sc query CascadeRemoteBridge");
  console.log("   - Remove:  node service-uninstall.cjs");
  console.log("\n📝 Logs: Windows Event Viewer → Application → CascadeRemoteBridge");
});

svc.on("alreadyinstalled", () => {
  console.log("⚠️  Service already installed. Run service-uninstall.cjs first to reinstall.");
});

svc.on("error", (err) => {
  console.error("❌ Error:", err);
});

console.log("🔧 Installing Cascade Remote Bridge as Windows Service...");
console.log(`   Script: ${scriptPath}`);
console.log(`   Exec:   ${tsxPath}`);
console.log(`   Env vars: ${envVars.length} loaded from .env`);
console.log("");

svc.install();
