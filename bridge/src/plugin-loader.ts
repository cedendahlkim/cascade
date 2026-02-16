/**
 * Plugin System — Dynamic plugin loading for Cascade Remote
 * 
 * Plugins extend the AI agent with new tools and capabilities.
 * Each plugin is a module that exports a standard interface.
 * Plugins are loaded from bridge/plugins/ directory.
 */
import { v4 as uuidv4 } from "uuid";
import { readFileSync, existsSync, mkdirSync, readdirSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PLUGINS_DIR = join(__dirname, "..", "plugins");
const PLUGIN_CONFIG_FILE = join(__dirname, "..", "data", "plugins.json");

// Ensure plugins directory exists
if (!existsSync(PLUGINS_DIR)) {
  mkdirSync(PLUGINS_DIR, { recursive: true });
}

export interface PluginTool {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  handler: (input: Record<string, unknown>) => Promise<string> | string;
}

export interface PluginManifest {
  name: string;
  version: string;
  description: string;
  author?: string;
  tools: PluginTool[];
}

export interface PluginEntry {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  enabled: boolean;
  toolCount: number;
  loadedAt: string;
  error: string | null;
  filePath: string;
}

interface PluginConfig {
  enabled: Record<string, boolean>;
}

const plugins: Map<string, PluginEntry> = new Map();
const pluginTools: Map<string, PluginTool> = new Map();
let pluginConfig: PluginConfig = { enabled: {} };

function loadConfig(): void {
  try {
    if (existsSync(PLUGIN_CONFIG_FILE)) {
      pluginConfig = JSON.parse(readFileSync(PLUGIN_CONFIG_FILE, "utf-8"));
    }
  } catch { /* fresh */ }
}

function saveConfig(): void {
  try {
    const dir = dirname(PLUGIN_CONFIG_FILE);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    writeFileSync(PLUGIN_CONFIG_FILE, JSON.stringify(pluginConfig, null, 2), "utf-8");
  } catch (err) {
    console.error("[plugins] Failed to save config:", err);
  }
}

loadConfig();

export async function loadPlugins(): Promise<PluginEntry[]> {
  const loaded: PluginEntry[] = [];

  if (!existsSync(PLUGINS_DIR)) return loaded;

  const files = readdirSync(PLUGINS_DIR).filter(f =>
    f.endsWith(".ts") || f.endsWith(".js") || f.endsWith(".mjs")
  );

  for (const file of files) {
    const filePath = join(PLUGINS_DIR, file);
    const id = file.replace(/\.(ts|js|mjs)$/, "");

    try {
      const mod = await import(`file://${filePath.replace(/\\/g, "/")}`);
      const manifest: PluginManifest = mod.default || mod;

      if (!manifest.name || !manifest.tools) {
        console.warn(`[plugins] Skipping ${file}: missing name or tools`);
        continue;
      }

      const entry: PluginEntry = {
        id,
        name: manifest.name,
        version: manifest.version || "0.0.0",
        description: manifest.description || "",
        author: manifest.author || "unknown",
        enabled: pluginConfig.enabled[id] !== false, // enabled by default
        toolCount: manifest.tools.length,
        loadedAt: new Date().toISOString(),
        error: null,
        filePath,
      };

      plugins.set(id, entry);

      // Register tools if enabled
      if (entry.enabled) {
        for (const tool of manifest.tools) {
          const toolId = `plugin_${id}_${tool.name}`;
          pluginTools.set(toolId, tool);
        }
      }

      loaded.push(entry);
      console.log(`[plugins] Loaded: ${manifest.name} v${manifest.version} (${manifest.tools.length} tools)`);
    } catch (err) {
      const entry: PluginEntry = {
        id,
        name: file,
        version: "?",
        description: "",
        author: "",
        enabled: false,
        toolCount: 0,
        loadedAt: new Date().toISOString(),
        error: err instanceof Error ? err.message : String(err),
        filePath,
      };
      plugins.set(id, entry);
      console.error(`[plugins] Failed to load ${file}:`, err);
    }
  }

  return loaded;
}

export function listPlugins(): PluginEntry[] {
  return Array.from(plugins.values());
}

export function getPlugin(id: string): PluginEntry | undefined {
  return plugins.get(id);
}

export function setPluginEnabled(id: string, enabled: boolean): boolean {
  const plugin = plugins.get(id);
  if (!plugin) return false;

  plugin.enabled = enabled;
  pluginConfig.enabled[id] = enabled;
  saveConfig();

  // Enable/disable tools
  if (!enabled) {
    for (const key of pluginTools.keys()) {
      if (key.startsWith(`plugin_${id}_`)) {
        pluginTools.delete(key);
      }
    }
  }
  // Note: re-enabling requires reload

  return true;
}

export function getPluginTools(): Map<string, PluginTool> {
  return pluginTools;
}

export async function handlePluginTool(toolName: string, input: Record<string, unknown>): Promise<string | null> {
  const tool = pluginTools.get(toolName);
  if (!tool) return null;

  try {
    return await tool.handler(input);
  } catch (err) {
    return `Plugin tool error: ${err instanceof Error ? err.message : String(err)}`;
  }
}

export function getPluginToolDefinitions(): Array<{
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
}> {
  const defs: Array<{ name: string; description: string; input_schema: Record<string, unknown> }> = [];

  for (const [toolId, tool] of pluginTools) {
    defs.push({
      name: toolId,
      description: `[Plugin] ${tool.description}`,
      input_schema: {
        type: "object",
        properties: tool.parameters,
      },
    });
  }

  return defs;
}
