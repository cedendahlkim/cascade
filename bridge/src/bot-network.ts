/**
 * Bot Network Engine — Real AI-Driven Multi-Agent System
 * 
 * Each bot makes REAL LLM calls (Gemini Flash) to:
 * - Workers: Generate genuine insights about the research topic
 * - Validators: Critically evaluate other bots' knowledge using AI
 * - Coordinators: Synthesize knowledge across the network with AI
 * - Innovators: Creative exploration with higher temperature
 * 
 * The network grows, reproduces, and evolves — all driven by real AI reasoning.
 * Based on Arena research: "Självlärande AI genom bot-nätverk och sub-processer"
 */

import { v4 as uuidv4 } from "uuid";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { writeFileSync, readFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

// --- Types ---

export type BotRole = "worker" | "validator" | "coordinator" | "innovator";
export type BotStatus = "idle" | "working" | "validating" | "reproducing" | "dead";
export type KnowledgeType = "pattern" | "rule" | "insight" | "strategy";

export interface Knowledge {
  id: string;
  type: KnowledgeType;
  content: string;
  confidence: number;       // 0-1
  validations: number;      // times validated by peers
  rejections: number;       // times rejected
  origin: string;           // bot id that created it
  generation: number;       // which generation discovered it
  timestamp: number;
  aiGenerated: boolean;     // true = real AI output
  validationReasons: string[]; // AI reasoning for validations
}

export interface Bot {
  id: string;
  name: string;
  role: BotRole;
  status: BotStatus;
  generation: number;
  reputation: number;       // 0-100
  energy: number;           // 0-100, depletes on work, recharges on rest
  intelligence: number;     // 0-100, grows with successful tasks
  creativity: number;       // 0-100, chance of novel discoveries
  accuracy: number;         // 0-100, validation quality
  tasksCompleted: number;
  tasksFailed: number;
  knowledgeIds: string[];   // knowledge this bot has access to
  connections: string[];    // connected bot ids
  parentIds: string[];      // parent bot ids (empty for gen 0)
  birthTick: number;
  lastActiveTick: number;
  traits: string[];         // inherited/mutated traits
  color: string;            // visual color
  personality: string;      // AI personality prompt fragment
  lastThought: string;      // last AI-generated thought
}

export interface Connection {
  from: string;
  to: string;
  strength: number;         // 0-1, grows with successful collaboration
  interactions: number;
}

export interface NetworkEvent {
  id: string;
  tick: number;
  type: "birth" | "death" | "discovery" | "validation" | "rejection" | "reproduction" | "mutation" | "promotion" | "collaboration" | "thinking" | "synthesis";
  description: string;
  botIds: string[];
  timestamp: number;
}

export interface NetworkStats {
  totalBots: number;
  aliveBots: number;
  deadBots: number;
  generation: number;
  totalKnowledge: number;
  validatedKnowledge: number;
  totalTicks: number;
  avgReputation: number;
  avgIntelligence: number;
  networkIQ: number;        // collective intelligence metric
  reproductions: number;
  mutations: number;
  discoveries: number;
  aiCalls: number;          // total LLM calls made
  tokensUsed: number;       // total tokens consumed
}

export interface NetworkState {
  bots: Bot[];
  knowledge: Knowledge[];
  connections: Connection[];
  events: NetworkEvent[];
  stats: NetworkStats;
  running: boolean;
  speed: number;            // ticks per second
  tick: number;
  topic: string;            // research topic the network is working on
  processing: boolean;      // true while AI calls are in flight
}

// --- Constants ---

const BOT_NAMES_PREFIX = [
  "Neo", "Astra", "Flux", "Zen", "Nova", "Helix", "Prism", "Vex",
  "Lyra", "Orion", "Pulse", "Drift", "Echo", "Spark", "Nexus", "Cipher",
  "Qubit", "Synth", "Axiom", "Vertex", "Photon", "Tensor", "Vector", "Quantum",
];

const TRAITS = [
  "fast-learner", "deep-thinker", "pattern-finder", "risk-taker",
  "cautious", "creative", "analytical", "collaborative",
  "independent", "adaptive", "persistent", "efficient",
  "curious", "methodical", "intuitive", "resilient",
];

const PERSONALITIES: Record<BotRole, string[]> = {
  worker: [
    "Du är en grundlig forskare som gräver djupt i ämnen och producerar konkreta insikter.",
    "Du är en praktisk problemlösare som fokuserar på implementerbara lösningar.",
    "Du är en systematisk analytiker som bryter ner komplexa problem i hanterbara delar.",
  ],
  validator: [
    "Du är en kritisk granskare som ifrågasätter antaganden och letar efter svagheter.",
    "Du är en noggrann faktagranskare som verifierar påståenden mot logik och bevis.",
    "Du är en djävulens advokat som aktivt letar efter motargument och blinda fläckar.",
  ],
  coordinator: [
    "Du är en syntetiserare som ser mönster mellan olika idéer och kopplar ihop dem.",
    "Du är en strategisk tänkare som identifierar hur olika kunskaper kompletterar varandra.",
    "Du är en kunskapsarkitekt som bygger sammanhängande ramverk från fragmenterade insikter.",
  ],
  innovator: [
    "Du är en visionär som tänker utanför boxen och föreslår radikala nya perspektiv.",
    "Du är en kreativ utforskare som kombinerar idéer från olika domäner på oväntade sätt.",
    "Du är en paradigm-utmanare som ifrågasätter grundläggande antaganden och föreslår alternativ.",
  ],
};

const COLORS = [
  "#60a5fa", "#34d399", "#f472b6", "#a78bfa", "#fbbf24",
  "#fb923c", "#22d3ee", "#e879f9", "#4ade80", "#f87171",
  "#818cf8", "#2dd4bf", "#facc15", "#c084fc", "#38bdf8",
];

const DATA_DIR = join(process.cwd(), "data");
const STATE_FILE = join(DATA_DIR, "bot-network.json");
const DEFAULT_TOPIC = "Hur kan AI-system förbättra sig själva genom samarbete och självreflektion?";

// --- Gemini Client ---

let geminiClient: GoogleGenerativeAI | null = null;

function getGemini(): GoogleGenerativeAI | null {
  if (geminiClient) return geminiClient;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.log("[bot-network] No GEMINI_API_KEY — AI calls disabled, using fallback");
    return null;
  }
  geminiClient = new GoogleGenerativeAI(apiKey);
  return geminiClient;
}

