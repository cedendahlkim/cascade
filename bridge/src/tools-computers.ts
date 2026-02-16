/**
 * Computer Tools — Let AI agents control remote computers
 * 
 * Provides Anthropic tool definitions and handlers so Claude (and other LLMs)
 * can run commands, read/write files, take screenshots, and get system info
 * on any registered computer.
 */
import Anthropic from "@anthropic-ai/sdk";
import {
  listComputers, getComputer, getComputerByName, getOnlineComputers,
  createTask, submitTask, selectBestComputer,
} from "./computer-registry.js";
import type { Server as SocketIOServer } from "socket.io";

let ioRef: SocketIOServer | null = null;

export function setComputerToolsIO(io: SocketIOServer): void {
  ioRef = io;
}

export const COMPUTER_TOOLS: Anthropic.Tool[] = [
  {
    name: "list_computers",
    description: "List all registered computers and their status (online/offline), capabilities (OS, CPU, RAM, GPU), and tools. Use this to see what computers are available.",
    input_schema: {
      type: "object" as const,
      properties: {},
    },
  },
  {
    name: "run_on_computer",
    description: "Run a shell command on a specific remote computer (by name or ID) or auto-route to the best available computer. Returns the command output. You have FULL access to all computers.",
    input_schema: {
      type: "object" as const,
      properties: {
        computer: {
          type: "string",
          description: "Computer name or ID. Use 'auto' to auto-route to the best available computer.",
        },
        command: {
          type: "string",
          description: "Shell command to execute on the remote computer.",
        },
        cwd: {
          type: "string",
          description: "Working directory for the command (optional).",
        },
        timeout: {
          type: "number",
          description: "Timeout in milliseconds (default: 30000).",
        },
      },
      required: ["computer", "command"],
    },
  },
  {
    name: "read_remote_file",
    description: "Read a file from a remote computer. Returns the file contents as text.",
    input_schema: {
      type: "object" as const,
      properties: {
        computer: {
          type: "string",
          description: "Computer name or ID.",
        },
        path: {
          type: "string",
          description: "Absolute file path on the remote computer.",
        },
      },
      required: ["computer", "path"],
    },
  },
  {
    name: "write_remote_file",
    description: "Write content to a file on a remote computer.",
    input_schema: {
      type: "object" as const,
      properties: {
        computer: {
          type: "string",
          description: "Computer name or ID.",
        },
        path: {
          type: "string",
          description: "Absolute file path on the remote computer.",
        },
        content: {
          type: "string",
          description: "Content to write to the file.",
        },
      },
      required: ["computer", "path", "content"],
    },
  },
  {
    name: "screenshot_computer",
    description: "Take a screenshot of a remote computer's screen. Returns base64-encoded image data.",
    input_schema: {
      type: "object" as const,
      properties: {
        computer: {
          type: "string",
          description: "Computer name or ID.",
        },
      },
      required: ["computer"],
    },
  },
  {
    name: "computer_system_info",
    description: "Get detailed system information from a remote computer (hostname, OS, CPU, RAM, uptime, network interfaces).",
    input_schema: {
      type: "object" as const,
      properties: {
        computer: {
          type: "string",
          description: "Computer name or ID.",
        },
      },
      required: ["computer"],
    },
  },
];

function findOnlineComputer(nameOrId: string): { comp: ReturnType<typeof getComputer>; error?: string } {
  if (nameOrId === "auto") {
    const comp = selectBestComputer("command");
    if (!comp) return { comp: undefined, error: "No computers are online. Ask the user to connect a computer." };
    return { comp };
  }
  const comp = getComputer(nameOrId) || getComputerByName(nameOrId);
  if (!comp) {
    const available = listComputers().map(c => `${c.name} (${c.status})`).join(", ");
    return { comp: undefined, error: `Computer "${nameOrId}" not found. Available: ${available || "none"}` };
  }
  if (comp.status !== "online") {
    return { comp: undefined, error: `Computer "${comp.name}" is ${comp.status}. It must be online to execute tasks.` };
  }
  return { comp };
}

async function sendTask(nameOrId: string, type: string, payload: Record<string, unknown>, timeout = 30000): Promise<string> {
  if (!ioRef) return "Error: Socket.IO not initialized for computer tools.";

  const { comp, error } = findOnlineComputer(nameOrId);
  if (!comp || error) return error || "Computer not found";

  const task = createTask(comp.id, type as any, payload, timeout);
  if (comp.socketId) {
    ioRef.to(comp.socketId).emit("computer_task", task);
  }

  try {
    return await submitTask(task);
  } catch (err) {
    return `Error: ${err instanceof Error ? err.message : String(err)}`;
  }
}

export async function handleComputerTool(name: string, input: Record<string, unknown>): Promise<string> {
  switch (name) {
    case "list_computers": {
      const all = listComputers();
      if (all.length === 0) return "No computers registered. The user needs to install the agent on a computer first.";
      return all.map(c =>
        `[${c.status === "online" ? "🟢" : "⚫"}] ${c.name} (${c.id})\n` +
        `    OS: ${c.capabilities.os} (${c.capabilities.arch}) | CPU: ${c.capabilities.cpuCores} cores | RAM: ${c.capabilities.ramGb}GB` +
        `${c.capabilities.hasGpu ? ` | GPU: ${c.capabilities.gpuName}` : ""}` +
        ` | Tools: ${c.capabilities.tools.join(", ")}` +
        ` | Tasks: ${c.taskCount} | Status: ${c.status}`
      ).join("\n\n");
    }

    case "run_on_computer": {
      const computer = input.computer as string;
      const command = input.command as string;
      if (!command) return "Error: no command specified";
      const payload: Record<string, unknown> = { command };
      if (input.cwd) payload.cwd = input.cwd;
      if (input.timeout) payload.timeout = input.timeout;
      return sendTask(computer, "command", payload, (input.timeout as number) || 30000);
    }

    case "read_remote_file": {
      return sendTask(input.computer as string, "file_read", { path: input.path });
    }

    case "write_remote_file": {
      return sendTask(input.computer as string, "file_write", { path: input.path, content: input.content });
    }

    case "screenshot_computer": {
      return sendTask(input.computer as string, "screenshot", {}, 15000);
    }

    case "computer_system_info": {
      return sendTask(input.computer as string, "system_info", {});
    }

    default:
      return `Unknown computer tool: ${name}`;
  }
}
