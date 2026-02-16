/**
 * Project System — Context switching between different projects
 * 
 * Each project has its own memories, RAG index, conversations, and settings.
 * Allows quick context switching: "Work on Unity project" → loads right context.
 */
import { v4 as uuidv4 } from "uuid";
import { writeFileSync, readFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECTS_FILE = join(__dirname, "..", "data", "projects.json");

export interface Project {
  id: string;
  name: string;
  description: string;
  path?: string;
  tags: string[];
  active: boolean;
  settings: ProjectSettings;
  createdAt: string;
  lastActiveAt: string;
  messageCount: number;
}

export interface ProjectSettings {
  defaultAgent: "claude" | "gemini";
  systemPromptExtra: string;
  ragSources: string[];
  memoryTags: string[];
  autoIndex: boolean;
  workingDirectory?: string;
}

const projects: Map<string, Project> = new Map();
let activeProjectId: string | null = null;

function loadProjects(): void {
  try {
    if (existsSync(PROJECTS_FILE)) {
      const data = JSON.parse(readFileSync(PROJECTS_FILE, "utf-8"));
      for (const p of data.projects || []) {
        projects.set(p.id, p);
        if (p.active) activeProjectId = p.id;
      }
      console.log(`[projects] Loaded ${projects.size} project(s)`);
    }
  } catch { /* fresh start */ }
}

function saveProjects(): void {
  try {
    const dir = dirname(PROJECTS_FILE);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    writeFileSync(PROJECTS_FILE, JSON.stringify({
      projects: Array.from(projects.values()),
    }, null, 2), "utf-8");
  } catch (err) {
    console.error("[projects] Failed to save:", err);
  }
}

loadProjects();

export function createProject(
  name: string,
  description: string,
  options: {
    path?: string;
    tags?: string[];
    settings?: Partial<ProjectSettings>;
  } = {},
): Project {
  const project: Project = {
    id: uuidv4(),
    name,
    description,
    path: options.path,
    tags: options.tags || [],
    active: false,
    settings: {
      defaultAgent: "claude",
      systemPromptExtra: "",
      ragSources: [],
      memoryTags: [],
      autoIndex: false,
      workingDirectory: options.path,
      ...options.settings,
    },
    createdAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString(),
    messageCount: 0,
  };

  projects.set(project.id, project);
  saveProjects();
  console.log(`[projects] Created: ${name} (${project.id})`);
  return project;
}

export function updateProject(
  id: string,
  updates: Partial<Pick<Project, "name" | "description" | "path" | "tags" | "settings">>,
): Project | null {
  const project = projects.get(id);
  if (!project) return null;

  if (updates.name !== undefined) project.name = updates.name;
  if (updates.description !== undefined) project.description = updates.description;
  if (updates.path !== undefined) project.path = updates.path;
  if (updates.tags !== undefined) project.tags = updates.tags;
  if (updates.settings !== undefined) {
    project.settings = { ...project.settings, ...updates.settings };
  }

  saveProjects();
  return project;
}

export function deleteProject(id: string): boolean {
  if (activeProjectId === id) activeProjectId = null;
  const ok = projects.delete(id);
  if (ok) saveProjects();
  return ok;
}

export function activateProject(id: string): Project | null {
  const project = projects.get(id);
  if (!project) return null;

  // Deactivate current
  if (activeProjectId) {
    const current = projects.get(activeProjectId);
    if (current) current.active = false;
  }

  project.active = true;
  project.lastActiveAt = new Date().toISOString();
  activeProjectId = project.id;
  saveProjects();
  console.log(`[projects] Activated: ${project.name}`);
  return project;
}

export function deactivateProject(): void {
  if (activeProjectId) {
    const current = projects.get(activeProjectId);
    if (current) current.active = false;
    activeProjectId = null;
    saveProjects();
  }
}

export function getActiveProject(): Project | null {
  if (!activeProjectId) return null;
  return projects.get(activeProjectId) || null;
}

export function getProject(id: string): Project | undefined {
  return projects.get(id);
}

export function listProjects(): Project[] {
  return Array.from(projects.values()).sort(
    (a, b) => new Date(b.lastActiveAt).getTime() - new Date(a.lastActiveAt).getTime()
  );
}

export function incrementMessageCount(id: string): void {
  const project = projects.get(id);
  if (project) {
    project.messageCount++;
    project.lastActiveAt = new Date().toISOString();
    // Save periodically (every 10 messages)
    if (project.messageCount % 10 === 0) saveProjects();
  }
}

export function getProjectContext(id: string): string {
  const project = projects.get(id);
  if (!project) return "";

  const lines: string[] = [
    `## AKTIVT PROJEKT: ${project.name}`,
    project.description ? `Beskrivning: ${project.description}` : "",
    project.path ? `Sökväg: ${project.path}` : "",
    project.tags.length > 0 ? `Taggar: ${project.tags.join(", ")}` : "",
    project.settings.systemPromptExtra || "",
  ].filter(Boolean);

  return lines.join("\n");
}