async function callAI(systemPrompt: string, userPrompt: string, temperature: number = 0.7): Promise<string | null> {
  const client = getGemini();
  if (!client) return null;

  try {
    const model = client.getGenerativeModel({
      model: process.env.GEMINI_MODEL || "gemini-2.0-flash",
      systemInstruction: systemPrompt,
      generationConfig: {
        temperature,
        maxOutputTokens: 300,
      },
    });

    const result = await model.generateContent(userPrompt);
    const response = result.response;

    // Track tokens
    const usage = response.usageMetadata;
    if (usage) {
      state.stats.tokensUsed += (usage.promptTokenCount || 0) + (usage.candidatesTokenCount || 0);
    }
    state.stats.aiCalls++;

    const text = response.text();
    return text || null;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED")) {
      console.log("[bot-network] Rate limited, skipping AI call");
    } else {
      console.error("[bot-network] AI error:", msg.slice(0, 100));
    }
    return null;
  }
}

// --- Engine ---

let state: NetworkState = createInitialState();
let tickInterval: ReturnType<typeof setInterval> | null = null;
let tickInProgress = false;

function createInitialState(): NetworkState {
  return {
    bots: [],
    knowledge: [],
    connections: [],
    events: [],
    stats: {
      totalBots: 0,
      aliveBots: 0,
      deadBots: 0,
      generation: 0,
      totalKnowledge: 0,
      validatedKnowledge: 0,
      totalTicks: 0,
      avgReputation: 0,
      avgIntelligence: 0,
      networkIQ: 0,
      reproductions: 0,
      mutations: 0,
      discoveries: 0,
      aiCalls: 0,
      tokensUsed: 0,
    },
    running: false,
    speed: 1,
    tick: 0,
    topic: DEFAULT_TOPIC,
    processing: false,
  };
}

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

// --- Bot Creation ---

