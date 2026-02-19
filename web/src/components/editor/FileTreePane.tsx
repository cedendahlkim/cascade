import type { ReactNode, MouseEvent as ReactMouseEvent } from "react";

interface FileTreePaneProps {
  visible: boolean;
  isFullscreen: boolean;
  width: number;
  onResizeStart: (event: ReactMouseEvent) => void;
  children: ReactNode;
}

export default function FileTreePane({ visible, isFullscreen, width, onResizeStart, children }: FileTreePaneProps) {
  if (!visible || isFullscreen) {
    return null;
  }

  return (
    <div className="shrink-0 bg-[#0d1117] border-r border-slate-700/50 overflow-hidden relative" style={{ width }}>
      {children}
      <div
        className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-500/50 active:bg-blue-500/70 transition-colors z-10"
        onMouseDown={onResizeStart}
      />
    </div>
  );
}
