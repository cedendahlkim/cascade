import { useState, useEffect } from "react";
import { FolderOpen, Plus, Trash2, Check, FolderClosed, Edit3, MessageCircle, Clock, Tag, FolderGit2, X } from "lucide-react";
import { BRIDGE_URL } from "../config";

interface Project {
  id: string;
  name: string;
  description: string;
  path?: string;
  tags: string[];
  active: boolean;
  settings: {
    defaultAgent: string;
    systemPromptExtra: string;
    autoIndex: boolean;
    workingDirectory?: string;
  };
  createdAt: string;
  lastActiveAt: string;
  messageCount: number;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleDateString("sv-SE", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just nu";
  if (mins < 60) return `${mins}m sedan`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h sedan`;
  const days = Math.floor(hours / 24);
  return `${days}d sedan`;
}

export default function ProjectsView() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [path, setPath] = useState("");
  const [tags, setTags] = useState("");

  const fetchProjects = () => {
    fetch(`${BRIDGE_URL}/api/projects`).then(r => r.json()).then(setProjects).catch(() => {});
  };

  useEffect(() => { fetchProjects(); }, []);

  const resetForm = () => {
    setName(""); setDescription(""); setPath(""); setTags("");
    setShowCreate(false); setEditingId(null);
  };

  const createProject = async () => {
    if (!name.trim()) return;
    await fetch(`${BRIDGE_URL}/api/projects`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name, description, path: path || undefined,
        tags: tags.split(",").map(t => t.trim()).filter(Boolean),
      }),
    });
    resetForm();
    fetchProjects();
  };

  const updateProject = async () => {
    if (!editingId || !name.trim()) return;
    await fetch(`${BRIDGE_URL}/api/projects/${editingId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name, description, path: path || undefined,
        tags: tags.split(",").map(t => t.trim()).filter(Boolean),
      }),
    });
    resetForm();
    fetchProjects();
  };

  const startEdit = (p: Project) => {
    setEditingId(p.id);
    setName(p.name);
    setDescription(p.description);
    setPath(p.path || "");
    setTags(p.tags.join(", "));
    setShowCreate(true);
  };

  const activateProject = async (id: string) => {
    await fetch(`${BRIDGE_URL}/api/projects/${id}/activate`, { method: "POST" });
    fetchProjects();
  };

  const deactivateProject = async () => {
    await fetch(`${BRIDGE_URL}/api/projects/deactivate`, { method: "POST" });
    fetchProjects();
  };

  const deleteProject = async (id: string) => {
    await fetch(`${BRIDGE_URL}/api/projects/${id}`, { method: "DELETE" });
    fetchProjects();
  };

  const active = projects.find(p => p.active);
  const inactive = projects.filter(p => !p.active);
  const totalMessages = projects.reduce((sum, p) => sum + p.messageCount, 0);

  return (
    <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-white">Projekt</h2>
          <p className="text-[10px] text-slate-500">
            {projects.length} projekt · {totalMessages} meddelanden
          </p>
        </div>
        <button onClick={() => { resetForm(); setShowCreate(!showCreate); }} className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition-colors" title="Nytt projekt">
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Active project banner */}
      {active && (
        <div className="bg-gradient-to-r from-blue-950/50 to-violet-950/30 border border-blue-800/50 rounded-xl p-3">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <FolderOpen className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <span className="text-sm font-semibold text-blue-200 block leading-tight">{active.name}</span>
                <span className="text-[10px] text-blue-400/60">Aktivt projekt</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => startEdit(active)} className="p-1.5 rounded-lg text-blue-400/60 hover:text-blue-300 transition-colors" title="Redigera">
                <Edit3 className="w-3.5 h-3.5" />
              </button>
              <button onClick={deactivateProject} className="text-[10px] text-blue-400 hover:text-blue-300 px-2 py-1 rounded-lg bg-blue-900/40 transition-colors" title="Avaktivera">
                Avaktivera
              </button>
            </div>
          </div>
          {active.description && <p className="text-[10px] text-blue-300/70 mb-1.5">{active.description}</p>}
          <div className="flex items-center gap-3 text-[10px]">
            {active.path && (
              <span className="text-blue-400/50 font-mono truncate max-w-[180px] flex items-center gap-1">
                <FolderGit2 className="w-3 h-3 shrink-0" /> {active.path}
              </span>
            )}
            <span className="text-blue-400/50 flex items-center gap-1">
              <MessageCircle className="w-3 h-3" /> {active.messageCount}
            </span>
            <span className="text-blue-400/50 flex items-center gap-1 ml-auto">
              <Clock className="w-3 h-3" /> {timeAgo(active.lastActiveAt)}
            </span>
          </div>
          {active.tags.length > 0 && (
            <div className="flex gap-1 flex-wrap mt-2">
              {active.tags.map(t => (
                <span key={t} className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-800/30 text-blue-300/70 border border-blue-700/30">{t}</span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create / Edit Form */}
      {showCreate && (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-slate-300">{editingId ? "Redigera projekt" : "Nytt projekt"}</h3>
            <button onClick={resetForm} className="p-1 rounded text-slate-500 hover:text-white" title="Stäng">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Projektnamn"
            className="w-full bg-slate-800 text-white rounded-lg px-3 py-2 text-sm border border-slate-700 focus:outline-none focus:border-blue-500 placeholder:text-slate-500" />
          <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="Beskrivning (valfritt)"
            className="w-full bg-slate-800 text-white rounded-lg px-3 py-2 text-sm border border-slate-700 focus:outline-none focus:border-blue-500 placeholder:text-slate-500" />
          <div className="relative">
            <FolderGit2 className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input type="text" value={path} onChange={e => setPath(e.target.value)} placeholder="Sökväg (t.ex. C:\Projects\MyApp)"
              className="w-full bg-slate-800 text-white rounded-lg pl-9 pr-3 py-2 text-sm border border-slate-700 focus:outline-none focus:border-blue-500 placeholder:text-slate-500 font-mono" />
          </div>
          <div className="relative">
            <Tag className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input type="text" value={tags} onChange={e => setTags(e.target.value)} placeholder="Taggar (komma-separerade)"
              className="w-full bg-slate-800 text-white rounded-lg pl-9 pr-3 py-2 text-sm border border-slate-700 focus:outline-none focus:border-blue-500 placeholder:text-slate-500" />
          </div>
          <div className="flex gap-2">
            <button onClick={editingId ? updateProject : createProject} disabled={!name.trim()}
              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors">
              {editingId ? "Spara" : "Skapa"}
            </button>
            <button onClick={resetForm}
              className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl text-sm transition-colors">
              Avbryt
            </button>
          </div>
        </div>
      )}

      {/* Project List */}
      {projects.length === 0 && !showCreate ? (
        <div className="text-center py-8">
          <FolderClosed className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-sm text-slate-400 mb-2">Inga projekt</p>
          <p className="text-xs text-slate-600 mb-4">Skapa projekt för att organisera konversationer och kontext</p>
          <button onClick={() => setShowCreate(true)}
            className="text-[11px] px-4 py-2 rounded-lg bg-slate-800/60 border border-slate-700/30 text-blue-400 hover:text-blue-300 transition-colors">
            <Plus className="w-3.5 h-3.5 inline mr-1 -mt-0.5" /> Skapa första projektet
          </button>
        </div>
      ) : inactive.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            {active ? "Andra projekt" : "Alla projekt"}
          </h3>
          {inactive.map(p => (
            <div key={p.id} className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3 group hover:border-slate-600/50 transition-colors">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <FolderClosed className="w-4 h-4 text-slate-500" />
                  <span className="text-sm font-medium text-white">{p.name}</span>
                </div>
                <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => startEdit(p)} className="p-1 rounded text-slate-500 hover:text-blue-400 transition-colors" title="Redigera">
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => activateProject(p.id)} className="p-1 rounded text-slate-500 hover:text-green-400 transition-colors" title="Aktivera">
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => deleteProject(p.id)} className="p-1 rounded text-slate-600 hover:text-red-400 transition-colors" title="Ta bort">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              {p.description && <p className="text-[10px] text-slate-500 mb-1">{p.description}</p>}
              <div className="flex items-center gap-3 text-[10px] text-slate-600">
                {p.path && <span className="font-mono truncate max-w-[180px]">{p.path}</span>}
                <span className="flex items-center gap-0.5"><MessageCircle className="w-2.5 h-2.5" /> {p.messageCount}</span>
                <span className="ml-auto">{timeAgo(p.lastActiveAt)}</span>
              </div>
              {p.tags.length > 0 && (
                <div className="flex gap-1 flex-wrap mt-1.5">
                  {p.tags.map(t => (
                    <span key={t} className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-700/60 text-slate-400">{t}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