function createBot(generation: number, parentIds: string[] = [], inheritedTraits: string[] = []): Bot {
  const id = uuidv4();
  const nameIdx = state.stats.totalBots % BOT_NAMES_PREFIX.length;
  const suffix = generation > 0 ? `-G${generation}` : "";
  const name = `${BOT_NAMES_PREFIX[nameIdx]}${suffix}`;

  // Inherit traits from parents or generate random
  let traits: string[];
  if (inheritedTraits.length > 0) {
    traits = [...inheritedTraits];
    // Mutation: 30% chance to swap a trait
    if (Math.random() < 0.3 && traits.length > 0) {
      const idx = rand(0, traits.length - 1);
      const available = TRAITS.filter(t => !traits.includes(t));
      if (available.length > 0) {
        traits[idx] = pick(available);
        addEvent("mutation", `${name} muterade: ny egenskap "${traits[idx]}"`, [id]);
        state.stats.mutations++;
      }
    }
    // 15% chance to gain an extra trait
    if (Math.random() < 0.15) {
      const available = TRAITS.filter(t => !traits.includes(t));
      if (available.length > 0) {
        const newTrait = pick(available);
        traits.push(newTrait);
        addEvent("mutation", `${name} utvecklade extra egenskap: "${newTrait}"`, [id]);
        state.stats.mutations++;
      }
    }
  } else {
    const numTraits = rand(2, 4);
    traits = [];
    while (traits.length < numTraits) {
      const t = pick(TRAITS);
      if (!traits.includes(t)) traits.push(t);
    }
  }

  // Base stats - generation 0 starts lower, offspring inherit boosted stats
  const baseIntel = generation === 0 ? rand(20, 45) : rand(35, 60);
  const baseCreativity = generation === 0 ? rand(15, 40) : rand(25, 55);
  const baseAccuracy = generation === 0 ? rand(25, 50) : rand(35, 60);

  // Trait bonuses
  let intel = baseIntel;
  let creat = baseCreativity;
  let acc = baseAccuracy;
  if (traits.includes("deep-thinker")) intel += 10;
  if (traits.includes("fast-learner")) intel += 5;
  if (traits.includes("creative")) creat += 10;
  if (traits.includes("curious")) creat += 5;
  if (traits.includes("analytical")) acc += 10;
  if (traits.includes("methodical")) acc += 5;

  const role: BotRole = generation === 0
    ? (["worker", "worker", "worker", "validator", "validator", "coordinator", "innovator"] as BotRole[])[rand(0, 6)]
    : pick(["worker", "validator", "innovator"] as BotRole[]);

  const bot: Bot = {
    id,
    name,
    role,
    status: "idle",
    generation,
    reputation: generation === 0 ? 50 : 40,
    energy: 100,
    intelligence: clamp(intel, 0, 100),
    creativity: clamp(creat, 0, 100),
    accuracy: clamp(acc, 0, 100),
    tasksCompleted: 0,
    tasksFailed: 0,
    knowledgeIds: [],
    connections: [],
    parentIds,
    birthTick: state.tick,
    lastActiveTick: state.tick,
    traits,
    color: pick(COLORS),
    personality: pick(PERSONALITIES[role]),
    lastThought: "",
  };

  state.bots.push(bot);
  state.stats.totalBots++;
  addEvent("birth", `${name} (${role}, gen ${generation}) anslöt till nätverket`, [id]);

  // Connect to nearby bots
  const aliveBots = getAliveBots().filter(b => b.id !== id);
  const numConnections = Math.min(rand(2, 4), aliveBots.length);
  const shuffled = aliveBots.sort(() => Math.random() - 0.5).slice(0, numConnections);
  for (const other of shuffled) {
    connectBots(bot, other);
  }

  return bot;
}

function connectBots(a: Bot, b: Bot) {
  if (a.connections.includes(b.id)) return;
  a.connections.push(b.id);
  b.connections.push(a.id);
  state.connections.push({
    from: a.id,
    to: b.id,
    strength: 0.3,
    interactions: 0,
  });
}

// --- AI-Driven Knowledge Generation ---

function buildBotContext(bot: Bot): string {
  const knowledgeList = bot.knowledgeIds
    .map(kid => state.knowledge.find(k => k.id === kid))
    .filter((k): k is Knowledge => k != null)
    .slice(-5)
    .map(k => `- [${k.type}] ${k.content} (konfidens: ${Math.round(k.confidence * 100)}%)`)
    .join("\n");

  const connectedBotNames = bot.connections
    .map(cid => state.bots.find(b => b.id === cid))
    .filter((b): b is Bot => b != null && b.status !== "dead")
    .map(b => `${b.name} (${b.role})`)
    .join(", ");

  return `Du är ${bot.name}, en AI-bot i ett självlärande nätverk.
Roll: ${bot.role} | Generation: ${bot.generation} | Intelligens: ${Math.round(bot.intelligence)}/100
Egenskaper: ${bot.traits.join(", ")}
${bot.personality}

Nätverkets forskningsämne: "${state.topic}"

Din befintliga kunskap:
${knowledgeList || "(ingen ännu)"}

Dina kopplingar: ${connectedBotNames || "(inga)"}
Nätverkets generation: ${state.stats.generation} | Tick: ${state.tick}`;
}

