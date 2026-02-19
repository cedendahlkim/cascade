import { ArrowUp, Check, CheckCircle, Loader2, Plus, RefreshCw, Wand2, X, GitBranch } from "lucide-react";

interface GitFileEntry {
  path: string;
  status: string;
  staged: boolean;
}

interface GitCommitEntry {
  hash: string;
  message: string;
  author: string;
  time: string;
}

interface GitStatus {
  branch: string;
  files: GitFileEntry[];
  commits: GitCommitEntry[];
  clean: boolean;
}

interface GitPanelProps {
  visible: boolean;
  width: number;
  status: GitStatus | null;
  loading: boolean;
  commitMessage: string;
  onCommitMessageChange: (value: string) => void;
  onRefresh: () => void;
  onClose: () => void;
  onAiCommitMessage: () => void;
  onCommit: () => void;
  onStageAll: () => void;
  onPush: () => void;
  onStageFile: (paths: string[]) => void;
  onUnstageFile: (paths: string[]) => void;
}

export default function GitPanel({
  visible,
  width,
  status,
  loading,
  commitMessage,
  onCommitMessageChange,
  onRefresh,
  onClose,
  onAiCommitMessage,
  onCommit,
  onStageAll,
  onPush,
  onStageFile,
  onUnstageFile,
}: GitPanelProps) {
  if (!visible) {
    return null;
  }

  return (
    <div className="shrink-0 bg-[#0d1117] border-l border-slate-700/50 flex flex-col min-h-0" style={{ width }}>
      <div className="flex items-center justify-between px-3 py-2 bg-[#161b22] border-b border-slate-700/50">
        <div className="flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-orange-400" />
          <span className="text-xs font-semibold text-slate-300">Git</span>
          {status?.branch && (
            <span className="text-[10px] bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded-full">{status.branch}</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onRefresh} className="p-0.5 hover:bg-slate-700 rounded" title="Uppdatera">
            <RefreshCw className={`w-3 h-3 text-slate-500 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button onClick={onClose} title="Stäng">
            <X className="w-3.5 h-3.5 text-slate-500" />
          </button>
        </div>
      </div>

      <div className="px-3 py-2 border-b border-slate-700/30 space-y-2">
        <div className="flex items-center gap-1">
          <input
            type="text"
            value={commitMessage}
            onChange={(e) => onCommitMessageChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onCommit()}
            placeholder="Commit-meddelande..."
            className="flex-1 bg-slate-800/50 border border-slate-700/50 rounded px-2 py-1.5 text-xs outline-none text-slate-200 placeholder:text-slate-500 focus:border-orange-500/50"
          />
          <button onClick={onAiCommitMessage} className="p-1.5 bg-violet-500/20 text-violet-400 rounded hover:bg-violet-500/30" title="AI generera meddelande">
            <Wand2 className="w-3 h-3" />
          </button>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onCommit}
            disabled={!commitMessage.trim()}
            className="flex-1 flex items-center justify-center gap-1 px-2 py-1 text-[11px] bg-orange-500/20 text-orange-400 rounded hover:bg-orange-500/30 disabled:opacity-40 transition-colors"
          >
            <Check className="w-3 h-3" /> Commit
          </button>
          <button
            onClick={onStageAll}
            className="flex items-center gap-1 px-2 py-1 text-[11px] bg-green-500/20 text-green-400 rounded hover:bg-green-500/30 transition-colors"
          >
            <Plus className="w-3 h-3" /> Stage All
          </button>
          <button
            onClick={onPush}
            className="flex items-center gap-1 px-2 py-1 text-[11px] bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30 transition-colors"
          >
            <ArrowUp className="w-3 h-3" /> Push
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        {loading && !status && (
          <div className="flex items-center justify-center py-8 text-xs text-slate-500">
            <Loader2 className="w-4 h-4 animate-spin mr-2" /> Laddar...
          </div>
        )}

        {status?.clean && (
          <div className="text-center py-8 text-xs text-slate-500">
            <CheckCircle className="w-6 h-6 mx-auto mb-2 text-green-500/50" />
            Inga ändringar
          </div>
        )}

        {status && !status.clean && (
          <div className="py-1">
            {status.files.filter((file) => file.staged).length > 0 && (
              <div>
                <div className="px-3 py-1 text-[10px] uppercase tracking-wider text-green-400 font-semibold">Stagade</div>
                {status.files.filter((file) => file.staged).map((file) => (
                  <div key={`s-${file.path}`} className="flex items-center gap-2 px-3 py-1 hover:bg-slate-800/50 group text-xs">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      file.status === "added" ? "bg-green-400" : file.status === "deleted" ? "bg-red-400" : "bg-amber-400"
                    }`} />
                    <span className="flex-1 truncate text-slate-300">{file.path}</span>
                    <button
                      onClick={() => onUnstageFile([file.path])}
                      className="opacity-0 group-hover:opacity-100 text-[10px] text-red-400 hover:text-red-300"
                      title="Unstage"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {status.files.filter((file) => !file.staged).length > 0 && (
              <div>
                <div className="px-3 py-1 text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Ändrade</div>
                {status.files.filter((file) => !file.staged).map((file) => (
                  <div key={`u-${file.path}`} className="flex items-center gap-2 px-3 py-1 hover:bg-slate-800/50 group text-xs">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      file.status === "untracked" ? "bg-green-400" : file.status === "deleted" ? "bg-red-400" : "bg-amber-400"
                    }`} />
                    <span className="flex-1 truncate text-slate-400">{file.path}</span>
                    <span className="text-[9px] text-slate-600">{file.status === "untracked" ? "U" : file.status === "deleted" ? "D" : "M"}</span>
                    <button
                      onClick={() => onStageFile([file.path])}
                      className="opacity-0 group-hover:opacity-100 text-[10px] text-green-400 hover:text-green-300"
                      title="Stage"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {(status?.commits?.length ?? 0) > 0 && (
          <div className="border-t border-slate-700/30 mt-1">
            <div className="px-3 py-1 text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Senaste commits</div>
            {status!.commits.slice(0, 8).map((commit, index) => (
              <div key={index} className="px-3 py-1 text-xs hover:bg-slate-800/30">
                <div className="flex items-center gap-2">
                  <span className="text-orange-400/70 font-mono text-[10px] shrink-0">{commit.hash}</span>
                  <span className="truncate text-slate-400">{commit.message}</span>
                </div>
                <div className="text-[10px] text-slate-600 mt-0.5">{commit.author} · {commit.time}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
