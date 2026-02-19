import type { ElementType, ReactNode, TouchEvent as ReactTouchEvent } from "react";

export interface AppTabDefinition<T extends string = string> {
  id: T;
  label: string;
  icon: ElementType;
}

interface AppShellProps<T extends string = string> {
  tabs: AppTabDefinition<T>[];
  activeTab: T;
  onTabChange: (tab: T) => void;
  onTouchStart?: (event: ReactTouchEvent<HTMLDivElement>) => void;
  onTouchEnd?: (event: ReactTouchEvent<HTMLDivElement>) => void;
  headerContent: ReactNode;
  children: ReactNode;
}

export default function AppShell<T extends string = string>({
  tabs,
  activeTab,
  onTabChange,
  onTouchStart,
  onTouchEnd,
  headerContent,
  children,
}: AppShellProps<T>) {
  return (
    <div
      className="flex flex-col bg-slate-950"
      style={{ height: "100dvh", paddingTop: "env(safe-area-inset-top)" }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <header
        className="flex items-center justify-between px-4 py-2.5 glass border-b border-slate-800/50 shrink-0 header-glow"
        style={{ paddingTop: "max(0.625rem, env(safe-area-inset-top))" }}
      >
        {headerContent}
      </header>

      {children}

      <nav className="shrink-0 flex border-t border-slate-800/50 glass" style={{ paddingBottom: "max(0.25rem, env(safe-area-inset-bottom))" }}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2 touch-manipulation tab-item ${
                isActive ? "tab-item-active" : "text-slate-500"
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? "tab-icon-active" : ""}`} />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