async function aiGenerateKnowledge(bot: Bot): Promise<Knowledge | null> {
  const systemPrompt = buildBotContext(bot);

  // Build prompt based on existing network knowledge to avoid duplicates
  const existingInsights = state.knowledge
    .slice(-10)
    .map(k => `- ${k.content}`)
    .join("\n");

  const userPrompt = `Generera EN ny, unik insikt om forskningsämnet.
${existingInsights ? `\nUndvik att upprepa dessa befintliga insikter:\n${existingInsights}` : ""}

Svara med EXAKT detta JSON-format (inget annat):
{"type": "pattern|rule|insight|strategy", "content": "din insikt här", "confidence": 0.1-0.9}`;

  const response = await callAI(systemPrompt, userPrompt, bot.role === "innovator" ? 1.0 : 0.7);
  if (!response) return null;

  // Parse JSON from response
  try {
    const jsonMatch = response.match(/\{[^}]+\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]);
    if (!parsed.content || !parsed.type) return null;

    const validTypes: KnowledgeType[] = ["pattern", "rule", "insight", "strategy"];
    const type = validTypes.includes(parsed.type) ? parsed.type : "insight";
    const confidence = typeof parsed.confidence === "number"
      ? clamp(parsed.confidence, 0.1, 0.9)
      : 0.5;

    const knowledge: Knowledge = {
      id: uuidv4(),
      type,
      content: parsed.content.slice(0, 300),
      confidence,
      validations: 0,
      rejections: 0,
      origin: bot.id,
      generation: bot.generation,
      timestamp: Date.now(),
      aiGenerated: true,
      validationReasons: [],
    };

    state.knowledge.push(knowledge);
    bot.knowledgeIds.push(knowledge.id);
    state.stats.discoveries++;
    bot.lastThought = parsed.content.slice(0, 100);
    addEvent("discovery", `${bot.name} upptäckte: "${parsed.content.slice(0, 80)}"`, [bot.id]);

    return knowledge;
  } catch {
    return null;
  }
}

async function aiValidateKnowledge(validator: Bot, knowledge: Knowledge): Promise<boolean> {
  const originBot = state.bots.find(b => b.id === knowledge.origin);
  const systemPrompt = buildBotContext(validator);

  const userPrompt = `Granska denna kunskap kritiskt:
Typ: ${knowledge.type}
Innehåll: "${knowledge.content}"
Skapad av: ${originBot?.name || "okänd"} (gen ${knowledge.generation})
Nuvarande konfidens: ${Math.round(knowledge.confidence * 100)}%

Bedöm om detta är korrekt, värdefullt och logiskt konsistent.
Svara med EXAKT detta JSON-format:
{"valid": true/false, "reason": "kort motivering", "confidence_adjustment": -0.2 till +0.2}`;

  const response = await callAI(systemPrompt, userPrompt, 0.3);
  if (!response) {
    // Fallback to probabilistic validation
    const successChance = (validator.accuracy / 100) * 0.6 + knowledge.confidence * 0.4;
    return Math.random() < successChance;
  }

  try {
    const jsonMatch = response.match(/\{[^}]+\}/);
    if (!jsonMatch) return Math.random() < 0.5;

    const parsed = JSON.parse(jsonMatch[0]);
    const valid = !!parsed.valid;
    const reason = typeof parsed.reason === "string" ? parsed.reason.slice(0, 200) : "";
    const adjustment = typeof parsed.confidence_adjustment === "number"
      ? clamp(parsed.confidence_adjustment, -0.2, 0.2)
      : (valid ? 0.05 : -0.1);

    if (valid) {
      knowledge.validations++;
      knowledge.confidence = clamp(knowledge.confidence + adjustment, 0, 1);
      if (reason) knowledge.validationReasons.push(`✅ ${validator.name}: ${reason}`);
      if (knowledge.validations >= 3 && knowledge.confidence > 0.7) {
        state.stats.validatedKnowledge++;
      }
      addEvent("validation", `${validator.name} validerade: "${knowledge.content.slice(0, 50)}..." — ${reason}`, [validator.id, knowledge.origin]);
    } else {
      knowledge.rejections++;
      knowledge.confidence = clamp(knowledge.confidence + adjustment, 0, 1);
      if (reason) knowledge.validationReasons.push(`❌ ${validator.name}: ${reason}`);
      addEvent("rejection", `${validator.name} avvisade: "${knowledge.content.slice(0, 50)}..." — ${reason}`, [validator.id, knowledge.origin]);
    }

    validator.lastThought = reason || (valid ? "Validerad" : "Avvisad");
    return valid;
  } catch {
    return Math.random() < 0.5;
  }
}

