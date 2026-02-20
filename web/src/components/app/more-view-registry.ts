export const MORE_TAB_ITEMS = [
  { id: "dashboard", label: "📊 Dashboard" },
  { id: "computers", label: "🖥️ Datorer" },
  { id: "scheduler", label: "⏰ Schema" },
  { id: "workflows", label: "🔄 Workflows" },
  { id: "chains", label: "⛓️ Chains" },
  { id: "files", label: "📁 Filer" },
  { id: "search", label: "🔍 Sök" },
  { id: "projects", label: "📂 Projekt" },
  { id: "clipboard", label: "📋 Urklipp" },
  { id: "plugins", label: "🧩 Plugins" },
  { id: "network", label: "🧬 Nätverk" },
  { id: "swarm", label: "🍄 Swarm" },
  { id: "frankenstein", label: "🧟 Frankenstein" },
  { id: "researchlab", label: "🔬 Research Lab" },
  { id: "hierarchy", label: "🏗️ Hierarki" },
  { id: "debate", label: "🏛️ Debatt" },
  { id: "archon", label: "🧠 Archon" },
  { id: "analytics", label: "📊 Analytik" },
  { id: "promptlab", label: "🧪 Prompt Lab" },
  { id: "vision", label: "👁️ Vision" },
  { id: "snapshots", label: "📸 Snapshots" },
  { id: "webhooks", label: "🔗 Webhooks" },
  { id: "waf", label: "🛡️ WAF" },
  { id: "pentest", label: "🧨 Pentest" },
  { id: "autopilot", label: "🚀 Autopilot" },
  { id: "editor", label: "💻 Editor" },
  { id: "git", label: "🔀 Git" },
  { id: "install", label: "📦 Installera" },
  { id: "settings", label: "⚙️ Inställningar" },
  { id: "flipper", label: "📡 Flipper Zero" },
] as const;

export type MoreTabId = (typeof MORE_TAB_ITEMS)[number]["id"];

export function isMoreTabId(value: string): value is MoreTabId {
  return MORE_TAB_ITEMS.some((tab) => tab.id === value);
}
