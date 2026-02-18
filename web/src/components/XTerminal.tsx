import { useEffect, useRef, useCallback } from "react";
import { Terminal as XTerm } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebLinksAddon } from "@xterm/addon-web-links";
import "@xterm/xterm/css/xterm.css";
import { BRIDGE_URL } from "../config";

interface XTerminalProps {
  visible: boolean;
  onData?: (data: string) => void;
  onError?: (error: string, command: string) => void;
}

export default function XTerminal({ visible, onError }: XTerminalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<XTerm | null>(null);
  const fitRef = useRef<FitAddon | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const inputBuffer = useRef("");
  const historyRef = useRef<string[]>([]);
  const historyIdxRef = useRef(-1);
  const cwdRef = useRef("~");

  const writeLine = useCallback((text: string) => {
    termRef.current?.writeln(text);
  }, []);

  const writePrompt = useCallback(() => {
    termRef.current?.write(`\r\n\x1b[32m${cwdRef.current}\x1b[0m \x1b[36m$\x1b[0m `);
  }, []);

  const runCommand = useCallback(async (cmd: string) => {
    if (!cmd.trim()) {
      writePrompt();
      return;
    }

    historyRef.current.push(cmd);
    historyIdxRef.current = historyRef.current.length;

    // Handle built-in commands
    if (cmd.trim() === "clear") {
      termRef.current?.clear();
      writePrompt();
      return;
    }

    try {
      const res = await fetch(`${BRIDGE_URL}/api/workspace/ai/terminal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: cmd }),
      });
      const data = await res.json();

      if (data.stdout) {
        const lines = data.stdout.split("\n");
        for (const line of lines) {
          if (line) termRef.current?.writeln(`  ${line}`);
        }
      }
      if (data.stderr) {
        const lines = data.stderr.split("\n");
        for (const line of lines) {
          if (line) termRef.current?.writeln(`  \x1b[31m${line}\x1b[0m`);
        }
      }
      if (data.exitCode !== undefined && data.exitCode !== 0) {
        termRef.current?.writeln(`  \x1b[90m[exit: ${data.exitCode}]\x1b[0m`);
      }
      // Notify parent about errors for AI diagnosis
      if (data.stderr && data.exitCode !== 0 && onError) {
        onError(data.stderr, cmd);
      }
    } catch (err) {
      termRef.current?.writeln(`  \x1b[31m[error] ${err}\x1b[0m`);
    }

    writePrompt();
  }, [writePrompt, onError]);

  useEffect(() => {
    if (!containerRef.current || termRef.current) return;

    const term = new XTerm({
      theme: {
        background: "#0d1117",
        foreground: "#c9d1d9",
        cursor: "#58a6ff",
        cursorAccent: "#0d1117",
        selectionBackground: "#264f78",
        black: "#484f58",
        red: "#ff7b72",
        green: "#3fb950",
        yellow: "#d29922",
        blue: "#58a6ff",
        magenta: "#bc8cff",
        cyan: "#39d353",
        white: "#c9d1d9",
        brightBlack: "#6e7681",
        brightRed: "#ffa198",
        brightGreen: "#56d364",
        brightYellow: "#e3b341",
        brightBlue: "#79c0ff",
        brightMagenta: "#d2a8ff",
        brightCyan: "#56d364",
        brightWhite: "#f0f6fc",
      },
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Menlo, Monaco, monospace",
      fontSize: 13,
      lineHeight: 1.4,
      cursorBlink: true,
      cursorStyle: "bar",
      scrollback: 5000,
      allowProposedApi: true,
    });

    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();

    term.loadAddon(fitAddon);
    term.loadAddon(webLinksAddon);

    term.open(containerRef.current);
    fitAddon.fit();

    termRef.current = term;
    fitRef.current = fitAddon;

    // Welcome message
    term.writeln("\x1b[1;35m🧟 Gracestack Terminal\x1b[0m");
    term.writeln("\x1b[90m─────────────────────────────────\x1b[0m");
    writePrompt();

    // Handle input
    term.onData((data) => {
      switch (data) {
        case "\r": { // Enter
          const cmd = inputBuffer.current;
          inputBuffer.current = "";
          term.write("\r\n");
          runCommand(cmd);
          break;
        }
        case "\x7f": { // Backspace
          if (inputBuffer.current.length > 0) {
            inputBuffer.current = inputBuffer.current.slice(0, -1);
            term.write("\b \b");
          }
          break;
        }
        case "\x03": { // Ctrl+C
          inputBuffer.current = "";
          term.write("^C");
          writePrompt();
          break;
        }
        case "\x0c": { // Ctrl+L
          term.clear();
          writePrompt();
          break;
        }
        case "\x1b[A": { // Up arrow
          if (historyRef.current.length > 0 && historyIdxRef.current > 0) {
            historyIdxRef.current--;
            const cmd = historyRef.current[historyIdxRef.current];
            // Clear current input
            while (inputBuffer.current.length > 0) {
              term.write("\b \b");
              inputBuffer.current = inputBuffer.current.slice(0, -1);
            }
            inputBuffer.current = cmd;
            term.write(cmd);
          }
          break;
        }
        case "\x1b[B": { // Down arrow
          if (historyIdxRef.current < historyRef.current.length - 1) {
            historyIdxRef.current++;
            const cmd = historyRef.current[historyIdxRef.current];
            while (inputBuffer.current.length > 0) {
              term.write("\b \b");
              inputBuffer.current = inputBuffer.current.slice(0, -1);
            }
            inputBuffer.current = cmd;
            term.write(cmd);
          } else {
            historyIdxRef.current = historyRef.current.length;
            while (inputBuffer.current.length > 0) {
              term.write("\b \b");
              inputBuffer.current = inputBuffer.current.slice(0, -1);
            }
          }
          break;
        }
        default: {
          if (data >= " " || data === "\t") {
            inputBuffer.current += data;
            term.write(data);
          }
          break;
        }
      }
    });

    return () => {
      term.dispose();
      termRef.current = null;
    };
  }, [runCommand, writePrompt]);

  // Fit on resize
  useEffect(() => {
    if (!visible) return;
    const handleResize = () => {
      setTimeout(() => fitRef.current?.fit(), 50);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [visible]);

  // Refit when visibility changes
  useEffect(() => {
    if (visible) {
      setTimeout(() => {
        fitRef.current?.fit();
        termRef.current?.focus();
      }, 100);
    }
  }, [visible]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      style={{ display: visible ? "block" : "none" }}
    />
  );
}
