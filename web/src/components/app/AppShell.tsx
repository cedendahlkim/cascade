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

const TAB_COLORS: Record<string, { active: string; glow: string }> = {
  openclaw: { active: "text-orange-400", glow: "bg-orange-400" },
  chat:     { active: "text-blue-400",   glow: "bg-blue-400" },
  frank:    { active: "text-purple-400", glow: "bg-purple-400" },
  arena:    { active: "text-amber-400",  glow: "bg-amber-400" },
  lab:      { active: "text-emerald-400", glow: "bg-emerald-400" },
  tools:    { active: "text-cyan-400",   glow: "bg-cyan-400" },
  more:     { active: "text-slate-300",  glow: "bg-slate-400" },
};

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

      <nav
        className="shrink-0 border-t border-slate-800/50 bg-slate-950/95 backdrop-blur-xl"
        style={{ paddingBottom: "max(0.25rem, env(safe-area-inset-bottom))" }}
      >
        <div className="flex relative">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const colors = TAB_COLORS[tab.id] || TAB_COLORS.more;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex-1 flex flex-col items-center gap-0.5 py-2 touch-manipulation transition-all duration-200 relative ${
                  isActive ? colors.active : "text-slate-600"
                }`}
              >
                {/* Active indicator dot */}
                {isActive && (
                  <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full ${colors.glow} shadow-lg`}
                    style={{ boxShadow: `0 0 8px 2px currentColor` }}
                  />
                )}
                <Icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? "scale-110" : ""}`} />
                <span className={`text-[10px] font-medium transition-opacity ${isActive ? "opacity-100" : "opacity-60"}`}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
