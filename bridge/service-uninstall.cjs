/**
 * Cascade Remote Bridge — Windows Service Uninstaller
 * 
 * Removes the bridge server Windows Service.
 * 
 * Usage (run as Administrator):
 *   node service-uninstall.cjs
 */
const path = require("path");
const { Service } = require("node-windows");

const svc = new Service({
  name: "CascadeRemoteBridge",
  script: path.join(__dirname, "src", "index.ts"),
});

svc.on("uninstall", () => {
  console.log("✅ Service uninstalled successfully!");
  console.log("   The service has been removed from Windows.");
});

svc.on("error", (err) => {
  console.error("❌ Error:", err);
});

console.log("🔧 Uninstalling Cascade Remote Bridge service...");
svc.uninstall();