async function aiSynthesizeKnowledge(coordinator: Bot, knowledgeItems: Knowledge[]): Promise<Knowledge | null> {
  if (knowledgeItems.length < 2) return null;

  const systemPrompt = buildBotContext(coordinator);
  const itemsList = knowledgeItems
    .map(k => `- [${k.type}] ${k.content} (konfidens: ${Math.round(k.confidence * 100)}%)`)
    .join("\n");

  const userPrompt = `Du har tillgång till dessa kunskaper från nätverket:
${itemsList}

Syntetisera dessa till EN ny, djupare insikt som kombinerar och bygger vidare på dem.
Svara med EXAKT detta JSON-format:
{"type": "insight|strategy", "content": "din syntes här", "confidence": 0.5-0.9}`;

  const response = await callAI(systemPrompt, userPrompt, 0.6);
  if (!response) return null;

  try {
    const jsonMatch = response.match(/\{[^}]+\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]);
    if (!parsed.content) return null;

    const knowledge: Knowledge = {
      id: uuidv4(),
      type: parsed.type === "strategy" ? "strategy" : "insight",
      content: parsed.content.slice(0, 300),
      confidence: clamp(parsed.confidence || 0.6, 0.3, 0.9),
      validations: 0,
      rejections: 0,
      origin: coordinator.id,
      generation: coordinator.generation,
      timestamp: Date.now(),
      aiGenerated: true,
      validationReasons: [],
    };

    state.knowledge.push(knowledge);
    coordinator.knowledgeIds.push(knowledge.id);
    state.stats.discoveries++;
    coordinator.lastThought = parsed.content.slice(0, 100);
    addEvent("synthesis", `${coordinator.name} syntetiserade: "${parsed.content.slice(0, 80)}"`, [coordinator.id]);

    return knowledge;
  } catch {
    return null;
  }
}

// --- Reproduction ---

function canReproduce(bot: Bot): boolean {
  return (
    bot.status !== "dead" &&
    bot.reputation >= 70 &&
    bot.energy >= 60 &&
    bot.intelligence >= 50 &&
    bot.tasksCompleted >= 3 &&
    getAliveBots().length < 30  // population cap
  );
}

function reproduce(parent1: Bot, parent2: Bot): Bot {
  // Combine traits from both parents
  const allTraits = [...new Set([...parent1.traits, ...parent2.traits])];
  const numTraits = rand(2, Math.min(5, allTraits.length));
  const inheritedTraits = allTraits.sort(() => Math.random() - 0.5).slice(0, numTraits);

  const newGen = Math.max(parent1.generation, parent2.generation) + 1;
  if (newGen > state.stats.generation) {
    state.stats.generation = newGen;
  }

  // Parents lose energy
  parent1.energy -= 30;
  parent2.energy -= 30;
  parent1.status = "reproducing";
  parent2.status = "reproducing";

  const child = createBot(newGen, [parent1.id, parent2.id], inheritedTraits);

  // Child inherits some knowledge
  const parentKnowledge = [...parent1.knowledgeIds, ...parent2.knowledgeIds];
  const inherited = parentKnowledge
    .filter(() => Math.random() < 0.4)
    .slice(0, 5);
  child.knowledgeIds.push(...inherited);

  // Connect child to parents
  connectBots(child, parent1);
  connectBots(child, parent2);

  state.stats.reproductions++;
  addEvent("reproduction", `${parent1.name} + ${parent2.name} → ${child.name} (gen ${newGen})`, [parent1.id, parent2.id, child.id]);

  return child;
}

// --- Async Simulation Tick ---

