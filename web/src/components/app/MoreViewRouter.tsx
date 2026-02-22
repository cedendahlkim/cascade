import { lazy, Suspense } from "react";
import { MORE_TAB_ITEMS, type MoreTabId } from "./more-view-registry";

const SettingsView = lazy(() => import("../SettingsView"));
const ComputersView = lazy(() => import("../ComputersView"));
const SchedulerView = lazy(() => import("../SchedulerView"));
const FilesView = lazy(() => import("../FilesView"));
const SearchView = lazy(() => import("../SearchView"));
const ProjectsView = lazy(() => import("../ProjectsView"));
const ClipboardView = lazy(() => import("../ClipboardView"));
const PluginsView = lazy(() => import("../PluginsView"));
const DashboardView = lazy(() => import("../DashboardView"));
const WorkflowsView = lazy(() => import("../WorkflowsView"));
const AgentChainsView = lazy(() => import("../AgentChainsView"));
const ResearchLabView = lazy(() => import("../ResearchLabView"));
const InstallView = lazy(() => import("../InstallView"));
const NetworkView = lazy(() => import("../NetworkView"));
const SwarmView = lazy(() => import("../SwarmView"));
const FrankensteinView = lazy(() => import("../FrankensteinView"));
const TradingView = lazy(() => import("../TradingView"));
const HierarchyView = lazy(() => import("../HierarchyView"));
const FlipperZeroView = lazy(() => import("../FlipperZeroView"));
const GitView = lazy(() => import("../GitView"));
const DebateView = lazy(() => import("../DebateView"));
const CodeEditorView = lazy(() => import("../CodeEditorView"));
const ArchonDashboard = lazy(() => import("../ArchonDashboard"));
const AnalyticsView = lazy(() => import("../AnalyticsView"));
const PromptLabView = lazy(() => import("../PromptLabView"));
const VisionView = lazy(() => import("../VisionView"));
const SnapshotsView = lazy(() => import("../SnapshotsView"));
const WebhooksView = lazy(() => import("../WebhooksView"));
const WafHardeningView = lazy(() => import("../WafHardeningView"));
const PentestView = lazy(() => import("../PentestView"));
const AutopilotView = lazy(() => import("../AutopilotView"));
const KaliView = lazy(() => import("../KaliView"));
const OpenClawView = lazy(() => import("../OpenClawView"));

const LazyFallback = () => (
  <div className="flex-1 flex items-center justify-center">
    <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
  </div>
);

interface MoreViewRouterProps {
  activeTab: string;
  moreTab: MoreTabId;
  onMoreTabChange: (tab: MoreTabId) => void;
  editorMounted: boolean;
}

export default function MoreViewRouter({ activeTab, moreTab, onMoreTabChange, editorMounted }: MoreViewRouterProps) {
  return (
    <>
      {activeTab === "more" && (
        <>
          <div className="shrink-0 flex gap-1 px-3 pt-2 pb-1 glass-subtle overflow-x-auto">
            {MORE_TAB_ITEMS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onMoreTabChange(tab.id)}
                className={`shrink-0 text-[11px] px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
                  moreTab === tab.id ? "bg-slate-700 text-white" : "text-slate-500 hover:text-slate-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <Suspense fallback={<LazyFallback />}>
            {moreTab === "flipper" && <FlipperZeroView />}
            {moreTab === "dashboard" && <DashboardView />}
            {moreTab === "computers" && <ComputersView />}
            {moreTab === "scheduler" && <SchedulerView />}
            {moreTab === "workflows" && <WorkflowsView />}
            {moreTab === "chains" && <AgentChainsView />}
            {moreTab === "files" && <FilesView />}
            {moreTab === "search" && <SearchView />}
            {moreTab === "projects" && <ProjectsView />}
            {moreTab === "clipboard" && <ClipboardView />}
            {moreTab === "plugins" && <PluginsView />}
            {moreTab === "network" && <NetworkView />}
            {moreTab === "swarm" && <SwarmView />}
            {moreTab === "frankenstein" && <FrankensteinView />}
            {moreTab === "trading" && <TradingView />}
            {moreTab === "researchlab" && <ResearchLabView />}
            {moreTab === "hierarchy" && <HierarchyView />}
            {moreTab === "debate" && <DebateView />}
            {moreTab === "archon" && <ArchonDashboard />}
            {moreTab === "analytics" && <AnalyticsView />}
            {moreTab === "promptlab" && <PromptLabView />}
            {moreTab === "vision" && <VisionView />}
            {moreTab === "snapshots" && <SnapshotsView />}
            {moreTab === "webhooks" && <WebhooksView />}
            {moreTab === "waf" && <WafHardeningView />}
            {moreTab === "pentest" && <PentestView />}
            {moreTab === "kali" && <KaliView />}
            {moreTab === "openclaw" && <OpenClawView />}
            {moreTab === "autopilot" && <AutopilotView />}
            {moreTab === "git" && <GitView />}
            {moreTab === "install" && <InstallView />}
            {moreTab === "settings" && <SettingsView />}
          </Suspense>
        </>
      )}

      {editorMounted && (
        <div className={activeTab === "more" && moreTab === "editor" ? "flex-1 flex flex-col overflow-hidden" : "hidden"}>
          <Suspense fallback={<LazyFallback />}>
            <CodeEditorView />
          </Suspense>
        </div>
      )}
    </>
  );
}
