import type { MouseEvent as ReactMouseEvent, RefObject, ReactNode } from "react";
import { Bot, CircleDot, Eraser, Loader2, Paperclip, Send, Sparkles, StopCircle, X } from "lucide-react";

interface OpenTab {
  path: string;
  name: string;
}

interface AiMessage {
  role: "user" | "ai";
  content: string;
}

interface ChatAttachment {
  name: string;
  content: string;
  type: string;
  language?: string;
}

interface AiPanelProps {
  visible: boolean;
  width: number;
  aiMessages: AiMessage[];
  currentTab: OpenTab | null;
  tabs: OpenTab[];
  activeTab: string;
  aiRef: RefObject<HTMLDivElement | null>;
  aiInput: string;
  aiLoading: boolean;
  aiStreaming: boolean;
  chatAttachments: ChatAttachment[];
  fileInputRef: RefObject<HTMLInputElement | null>;
  onResizeStart: (event: ReactMouseEvent) => void;
  onClose: () => void;
  onClearMessages: () => void;
  onAiInputChange: (value: string, target: HTMLTextAreaElement) => void;
  onSend: () => void;
  onStop: () => void;
  onFileAttach: (files: File[] | FileList) => void;
  onRemoveAttachment: (index: number) => void;
  renderAssistantMessage: (msg: AiMessage, index: number) => ReactNode;
}

