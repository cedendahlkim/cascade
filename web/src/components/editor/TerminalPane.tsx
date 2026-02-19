import type { MouseEvent as ReactMouseEvent, ReactNode } from "react";
import { Bug, BrainCircuit, Loader2, Terminal, X } from "lucide-react";
import XTerminal from "../XTerminal";

interface TerminalError {
  error: string;
  command: string;
}

interface TerminalPaneProps {
  visible: boolean;
  height: number;
  onResizeStart: (event: ReactMouseEvent) => void;
  onClose: () => void;
  lastError: TerminalError | null;
  diagnosing: boolean;
  onDiagnose: () => void;
  onClearError: () => void;
  diagnosis: string;
  diagnosisContent: ReactNode;
  onTerminalError: (error: string, command: string) => void;
}

export default function TerminalPane({
  visible,
  height,
  onResizeStart,
  onClose,
  lastError,
  diagnosing,
  onDiagnose,
  onClearError,
  diagnosis,
  diagnosisContent,
  onTerminalError,
}: TerminalPaneProps) {
  if (!visible) {
    return null;
  }

  return (
    <div className="border-t border-slate-700/50 bg-[#0d1117] flex flex-col relative" style={{ height }}>
      <div
        className="absolute top-0 left-0 right-0 h-1 cursor-row-resize hover:bg-blue-500/50 active:bg-blue-500/70 transition-colors z-10"
        onMouseDown={onResizeStart}
      />
      <div className="flex items-center justify-between px-3 py-1 bg-[#161b22] border-b border-slate-700/50">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-green-400" />
          <span className="text-xs font-semibold text-slate-400">Terminal</span>
          <span className="text-[10px] bg-green-500/10 text-green-400 px-1.5 py-0.5 rounded-full">xterm</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onClose} title="Stäng terminal">
            <X className="w-3.5 h-3.5 text-slate-500 hover:text-slate-300" />
          </button>
        </div>
      </div>

      {lastError && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border-b border-red-500/20">
          <Bug className="w-3.5 h-3.5 text-red-400 shrink-0" />
          <span className="text-[11px] text-red-300 truncate flex-1">Fel: {lastError.error.slice(0, 100)}</span>
          <button
            onClick={onDiagnose}
            disabled={diagnosing}
            className="flex items-center gap-1 px-2 py-0.5 text-[10px] bg-violet-500/20 text-violet-400 rounded hover:bg-violet-500/30 disabled:opacity-50 shrink-0"
            title="Låt Frankenstein AI analysera felet"
          >
            {diagnosing ? <Loader2 className="w-3 h-3 animate-spin" /> : <BrainCircuit className="w-3 h-3" />}
            Diagnostisera
          </button>
          <button onClick={onClearError} className="p-0.5 hover:bg-slate-700 rounded" title="Stäng">
            <X className="w-3 h-3 text-slate-500" />
          </button>
        </div>
      )}

      {diagnosis && (
        <div className="max-h-32 overflow-y-auto px-3 py-2 bg-violet-500/5 border-b border-violet-500/20">
          <div className="flex items-center gap-1 mb-1 text-[10px] text-violet-400 font-semibold">
            <BrainCircuit className="w-3 h-3" /> Frankenstein Diagnos
          </div>
          {diagnosisContent}
        </div>
      )}

      <div className="flex-1 min-h-0">
        <XTerminal visible={visible} onError={onTerminalError} />
      </div>
    </div>
  );
}