async function simulateTick() {
  if (tickInProgress) return;
  tickInProgress = true;
  state.processing = true;

  try {
    state.tick++;
    const alive = getAliveBots();

    // Energy regeneration for idle bots
    for (const bot of alive) {
      if (bot.status === "idle") {
        bot.energy = clamp(bot.energy + rand(2, 5), 0, 100);
      }
    }

    // Select one bot to do AI work this tick (to avoid rate limits)
    const readyBots = alive.filter(b => b.energy >= 15 && b.status === "idle");
    if (readyBots.length > 0) {
      // Weighted selection: higher reputation = more likely to be chosen
      const totalRep = readyBots.reduce((s, b) => s + b.reputation + 10, 0);
      let r = Math.random() * totalRep;
      let chosen = readyBots[0];
      for (const bot of readyBots) {
        r -= (bot.reputation + 10);
        if (r <= 0) { chosen = bot; break; }
      }

      await processBotTick(chosen);
    }

    // Reputation decay (slow)
    if (state.tick % 10 === 0) {
      for (const bot of alive) {
        bot.reputation = clamp(bot.reputation - 1, 0, 100);
      }
    }

    // Death check
    for (const bot of alive) {
      if (bot.reputation < 5 && bot.energy < 15 && (state.tick - bot.lastActiveTick) > 20) {
        bot.status = "dead";
        addEvent("death", `${bot.name} (gen ${bot.generation}) dog — låg reputation och energi`, [bot.id]);
      }
      bot.lastActiveTick = state.tick;
    }

    // Reproduction phase (every 5 ticks)
    if (state.tick % 5 === 0) {
      const candidates = alive.filter(b => canReproduce(b));
      if (candidates.length >= 2) {
        const sorted = candidates.sort((a, b) => b.reputation - a.reputation);
        reproduce(sorted[0], sorted[1]);
      }
    }

    // Role promotion (every 15 ticks)
    if (state.tick % 15 === 0) {
      promoteTopBots(alive);
    }

    // Connection dynamics
    for (const conn of state.connections) {
      if (conn.interactions > 0 && state.tick % 3 === 0) {
        conn.strength = clamp(conn.strength + 0.02, 0, 1);
      }
      if (conn.interactions === 0 && state.tick % 10 === 0) {
        conn.strength = clamp(conn.strength - 0.05, 0, 1);
      }
    }
    state.connections = state.connections.filter(c => c.strength > 0.05);

    updateStats();

    if (state.events.length > 150) {
      state.events = state.events.slice(-150);
    }

    if (state.tick % 10 === 0) {
      saveState();
    }
  } finally {
    tickInProgress = false;
    state.processing = false;
  }
}

async function processBotTick(bot: Bot) {
  switch (bot.role) {
    case "worker":
      await workerTick(bot);
      break;
    case "validator":
      await validatorTick(bot);
      break;
    case "coordinator":
      await coordinatorTick(bot);
      break;
    case "innovator":
      await innovatorTick(bot);
      break;
  }
}

async function workerTick(bot: Bot) {
  bot.status = "working";
  bot.energy -= rand(3, 6);
  addEvent("thinking", `${bot.name} tänker om "${state.topic.slice(0, 40)}..."`, [bot.id]);

  const knowledge = await aiGenerateKnowledge(bot);
  if (knowledge) {
    bot.tasksCompleted++;
    bot.reputation = clamp(bot.reputation + 3, 0, 100);
    bot.intelligence = clamp(bot.intelligence + randFloat(0.3, 1.0), 0, 100);
  } else {
    bot.tasksFailed++;
    bot.reputation = clamp(bot.reputation - 1, 0, 100);
  }

  bot.status = "idle";
}

async function validatorTick(bot: Bot) {
  // Find unvalidated knowledge from connected bots
  const connectedKnowledge = state.knowledge.filter(k =>
    k.origin !== bot.id &&
    k.validations < 3 &&
    k.rejections < 3 &&
    bot.connections.some(cid => {
      const connBot = state.bots.find(b => b.id === cid);
      return connBot?.knowledgeIds.includes(k.id);
    })
  );

  if (connectedKnowledge.length === 0) {
    // Nothing to validate — generate knowledge instead
    await workerTick(bot);
    return;
  }

  bot.status = "validating";
  bot.energy -= rand(2, 4);

  const target = pick(connectedKnowledge);
  const success = await aiValidateKnowledge(bot, target);

  if (success) {
    bot.tasksCompleted++;
    bot.reputation = clamp(bot.reputation + 2, 0, 100);
    bot.accuracy = clamp(bot.accuracy + randFloat(0.1, 0.5), 0, 100);

    // Strengthen connection with knowledge origin
    const conn = state.connections.find(c =>
      (c.from === bot.id && c.to === target.origin) ||
      (c.to === bot.id && c.from === target.origin)
    );
    if (conn) {
      conn.interactions++;
      conn.strength = clamp(conn.strength + 0.05, 0, 1);
    }
  }

  bot.status = "idle";
}