export default function AiPanel({
  visible,
  width,
  aiMessages,
  currentTab,
  tabs,
  activeTab,
  aiRef,
  aiInput,
  aiLoading,
  aiStreaming,
  chatAttachments,
  fileInputRef,
  onResizeStart,
  onClose,
  onClearMessages,
  onAiInputChange,
  onSend,
  onStop,
  onFileAttach,
  onRemoveAttachment,
  renderAssistantMessage,
}: AiPanelProps) {
  if (!visible) {
    return null;
  }

  return (
    <div className="shrink-0 bg-[#0d1117] border-l border-slate-700/50 flex flex-col relative min-h-0" style={{ width }}>
      <div
        className="absolute top-0 left-0 w-1 h-full cursor-col-resize hover:bg-violet-500/50 active:bg-violet-500/70 transition-colors z-10"
        onMouseDown={onResizeStart}
      />
      <div className="flex items-center justify-between px-3 py-2 bg-[#161b22] border-b border-slate-700/50">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-violet-400" />
          <span className="text-xs font-semibold text-slate-300">Frankenstein AI</span>
          {aiMessages.length > 0 && (
            <span className="text-[9px] bg-violet-500/20 text-violet-400 px-1.5 py-0.5 rounded-full">{aiMessages.length}</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {aiMessages.length > 0 && (
            <button onClick={onClearMessages} className="p-0.5 hover:bg-slate-700 rounded" title="Rensa chat">
              <Eraser className="w-3 h-3 text-slate-500" />
            </button>
          )}
          <button onClick={onClose} title="Stäng AI-panel">
            <X className="w-3.5 h-3.5 text-slate-500" />
          </button>
        </div>
      </div>

      <div className="shrink-0 px-3 py-1.5 border-b border-slate-700/30 flex items-center gap-1 flex-wrap">
        <span className="text-[9px] text-slate-600 mr-1">Kontext:</span>
        {currentTab ? (
          <span className="text-[9px] bg-blue-500/15 text-blue-400 px-1.5 py-0.5 rounded-full flex items-center gap-1">
            <CircleDot className="w-2.5 h-2.5" /> {currentTab.name}
          </span>
        ) : (
          <span className="text-[9px] text-slate-600">Ingen fil öppen</span>
        )}
        {tabs.filter((tab) => tab.path !== activeTab).slice(0, 4).map((tab) => (
          <span key={tab.path} className="text-[9px] bg-slate-700/40 text-slate-500 px-1.5 py-0.5 rounded-full">{tab.name}</span>
        ))}
        {tabs.length > 5 && <span className="text-[9px] text-slate-600">+{tabs.length - 5}</span>}
      </div>

      <div ref={aiRef} className="flex-1 min-h-0 overflow-y-auto p-3 space-y-3">
        {aiMessages.length === 0 && (
          <div className="text-center text-slate-500 text-xs mt-8">
            <Sparkles className="w-8 h-8 mx-auto mb-2 text-violet-500/50" />
            <p>Frankenstein AI är redo.</p>
            <p className="mt-1">Fråga om koden, be om ändringar, eller kör kommandon.</p>
          </div>
        )}

        {aiMessages.map((msg, index) => (
          <div
            key={index}
            className={`text-xs leading-relaxed ${
              msg.role === "user"
                ? "bg-blue-500/10 border border-blue-500/20 rounded-lg p-2 text-blue-200"
                : "bg-slate-800/50 border border-slate-700/30 rounded-lg p-2 text-slate-300"
            }`}
          >
            <div className="font-semibold text-[10px] mb-1 text-slate-500">{msg.role === "user" ? "Du" : "🧟 Frankenstein"}</div>
            {msg.role === "user" ? <div className="whitespace-pre-wrap">{msg.content}</div> : renderAssistantMessage(msg, index)}
          </div>
        ))}

        {aiLoading && !aiStreaming && (
          <div className="flex items-center gap-2 text-xs text-violet-400">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Frankenstein tänker...</span>
          </div>
        )}
      </div>

      <div
        className="shrink-0 border-t border-slate-700/50 p-2"
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (e.dataTransfer.files.length > 0) {
            onFileAttach(e.dataTransfer.files);
          }
        }}
      >
        {chatAttachments.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-1.5">
            {chatAttachments.map((attachment, index) => (
              <div key={`${attachment.name}-${index}`} className="flex items-center gap-1 px-1.5 py-0.5 bg-violet-500/10 border border-violet-500/20 rounded text-[10px] text-violet-300">
                <Paperclip className="w-2.5 h-2.5" />
                <span className="max-w-[100px] truncate">{attachment.name}</span>
                <button onClick={() => onRemoveAttachment(index)} className="hover:text-red-400" title="Ta bort">
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-end gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 hover:bg-slate-700/50 rounded-lg text-slate-500 hover:text-slate-300 shrink-0"
            title="Bifoga filer (drag&drop eller klistra in)"
          >
            <Paperclip className="w-3.5 h-3.5" />
          </button>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            title="Välj filer att bifoga"
            onChange={(e) => {
              if (e.target.files) {
                onFileAttach(e.target.files);
              }
              e.target.value = "";
            }}
          />

          <textarea
            value={aiInput}
            onChange={(e) => onAiInputChange(e.target.value, e.target)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSend();
              }
            }}
            onPaste={(e) => {
              const items = e.clipboardData?.items;
              if (!items) {
                return;
              }
              const files: File[] = [];
              for (const item of Array.from(items)) {
                if (item.kind === "file") {
                  const file = item.getAsFile();
                  if (file) {
                    files.push(file);
                  }
                }
              }
              if (files.length > 0) {
                e.preventDefault();
                onFileAttach(files);
              }
            }}
            placeholder={chatAttachments.length > 0 ? "Fråga om bifogade filer..." : "Beskriv vad du vill koda... (Shift+Enter för ny rad)"}
            className="flex-1 bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2 text-xs outline-none text-slate-200 placeholder:text-slate-500 focus:border-violet-500/50 resize-none overflow-hidden"
            disabled={aiLoading}
            rows={1}
          />

          {aiStreaming ? (
            <button
              onClick={onStop}
              className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30"
              title="Stoppa streaming"
            >
              <StopCircle className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={onSend}
              disabled={aiLoading || (!aiInput.trim() && chatAttachments.length === 0)}
              title="Skicka till Frankenstein"
              className="p-2 bg-violet-500/20 text-violet-400 rounded-lg hover:bg-violet-500/30 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-600">
          <kbd className="px-1 py-0.5 bg-slate-800 rounded">Ctrl+K</kbd> Inline AI
          <span className="text-slate-700">|</span>
          <kbd className="px-1 py-0.5 bg-slate-800 rounded">Ctrl+I</kbd> Panel
        </div>
      </div>
    </div>
  );
}
