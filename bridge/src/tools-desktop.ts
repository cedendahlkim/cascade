/**
 * Desktop control tools for the AI agent.
 * 
 * - Screenshot capture + Claude Vision analysis
 * - Mouse control (click, move, scroll)
 * - Keyboard input (type text, hotkeys)
 * - Window management
 * 
 * Uses screenshot-desktop + sharp for screenshots,
 * PowerShell + user32.dll for input automation (no native deps).
 */
import screenshot from "screenshot-desktop";
import sharp from "sharp";
import { execSync } from "child_process";
import { writeFileSync, readFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import Anthropic from "@anthropic-ai/sdk";
import { auditLog } from "./security.js";

function audit(tool: string, input: string, allowed: boolean, reason?: string) {
  auditLog({ timestamp: new Date().toISOString(), tool, input, allowed, reason });
}

const SCREENSHOTS_DIR = join(
  process.env.CASCADE_REMOTE_WORKSPACE ||
    new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1").replace(/\/src\/tools-desktop\.ts$/, ""),
  "data",
  "screenshots"
);

// Ensure screenshots directory exists
if (!existsSync(SCREENSHOTS_DIR)) {
  mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

export const DESKTOP_TOOLS: Anthropic.Tool[] = [
  {
    name: "take_screenshot",
    description:
      "Take a screenshot of the desktop. Returns a description of what's on screen. Use this to see what the user sees.",
    input_schema: {
      type: "object" as const,
      properties: {
        analyze: {
          type: "boolean",
          description: "Whether to analyze the screenshot with AI vision (default: true)",
        },
        region: {
          type: "object",
          description: "Optional: capture only a region {x, y, width, height}",
          properties: {
            x: { type: "number" },
            y: { type: "number" },
            width: { type: "number" },
            height: { type: "number" },
          },
        },
      },
    },
  },
  {
    name: "mouse_click",
    description:
      "Click the mouse at a position given as PERCENTAGE coordinates (0-100). x=0 is left edge, x=100 is right edge. y=0 is top, y=100 is bottom. Use the percentage coordinates from take_screenshot analysis.",
    input_schema: {
      type: "object" as const,
      properties: {
        x: { type: "number", description: "X position as percentage (0-100, where 0=left, 100=right)" },
        y: { type: "number", description: "Y position as percentage (0-100, where 0=top, 100=bottom)" },
        button: {
          type: "string",
          enum: ["left", "right", "middle"],
          description: "Mouse button (default: left)",
        },
        double_click: {
          type: "boolean",
          description: "Double-click instead of single click (default: false)",
        },
      },
      required: ["x", "y"],
    },
  },
  {
    name: "mouse_move",
    description: "Move the mouse to a position given as PERCENTAGE coordinates (0-100) without clicking.",
    input_schema: {
      type: "object" as const,
      properties: {
        x: { type: "number", description: "X position as percentage (0-100)" },
        y: { type: "number", description: "Y position as percentage (0-100)" },
      },
      required: ["x", "y"],
    },
  },
  {
    name: "mouse_scroll",
    description: "Scroll the mouse wheel up or down.",
    input_schema: {
      type: "object" as const,
      properties: {
        direction: {
          type: "string",
          enum: ["up", "down"],
          description: "Scroll direction",
        },
        amount: {
          type: "number",
          description: "Number of scroll clicks (default: 3)",
        },
      },
      required: ["direction"],
    },
  },
  {
    name: "type_text",
    description:
      "Type text using the keyboard. The text will be typed at the current cursor position.",
    input_schema: {
      type: "object" as const,
      properties: {
        text: { type: "string", description: "Text to type" },
      },
      required: ["text"],
    },
  },
  {
    name: "press_key",
    description:
      "Press a keyboard key or key combination. Examples: 'enter', 'tab', 'escape', 'ctrl+c', 'alt+tab', 'ctrl+shift+s', 'win+d'.",
    input_schema: {
      type: "object" as const,
      properties: {
        key: {
          type: "string",
          description: "Key or combo like 'enter', 'ctrl+c', 'alt+tab', 'win+d'",
        },
      },
      required: ["key"],
    },
  },
  {
    name: "get_active_window",
    description: "Get information about the currently active/focused window.",
    input_schema: {
      type: "object" as const,
      properties: {},
    },
  },
  {
    name: "list_windows",
    description: "List all visible windows on the desktop.",
    input_schema: {
      type: "object" as const,
      properties: {},
    },
  },
  {
    name: "focus_window",
    description: "Bring a window to the foreground by its title (partial match).",
    input_schema: {
      type: "object" as const,
      properties: {
        title: { type: "string", description: "Window title or partial match" },
      },
      required: ["title"],
    },
  },
  {
    name: "desktop_action",
    description:
      "Execute a sequence of desktop actions in ONE process (avoids focus-stealing). Actions are pipe-separated. Available actions: focus:WindowTitle, click:x%,y%, type:text, key:{ENTER}/{TAB}/^v/etc, sleep:ms. Coordinates are percentages (0-100). Example: 'focus:Chrome|click:50,92|type:Hello world|key:{ENTER}'",
    input_schema: {
      type: "object" as const,
      properties: {
        actions: {
          type: "string",
          description: "Pipe-separated action sequence. E.g. 'focus:Notepad|click:50,50|type:Hello|key:{ENTER}'",
        },
      },
      required: ["actions"],
    },
  },
];

// --- PowerShell helpers for input automation ---

function psExec(script: string): string {
  try {
    return execSync(
      `powershell -NoProfile -STA -WindowStyle Hidden -Command "${script.replace(/"/g, '\\"')}"`,
      { encoding: "utf-8", timeout: 15000, stdio: ["pipe", "pipe", "pipe"] }
    ).trim();
  } catch (err: unknown) {
    const e = err as { stdout?: string; stderr?: string };
    return (e.stdout || e.stderr || "Command failed").trim();
  }
}

function mouseClick(x: number, y: number, button: string = "left", doubleClick: boolean = false): string {
  // Convert percentage coordinates (0-100) to screen pixels
  const screenX = Math.round((x / 100) * lastScreenRes.width);
  const screenY = Math.round((y / 100) * lastScreenRes.height);
  console.log(`[desktop] Click: (${x}%,${y}%) → screen(${screenX},${screenY}) on ${lastScreenRes.width}x${lastScreenRes.height}`);

  const clickCount = doubleClick ? 2 : 1;
  const buttonFlag = button === "right" ? "0x0008, 0x0010" : button === "middle" ? "0x0020, 0x0040" : "0x0002, 0x0004";

  // Move cursor, find window at that point, bring it to foreground, then click
  const script = `
Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
public class MouseOps {
    [DllImport("user32.dll")] public static extern bool SetCursorPos(int X, int Y);
    [DllImport("user32.dll")] public static extern void mouse_event(uint dwFlags, int dx, int dy, int dwData, int dwExtraInfo);
    [DllImport("user32.dll")] public static extern IntPtr WindowFromPoint(POINT p);
    [DllImport("user32.dll")] public static extern IntPtr GetAncestor(IntPtr hwnd, uint gaFlags);
    [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);
    [DllImport("user32.dll")] public static extern bool AllowSetForegroundWindow(int dwProcessId);
    [StructLayout(LayoutKind.Sequential)]
    public struct POINT { public int X; public int Y; }
}
'@ -Language CSharp
[MouseOps]::SetCursorPos(${screenX}, ${screenY})
Start-Sleep -Milliseconds 50
$$pt = New-Object MouseOps+POINT
$$pt.X = ${screenX}
$$pt.Y = ${screenY}
$$hwnd = [MouseOps]::WindowFromPoint($$pt)
$$root = [MouseOps]::GetAncestor($$hwnd, 2)
if ($$root -ne [IntPtr]::Zero) {
    [MouseOps]::AllowSetForegroundWindow(-1)
    [MouseOps]::SetForegroundWindow($$root)
    Start-Sleep -Milliseconds 100
}
for ($$i = 0; $$i -lt ${clickCount}; $$i++) {
    [MouseOps]::mouse_event(${buttonFlag.split(",")[0]}, 0, 0, 0, 0)
    Start-Sleep -Milliseconds 30
    [MouseOps]::mouse_event(${buttonFlag.split(",")[1]}, 0, 0, 0, 0)
    Start-Sleep -Milliseconds 50
}
Write-Output "Clicked at (${x}%,${y}%) = screen(${screenX},${screenY})"
`.replace(/\$/g, "$");

  return psExec(script);
}

function mouseMove(x: number, y: number): string {
  const screenX = Math.round((x / 100) * lastScreenRes.width);
  const screenY = Math.round((y / 100) * lastScreenRes.height);
  const script = `
Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
public class MouseMove {
    [DllImport("user32.dll")] public static extern bool SetCursorPos(int X, int Y);
}
'@ -Language CSharp
[MouseMove]::SetCursorPos(${screenX}, ${screenY})
Write-Output "Moved to (${x}%,${y}%) = screen(${screenX},${screenY})"
`;
  return psExec(script);
}

function mouseScroll(direction: string, amount: number = 3): string {
  const delta = direction === "up" ? 120 * amount : -120 * amount;
  const script = `
Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
public class MouseScroll {
    [DllImport("user32.dll")] public static extern void mouse_event(uint dwFlags, int dx, int dy, int dwData, int dwExtraInfo);
}
'@ -Language CSharp
[MouseScroll]::mouse_event(0x0800, 0, 0, ${delta}, 0)
Write-Output "Scrolled ${direction} ${amount} clicks"
`;
  return psExec(script);
}

function typeText(text: string): string {
  // Use SendInput with KEYEVENTF_UNICODE via external PS1 script
  // Run with -WindowStyle Hidden to avoid stealing focus from the target window
  const scriptPath = join(
    new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1").replace(/\/[^/]+$/, ""),
    "input-helper.ps1"
  );
  const escaped = text.replace(/"/g, '`"').replace(/'/g, "''");
  try {
    const output = execSync(
      `powershell -NoProfile -STA -WindowStyle Hidden -ExecutionPolicy Bypass -File "${scriptPath}" -Action "type" -Text "${escaped}"`,
      { encoding: "utf-8", timeout: 30000, stdio: ["pipe", "pipe", "pipe"] }
    ).trim();
    return output || `Typed ${text.length} characters`;
  } catch (err: unknown) {
    const e = err as { stdout?: string; stderr?: string };
    return (e.stdout || e.stderr || "Type failed").trim();
  }
}

function pressKey(key: string): string {
  // Map common key names to SendKeys format
  const keyMap: Record<string, string> = {
    enter: "{ENTER}",
    tab: "{TAB}",
    escape: "{ESC}",
    esc: "{ESC}",
    backspace: "{BACKSPACE}",
    delete: "{DELETE}",
    space: " ",
    up: "{UP}",
    down: "{DOWN}",
    left: "{LEFT}",
    right: "{RIGHT}",
    home: "{HOME}",
    end: "{END}",
    pageup: "{PGUP}",
    pagedown: "{PGDN}",
    f1: "{F1}", f2: "{F2}", f3: "{F3}", f4: "{F4}",
    f5: "{F5}", f6: "{F6}", f7: "{F7}", f8: "{F8}",
    f9: "{F9}", f10: "{F10}", f11: "{F11}", f12: "{F12}",
  };

  const lower = key.toLowerCase().trim();

  // Handle combos like ctrl+c, alt+tab, win+d
  if (lower.includes("+")) {
    const parts = lower.split("+");
    let prefix = "";
    let mainKey = parts[parts.length - 1];

    for (let i = 0; i < parts.length - 1; i++) {
      const mod = parts[i].trim();
      if (mod === "ctrl" || mod === "control") prefix += "^";
      else if (mod === "alt") prefix += "%";
      else if (mod === "shift") prefix += "+";
      else if (mod === "win" || mod === "windows") {
        // Win key needs special handling
        const winScript = `
Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
public class WinKey {
    [DllImport("user32.dll")] public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, int dwExtraInfo);
}
'@ -Language CSharp
[WinKey]::keybd_event(0x5B, 0, 0, 0)
Start-Sleep -Milliseconds 50
Add-Type -AssemblyName System.Windows.Forms
[System.Windows.Forms.SendKeys]::SendWait('${mainKey}')
Start-Sleep -Milliseconds 50
[WinKey]::keybd_event(0x5B, 0, 2, 0)
Write-Output "Pressed Win+${mainKey}"
`;
        return psExec(winScript);
      }
    }

    const mapped = keyMap[mainKey] || mainKey;
    const sendKey = `${prefix}${mapped}`;
    const script = `
Add-Type -AssemblyName System.Windows.Forms
[System.Windows.Forms.SendKeys]::SendWait('${sendKey}')
Write-Output "Pressed ${key}"
`;
    return psExec(script);
  }

  // Single key
  const mapped = keyMap[lower] || lower;
  const script = `
Add-Type -AssemblyName System.Windows.Forms
[System.Windows.Forms.SendKeys]::SendWait('${mapped}')
Write-Output "Pressed ${key}"
`;
  return psExec(script);
}

function getActiveWindow(): string {
  return psExec(
    "Get-Process | Where-Object { $_.MainWindowTitle -ne '' } | Where-Object { $_.MainWindowHandle -eq (Add-Type -TypeDefinition 'using System; using System.Runtime.InteropServices; public class FG { [DllImport(\\\"user32.dll\\\")] public static extern IntPtr GetForegroundWindow(); }' -Language CSharp -PassThru)::GetForegroundWindow() } | Select-Object ProcessName, MainWindowTitle | Format-List"
  );
}

function listWindows(): string {
  return psExec(
    "Get-Process | Where-Object { $_.MainWindowTitle -ne '' } | Select-Object Id, ProcessName, MainWindowTitle | Format-Table -AutoSize"
  );
}

function focusWindow(title: string): string {
  return psExec(
    `$w = Get-Process | Where-Object { $_.MainWindowTitle -like '*${title}*' } | Select-Object -First 1; if ($w) { Add-Type -TypeDefinition 'using System; using System.Runtime.InteropServices; public class FW { [DllImport(\\\"user32.dll\\\")] public static extern bool SetForegroundWindow(IntPtr hWnd); }' -Language CSharp; [FW]::SetForegroundWindow($w.MainWindowHandle); Write-Output ('Focused: ' + $w.MainWindowTitle) } else { Write-Output 'Window not found' }`
  );
}

// --- Screenshot with optional Vision analysis ---

let visionClient: Anthropic | null = null;

function getVisionClient(): Anthropic | null {
  if (!visionClient && process.env.ANTHROPIC_API_KEY) {
    visionClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return visionClient;
}

function getScreenResolution(): { width: number; height: number } {
  try {
    const result = psExec(
      "Add-Type -AssemblyName System.Windows.Forms; $s = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds; Write-Output ('{0}x{1}' -f $s.Width, $s.Height)"
    );
    const [w, h] = result.split("x").map(Number);
    if (w > 0 && h > 0) return { width: w, height: h };
  } catch { /* fallback */ }
  return { width: 1920, height: 1080 };
}

// Store screen resolution for coordinate conversion (percent → screen pixels)
let lastScreenRes = { width: 1920, height: 1080 };

async function takeScreenshot(
  analyze: boolean = true,
  region?: { x: number; y: number; width: number; height: number }
): Promise<{ description: string; imagePath: string }> {
  const timestamp = Date.now();
  const thumbPath = join(SCREENSHOTS_DIR, `screen_${timestamp}.png`);

  // Get actual screen resolution
  lastScreenRes = getScreenResolution();

  // Capture screenshot
  const imgBuffer = await screenshot({ format: "png" });

  // Get captured image dimensions
  const metadata = await sharp(imgBuffer).metadata();
  const imgWidth = metadata.width || lastScreenRes.width;
  const imgHeight = metadata.height || lastScreenRes.height;

  console.log(`[desktop] Screenshot: ${imgWidth}x${imgHeight} image, ${lastScreenRes.width}x${lastScreenRes.height} screen`);

  // Crop region if specified
  let pipeline = sharp(imgBuffer);
  if (region) {
    const scaleX = imgWidth / lastScreenRes.width;
    const scaleY = imgHeight / lastScreenRes.height;
    pipeline = pipeline.extract({
      left: Math.round(region.x * scaleX),
      top: Math.round(region.y * scaleY),
      width: Math.round(region.width * scaleX),
      height: Math.round(region.height * scaleY),
    });
  }

  // Save full-res version
  const cleanBuffer = await pipeline.png({ quality: 80 }).toBuffer();
  writeFileSync(thumbPath, cleanBuffer);

  let description = `Screenshot saved: ${thumbPath}`;

  if (analyze) {
    const client = getVisionClient();
    if (client) {
      try {
        const base64 = cleanBuffer.toString("base64");
        const response = await client.messages.create({
          model: process.env.LLM_MODEL || "claude-sonnet-4-20250514",
          max_tokens: 800,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "image",
                  source: {
                    type: "base64",
                    media_type: "image/png",
                    data: base64,
                  },
                },
                {
                  type: "text",
                  text: `Analyze this ${imgWidth}x${imgHeight} desktop screenshot. Describe what you see concisely.

IMPORTANT: For every interactive element, give its CENTER position as PERCENTAGE of the image dimensions.
- x% = (pixel_x / ${imgWidth}) * 100
- y% = (pixel_y / ${imgHeight}) * 100
- The Windows taskbar is always at the very bottom (~96-100%)
- Input fields near the bottom of a window are typically at 88-94%
- The top of the screen (title bar area) is 0-5%

For EACH element list: name/description and (x%, y%)

Example: if an element's center is at pixel (960, 1000) in a 1920x1080 image:
- x% = 960/1920*100 = 50%
- y% = 1000/1080*100 = 92.6%
- Report as: (50%, 93%)

Be mathematically precise. These coordinates will be used for automated mouse clicks.`,
                },
              ],
            },
          ],
        });

        const textBlocks = response.content.filter(
          (b): b is Anthropic.TextBlock => b.type === "text"
        );
        description = `[Screen: ${lastScreenRes.width}x${lastScreenRes.height}]\nCoordinates are given as percentages. Use mouse_click with percentage values (e.g. x=50, y=92 means 50% from left, 92% from top).\n` + textBlocks.map((b) => b.text).join("\n");
      } catch (err) {
        description = `Screenshot taken but vision analysis failed: ${err}`;
      }
    } else {
      description = "Screenshot taken (no API key for vision analysis).";
    }
  }

  // Clean up old screenshots (keep last 10)
  try {
    const { readdirSync, unlinkSync } = await import("fs");
    const files = readdirSync(SCREENSHOTS_DIR)
      .filter((f) => f.endsWith(".png"))
      .sort()
      .reverse();
    for (const f of files.slice(20)) {
      unlinkSync(join(SCREENSHOTS_DIR, f));
    }
  } catch { /* ignore cleanup errors */ }

  return { description, imagePath: thumbPath };
}