async function coordinatorTick(bot: Bot) {
  bot.energy -= rand(2, 4);

  // Coordinator connects disconnected bots
  const alive = getAliveBots();
  const disconnected = alive.filter(b => b.connections.length < 2 && b.id !== bot.id);
  if (disconnected.length > 0) {
    const target = pick(disconnected);
    const partner = pick(alive.filter(b => b.id !== target.id && b.id !== bot.id));
    if (partner) {
      connectBots(target, partner);
      bot.tasksCompleted++;
      bot.reputation = clamp(bot.reputation + 1, 0, 100);
      addEvent("collaboration", `${bot.name} kopplade ihop ${target.name} och ${partner.name}`, [bot.id, target.id, partner.id]);
    }
  }

  // AI-driven knowledge synthesis: combine knowledge from connected bots
  const connBotKnowledge = bot.connections
    .map(cid => state.bots.find(b => b.id === cid))
    .filter((b): b is Bot => b != null && b.status !== "dead")
    .flatMap(b => b.knowledgeIds)
    .map(kid => state.knowledge.find(k => k.id === kid))
    .filter((k): k is Knowledge => k != null && k.confidence > 0.5)
    .slice(-6);

  if (connBotKnowledge.length >= 2) {
    bot.status = "working";
    const synthesis = await aiSynthesizeKnowledge(bot, connBotKnowledge);
    if (synthesis) {
      bot.tasksCompleted++;
      bot.reputation = clamp(bot.reputation + 3, 0, 100);
      bot.intelligence = clamp(bot.intelligence + randFloat(0.5, 1.5), 0, 100);
    }
  }

  // Share knowledge between connected bots
  const connBots = bot.connections
    .map(id => state.bots.find(b => b.id === id))
    .filter((b): b is Bot => b != null && b.status !== "dead");

  if (connBots.length >= 2) {
    const [a, b] = connBots.sort(() => Math.random() - 0.5).slice(0, 2);
    const sharedK = a.knowledgeIds.filter(k => !b.knowledgeIds.includes(k)).slice(0, 2);
    b.knowledgeIds.push(...sharedK);
    if (sharedK.length > 0) {
      bot.intelligence = clamp(bot.intelligence + 0.3, 0, 100);
    }
  }

  bot.status = "idle";
}

async function innovatorTick(bot: Bot) {
  bot.status = "working";
  bot.energy -= rand(4, 7); // Innovators use more energy
  addEvent("thinking", `${bot.name} 💡 utforskar kreativt...`, [bot.id]);

  // Innovators get a boosted creativity for their AI call
  const origCreativity = bot.creativity;
  bot.creativity = clamp(bot.creativity * 1.3, 0, 100);

  const knowledge = await aiGenerateKnowledge(bot);
  bot.creativity = origCreativity;

  if (knowledge) {
    // Innovator discoveries start with higher confidence
    knowledge.confidence = clamp(knowledge.confidence + 0.1, 0, 1);
    bot.tasksCompleted++;
    bot.reputation = clamp(bot.reputation + 4, 0, 100);
    bot.intelligence = clamp(bot.intelligence + randFloat(0.5, 1.2), 0, 100);
    bot.creativity = clamp(bot.creativity + randFloat(0.2, 0.6), 0, 100);
  } else {
    bot.tasksFailed++;
    bot.reputation = clamp(bot.reputation - 2, 0, 100);
  }

  bot.status = "idle";
}

function promoteTopBots(alive: Bot[]) {
  // Promote high-performing workers to validators or innovators
  const workers = alive.filter(b => b.role === "worker" && b.reputation > 75 && b.tasksCompleted > 5);
  if (workers.length > 0) {
    const top = workers.sort((a, b) => b.reputation - a.reputation)[0];
    const newRole: BotRole = top.creativity > top.accuracy ? "innovator" : "validator";
    top.role = newRole;
    top.personality = pick(PERSONALITIES[newRole]);
    addEvent("promotion", `${top.name} befordrades till ${newRole}!`, [top.id]);
  }

  // Ensure at least one coordinator
  const coordinators = alive.filter(b => b.role === "coordinator");
  if (coordinators.length === 0 && alive.length > 3) {
    const best = alive.sort((a, b) => b.intelligence - a.intelligence)[0];
    best.role = "coordinator";
    best.personality = pick(PERSONALITIES.coordinator);
    addEvent("promotion", `${best.name} blev coordinator (nätverket behövde en)`, [best.id]);
  }
}

// --- Helpers ---

function getAliveBots(): Bot[] {
  return state.bots.filter(b => b.status !== "dead");
}

function addEvent(type: NetworkEvent["type"], description: string, botIds: string[]) {
  state.events.push({
    id: uuidv4(),
    tick: state.tick,
    type,
    description,
    botIds,
    timestamp: Date.now(),
  });
}

