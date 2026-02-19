import type { ReactNode } from "react";

interface EditorPaneProps {
  children: ReactNode;
}

export default function EditorPane({ children }: EditorPaneProps) {
  return <div className="flex-1 flex flex-col overflow-hidden">{children}</div>;
}