function desktopAction(actions: string): string {
  const scriptPath = join(
    new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1").replace(/\/[^/]+$/, ""),
    "desktop-action.ps1"
  );
  const escaped = actions.replace(/"/g, '`"');
  try {
    const output = execSync(
      `powershell -NoProfile -STA -ExecutionPolicy Bypass -File "${scriptPath}" -Actions "${escaped}" -ScreenWidth ${lastScreenRes.width} -ScreenHeight ${lastScreenRes.height}`,
      { encoding: "utf-8", timeout: 30000, stdio: ["pipe", "pipe", "pipe"] }
    ).trim();
    console.log(`[desktop] Action result: ${output}`);
    return output || "Actions completed";
  } catch (err: unknown) {
    const e = err as { stdout?: string; stderr?: string };
    return (e.stdout || e.stderr || "Desktop action failed").trim();
  }
}

// --- Main handler ---

export async function handleDesktopTool(
  name: string,
  input: Record<string, unknown>
): Promise<string> {
  switch (name) {
    case "take_screenshot": {
      const analyze = (input.analyze as boolean) !== false;
      const region = input.region as
        | { x: number; y: number; width: number; height: number }
        | undefined;
      audit("take_screenshot", `analyze=${analyze}`, true);
      const result = await takeScreenshot(analyze, region);
      return result.description;
    }

    case "mouse_click": {
      const x = input.x as number;
      const y = input.y as number;
      const button = (input.button as string) || "left";
      const dbl = (input.double_click as boolean) || false;
      audit("mouse_click", `${x},${y} ${button}${dbl ? " double" : ""}`, true);
      return mouseClick(x, y, button, dbl);
    }

    case "mouse_move": {
      const x = input.x as number;
      const y = input.y as number;
      audit("mouse_move", `${x},${y}`, true);
      return mouseMove(x, y);
    }

    case "mouse_scroll": {
      const dir = input.direction as string;
      const amt = (input.amount as number) || 3;
      audit("mouse_scroll", `${dir} ${amt}`, true);
      return mouseScroll(dir, amt);
    }

    case "type_text": {
      const text = input.text as string;
      audit("type_text", text.slice(0, 50), true);
      return typeText(text);
    }

    case "press_key": {
      const key = input.key as string;
      audit("press_key", key, true);
      return pressKey(key);
    }

    case "get_active_window": {
      audit("get_active_window", "query", true);
      return getActiveWindow();
    }

    case "list_windows": {
      audit("list_windows", "query", true);
      return listWindows();
    }

    case "focus_window": {
      const title = input.title as string;
      audit("focus_window", title, true);
      return focusWindow(title);
    }

    case "desktop_action": {
      const actions = input.actions as string;
      audit("desktop_action", actions.slice(0, 80), true);
      return desktopAction(actions);
    }

    default:
      return `Unknown desktop tool: ${name}`;
  }
}