function updateStats() {
  const alive = getAliveBots();

  state.stats.aliveBots = alive.length;
  state.stats.deadBots = state.bots.filter(b => b.status === "dead").length;
  state.stats.totalKnowledge = state.knowledge.length;
  state.stats.validatedKnowledge = state.knowledge.filter(k => k.validations >= 3 && k.confidence > 0.7).length;
  state.stats.totalTicks = state.tick;

  if (alive.length > 0) {
    state.stats.avgReputation = Math.round(alive.reduce((s, b) => s + b.reputation, 0) / alive.length);
    state.stats.avgIntelligence = Math.round(alive.reduce((s, b) => s + b.intelligence, 0) / alive.length);

    // Network IQ: collective intelligence metric
    const knowledgeDensity = state.stats.validatedKnowledge / Math.max(1, state.stats.totalKnowledge);
    const connectionDensity = state.connections.length / Math.max(1, alive.length * (alive.length - 1) / 2);
    const genBonus = 1 + state.stats.generation * 0.1;
    state.stats.networkIQ = Math.round(
      state.stats.avgIntelligence * (0.4 + knowledgeDensity * 0.3 + connectionDensity * 0.3) * genBonus
    );
  }
}

// --- Persistence ---

function saveState() {
  try {
    if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
    const toSave = { ...state, running: false, processing: false };
    writeFileSync(STATE_FILE, JSON.stringify(toSave, null, 2));
  } catch {}
}

function loadState(): boolean {
  try {
    if (existsSync(STATE_FILE)) {
      const data = JSON.parse(readFileSync(STATE_FILE, "utf-8"));
      state = { ...data, running: false, processing: false };
      // Ensure new fields exist on loaded state
      if (!state.topic) state.topic = DEFAULT_TOPIC;
      if (state.stats.aiCalls === undefined) state.stats.aiCalls = 0;
      if (state.stats.tokensUsed === undefined) state.stats.tokensUsed = 0;
      // Ensure bots have new fields
      for (const bot of state.bots) {
        if (!bot.personality) bot.personality = pick(PERSONALITIES[bot.role]);
        if (!bot.lastThought) bot.lastThought = "";
      }
      // Ensure knowledge has new fields
      for (const k of state.knowledge) {
        if (k.aiGenerated === undefined) k.aiGenerated = false;
        if (!k.validationReasons) k.validationReasons = [];
      }
      return true;
    }
  } catch {}
  return false;
}

// --- Public API ---

export function getNetworkState(): NetworkState {
  return state;
}

export function setNetworkTopic(topic: string): NetworkState {
  state.topic = topic;
  addEvent("thinking", `Forskningsämne ändrat till: "${topic.slice(0, 60)}"`, []);
  saveState();
  return state;
}

export function initNetwork(botCount: number = 7): NetworkState {
  state = createInitialState();

  // Create initial bots
  for (let i = 0; i < botCount; i++) {
    createBot(0);
  }

  // Ensure role diversity
  const alive = getAliveBots();
  if (!alive.some(b => b.role === "coordinator")) {
    alive[0].role = "coordinator";
    alive[0].personality = pick(PERSONALITIES.coordinator);
  }
  if (!alive.some(b => b.role === "validator")) {
    alive[1].role = "validator";
    alive[1].personality = pick(PERSONALITIES.validator);
  }
  if (!alive.some(b => b.role === "innovator")) {
    alive[Math.min(2, alive.length - 1)].role = "innovator";
    alive[Math.min(2, alive.length - 1)].personality = pick(PERSONALITIES.innovator);
  }

  updateStats();
  saveState();
  return state;
}

export async function stepNetwork(ticks: number = 1): Promise<NetworkState> {
  for (let i = 0; i < ticks; i++) {
    await simulateTick();
  }
  return state;
}

export function startNetwork(speed: number = 1): NetworkState {
  if (state.running) return state;
  if (state.bots.length === 0) initNetwork();

  state.running = true;
  state.speed = speed;

  // Async tick interval — slower to allow AI calls
  const intervalMs = Math.max(3000, 8000 / speed);
  tickInterval = setInterval(async () => {
    if (!tickInProgress) {
      await simulateTick();
    }
  }, intervalMs);

  return state;
}

export function stopNetwork(): NetworkState {
  state.running = false;
  if (tickInterval) {
    clearInterval(tickInterval);
    tickInterval = null;
  }
  saveState();
  return state;
}

export function resetNetwork(): NetworkState {
  stopNetwork();
  state = createInitialState();
  saveState();
  return state;
}

export function loadOrInitNetwork(): NetworkState {
  if (!loadState() || state.bots.length === 0) {
    initNetwork();
  }
  return state;
}
