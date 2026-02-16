/**
 * Clipboard Sync — Sync clipboard between mobile and desktop
 * 
 * Allows copying text/images on mobile and pasting on desktop (and vice versa).
 * Uses a shared clipboard buffer with history.
 */
import { execSync } from "child_process";
import os from "os";

export interface ClipboardEntry {
  id: number;
  content: string;
  type: "text" | "image";
  source: "mobile" | "desktop";
  timestamp: string;
}

const clipboardHistory: ClipboardEntry[] = [];
let nextId = 1;
const MAX_HISTORY = 50;

export function addToClipboard(
  content: string,
  type: "text" | "image",
  source: "mobile" | "desktop",
): ClipboardEntry {
  const entry: ClipboardEntry = {
    id: nextId++,
    content,
    type,
    source,
    timestamp: new Date().toISOString(),
  };

  clipboardHistory.push(entry);
  if (clipboardHistory.length > MAX_HISTORY) {
    clipboardHistory.splice(0, clipboardHistory.length - MAX_HISTORY);
  }

  return entry;
}

export function getClipboardHistory(limit = 20): ClipboardEntry[] {
  return clipboardHistory.slice(-limit).reverse();
}

export function getLatestClipboard(): ClipboardEntry | null {
  return clipboardHistory.length > 0 ? clipboardHistory[clipboardHistory.length - 1] : null;
}

export function clearClipboardHistory(): void {
  clipboardHistory.length = 0;
}

export function setDesktopClipboard(text: string): boolean {
  const platform = os.platform();
  try {
    if (platform === "win32") {
      execSync(`powershell -Command "Set-Clipboard -Value '${text.replace(/'/g, "''")}'"`);
      return true;
    } else if (platform === "darwin") {
      execSync(`echo ${JSON.stringify(text)} | pbcopy`);
      return true;
    } else if (platform === "linux") {
      execSync(`echo ${JSON.stringify(text)} | xclip -selection clipboard`);
      return true;
    }
  } catch (err) {
    console.error("[clipboard] Failed to set desktop clipboard:", err);
  }
  return false;
}

export function getDesktopClipboard(): string | null {
  const platform = os.platform();
  try {
    if (platform === "win32") {
      return execSync("powershell -Command Get-Clipboard", { encoding: "utf-8" }).trim();
    } else if (platform === "darwin") {
      return execSync("pbpaste", { encoding: "utf-8" }).trim();
    } else if (platform === "linux") {
      return execSync("xclip -selection clipboard -o", { encoding: "utf-8" }).trim();
    }
  } catch (err) {
    console.error("[clipboard] Failed to get desktop clipboard:", err);
  }
  return null;
}
