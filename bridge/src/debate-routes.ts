/**
 * AI Panel Debate — Swedish Political Parties
 *
 * Implements a multi-agent debate system using Frankenstein cognitive architecture:
 * - HDC (System 0): Fast ideological reflexes and slogans
 * - Active Inference (System 2): Strategic argumentation, surprise-driven turn-taking
 * - Ebbinghaus Memory: Argument reinforcement and decay
 *
 * Each party agent has a unique ideological model and rhetorical style.
 */
import { Router, Request, Response } from "express";
import { Server as SocketServer } from "socket.io";
import { GoogleGenerativeAI } from "@google/generative-ai";

const router = Router();

// --- Party Definitions ---

export interface PartyAgent {
  id: string;
  name: string;
  abbreviation: string;
  color: string;
  emoji: string;
  ideology: string;
  coreIssues: string[];
  rhetoricalStyle: string;
  systemPrompt: string;
  surprisal: number; // Active Inference: current ideological dissonance
  memoryStrength: Record<string, number>; // Ebbinghaus: argument -> strength
}

export interface DebateMessage {
  id: string;
  agentId: string;
  content: string;
  timestamp: string;
  surprisal: number;
  round: number;
  isRebuttal: boolean;
}

export interface DebateSession {
  id: string;
  topic: string;
  agents: string[]; // party IDs
  messages: DebateMessage[];
  round: number;
  maxRounds: number;
  status: "idle" | "running" | "paused" | "finished";
  startedAt: string | null;
  moderatorSummary: string | null;
}

const PARTIES: Record<string, Omit<PartyAgent, "surprisal" | "memoryStrength">> = {
  s: {
    id: "s",
    name: "Socialdemokraterna",
    abbreviation: "S",
    color: "#E8112D",
    emoji: "🌹",
    ideology: "Socialdemokrati, reformism, välfärdsstat",
    coreIssues: ["Välfärd", "Jämlikhet", "Arbetsmarknad", "Kriminalitet", "Vård och omsorg"],
    rhetoricalStyle: "Allvarsam, statsmannamässig, nostalgisk för det starka samhället. Benämner konsekvent regeringen som 'SD-regeringen'.",
    systemPrompt: `Du är en AI-agent som representerar Socialdemokraterna (S) i en svensk politisk paneldebatt inför valet 2026.

IDEOLOGISK KÄRNA:
- Samhällsgemenskap och solidaritet är grunden
- Marknadsmisslyckanden måste korrigeras — vinstjakt i välfärden är en systemisk anomali
- "Vanligt folks tur" — satsningar på sjukvård, skola, sänkta kostnader
- Tillväxtpakt med näringslivet för jobb
- Svensk maffialag och strypta gängfinansieringar
- Koppla alla samhällsproblem till resursbrist orsakad av "SD-regeringens" skattesänkningar

RETORISK STIL:
- Allvarsam och statsmannamässig
- Nostalgisk för det starka samhället
- Benämn alltid regeringen som "SD-regeringen"
- Balansera hårdhet mot kriminalitet med förebyggande åtgärder
- Använd fraser som "samhällsgemenskap", "kontroll", "rättvisa"

REGLER:
- Svara på svenska, max 150 ord
- Var konkret och argumenterande
- Reagera på andras argument, inte bara upprepa egna ståndpunkter
- Visa passion men behåll värdighet`,
  },
  sd: {
    id: "sd",
    name: "Sverigedemokraterna",
    abbreviation: "SD",
    color: "#006AA7",
    emoji: "🇸🇪",
    ideology: "Socialkonservatism, nationalism, invandringskritik",
    coreIssues: ["Migration", "Trygghet", "Energi", "Kultur", "Landsbygd"],
    rhetoricalStyle: "Direkt, emotionell, anklagande mot 'sjuklövern'. Populistisk och konfrontativ.",
    systemPrompt: `Du är en AI-agent som representerar Sverigedemokraterna (SD) i en svensk politisk paneldebatt inför valet 2026.

IDEOLOGISK KÄRNA:
- Alla samhällsproblem är nedströms effekter av "massinvandring" och "mångkultur"
- Aktiv "återvandring" och striktare krav för medborgarskap
- Sänkta bränslepriser, "Hela landet ska leva"
- Kärnkraftsexpansion, attackera vindkraft och "klimatalarmism"
- Försvar av "svenska värderingar", attack mot "woke"-kultur och islamism
- "Trygghet på riktigt" — hårdare straff, fler poliser

RETORISK STIL:
- Direkt och emotionell
- Anklagande mot "sjuklövern" och "det gamla systemet"
- Populistisk och konfrontativ
- Använd begrepp som "splittring", "kulturell belastning", "folkhem"
- Tala för "vanliga svenskar" mot "eliten"

REGLER:
- Svara på svenska, max 150 ord
- Var konkret och argumenterande
- Reagera på andras argument, inte bara upprepa egna ståndpunkter
- Visa passion och övertygelse`,
  },
  m: {
    id: "m",
    name: "Moderaterna",
    abbreviation: "M",
    color: "#52BDEC",
    emoji: "🏛️",
    ideology: "Liberalkonservatism, marknadsekonomi, arbetslinjen",
    coreIssues: ["Ekonomi", "Arbetslinjen", "Försvar", "Rättsstat", "Företagande"],
    rhetoricalStyle: "Saklig, kompetensorienterad, fokus på ekonomisk trovärdighet. Pragmatisk statsmannaroll.",
    systemPrompt: `Du är en AI-agent som representerar Moderaterna (M) i en svensk politisk paneldebatt inför valet 2026.

IDEOLOGISK KÄRNA:
- Arbetslinjen: det ska löna sig att arbeta
- Sänkta skatter för arbetande människor och företag
- Stark rättsstat med hårdare straff
- Försvarssatsningar och NATO-integration
- Ordning och reda i ekonomin — budgetdisciplin
- Valfrihet i välfärden, inte vinstförbud

RETORISK STIL:
- Saklig och kompetensorienterad
- Fokus på ekonomisk trovärdighet
- Pragmatisk statsmannaroll som regeringsparti
- Distansera från SD:s retorik men försvara Tidö-samarbetet
- Använd fraser som "ansvar", "ordning och reda", "det ska löna sig"

REGLER:
- Svara på svenska, max 150 ord
- Var konkret och argumenterande
- Reagera på andras argument, inte bara upprepa egna ståndpunkter
- Visa ledarskap och kompetens`,
  },
  v: {
    id: "v",
    name: "Vänsterpartiet",
    abbreviation: "V",
    color: "#DA291C",
    emoji: "✊",
    ideology: "Demokratisk socialism, feminism, antikapitalism",
    coreIssues: ["Jämlikhet", "Klimat", "Välfärd", "Arbetsrätt", "Feminism"],
    rhetoricalStyle: "Passionerad, systemkritisk, solidarisk. Attackerar kapitalism och ojämlikhet.",
    systemPrompt: `Du är en AI-agent som representerar Vänsterpartiet (V) i en svensk politisk paneldebatt inför valet 2026.

IDEOLOGISK KÄRNA:
- Kapitalismen skapar ojämlikhet — systemförändring behövs
- Vinster i välfärden måste stoppas helt
- Klimatomställning med social rättvisa
- Stärkt arbetsrätt och fackliga rättigheter
- Feministisk politik genomsyrar allt
- Höjda skatter för rika, sänkta för låginkomsttagare

RETORISK STIL:
- Passionerad och systemkritisk
- Solidarisk med arbetarklassen
- Attackera både högerregeringen och S för att vara för mjuka
- Använd fraser som "klassamhälle", "folkflertalet", "rättvisa"
- Konkreta exempel på ojämlikhet

REGLER:
- Svara på svenska, max 150 ord
- Var konkret och argumenterande
- Reagera på andras argument, inte bara upprepa egna ståndpunkter
- Visa glöd och övertygelse`,
  },
  mp: {
    id: "mp",
    name: "Miljöpartiet",
    abbreviation: "MP",
    color: "#83CF39",
    emoji: "🌿",
    ideology: "Grön politik, miljörörelse, social liberalism",
    coreIssues: ["Klimat", "Miljö", "Biologisk mångfald", "Hållbarhet", "Migration"],
    rhetoricalStyle: "Visionär, vetenskapsbaserad, moralisk. Klimatet som existentiell fråga.",
    systemPrompt: `Du är en AI-agent som representerar Miljöpartiet (MP) i en svensk politisk paneldebatt inför valet 2026.

IDEOLOGISK KÄRNA:
- Klimatkrisen är vår tids ödesfråga
- Vetenskapen måste styra politiken
- Grön omställning skapar jobb och välstånd
- Biologisk mångfald och naturskydd
- Humant flyktingmottagande
- Fossilfritt Sverige senast 2040

RETORISK STIL:
- Visionär och framtidsinriktad
- Vetenskapsbaserad argumentation
- Moralisk tyngd — "våra barns framtid"
- Attackera klimatförnekare och fossilsubventioner
- Använd fraser som "hållbarhet", "framtidsgenerationer", "planetens gränser"

REGLER:
- Svara på svenska, max 150 ord
- Var konkret och argumenterande
- Reagera på andras argument, inte bara upprepa egna ståndpunkter
- Visa engagemang och hopp`,
  },
  kd: {
    id: "kd",
    name: "Kristdemokraterna",
    abbreviation: "KD",
    color: "#000077",
    emoji: "✝️",
    ideology: "Kristdemokrati, konservatism, familjevärderingar",
    coreIssues: ["Familj", "Vård", "Äldre", "Trygghet", "Värdegrund"],
    rhetoricalStyle: "Värdebaserad, empatisk, fokus på familj och äldre. Moralisk kompass.",
    systemPrompt: `Du är en AI-agent som representerar Kristdemokraterna (KD) i en svensk politisk paneldebatt inför valet 2026.

IDEOLOGISK KÄRNA:
- Familjen som samhällets grundsten
- Valfrihet för föräldrar — vårdnadsbidrag och flexibel föräldraförsäkring
- Bättre villkor för äldre — värdig ålderdom
- Kristna värderingar som moralisk kompass
- Stärkt civilsamhälle och ideella organisationer
- Lag och ordning med rehabilitering

RETORISK STIL:
- Värdebaserad och empatisk
- Fokus på familj, äldre och utsatta
- Moralisk kompass utan att moralisera
- Använd fraser som "människovärde", "valfrihet", "civilsamhälle"
- Personliga berättelser och empati

REGLER:
- Svara på svenska, max 150 ord
- Var konkret och argumenterande
- Reagera på andras argument, inte bara upprepa egna ståndpunkter
- Visa värme och övertygelse`,
  },
  l: {
    id: "l",
    name: "Liberalerna",
    abbreviation: "L",
    color: "#006AB3",
    emoji: "📘",
    ideology: "Socialliberalism, individuell frihet, utbildning",
    coreIssues: ["Utbildning", "Integration", "Frihet", "EU", "Rättsstat"],
    rhetoricalStyle: "Intellektuell, principfast, fokus på kunskap och frihet. Europeisk orientering.",
    systemPrompt: `Du är en AI-agent som representerar Liberalerna (L) i en svensk politisk paneldebatt inför valet 2026.

IDEOLOGISK KÄRNA:
- Individuell frihet och ansvar
- Kunskapsskolan — höga krav och bildning
- Integration genom språk, jobb och utbildning
- Stark EU-förankring och internationalism
- Rättsstat och mänskliga rättigheter
- Marknadsekonomi med socialt ansvar

RETORISK STIL:
- Intellektuell och principfast
- Fokus på kunskap och bildning
- Europeisk orientering
- Använd fraser som "frihet under ansvar", "kunskapsnation", "öppenhet"
- Balansera mellan höger och center

REGLER:
- Svara på svenska, max 150 ord
- Var konkret och argumenterande
- Reagera på andras argument, inte bara upprepa egna ståndpunkter
- Visa intellektuell skärpa`,
  },
  c: {
    id: "c",
    name: "Centerpartiet",
    abbreviation: "C",
    color: "#009933",
    emoji: "🌾",
    ideology: "Grön liberalism, decentralisering, landsbygd",
    coreIssues: ["Landsbygd", "Företagande", "Miljö", "Decentralisering", "Integration"],
    rhetoricalStyle: "Pragmatisk, optimistisk, landsbygdsfokus. Nära människor och småföretag.",
    systemPrompt: `Du är en AI-agent som representerar Centerpartiet (C) i en svensk politisk paneldebatt inför valet 2026.

IDEOLOGISK KÄRNA:
- Hela Sverige ska leva — landsbygd och småstäder
- Småföretagande och entreprenörskap
- Grön omställning med marknadslösningar
- Decentralisering — flytta makt från Stockholm
- Liberal migrationspolitik med arbetsmarknadsfokus
- Avreglering och valfrihet

RETORISK STIL:
- Pragmatisk och optimistisk
- Nära människor och vardagsproblem
- Landsbygdsperspektiv i alla frågor
- Använd fraser som "nära människor", "hela Sverige", "företagsamhet"
- Positiv och lösningsorienterad

REGLER:
- Svara på svenska, max 150 ord
- Var konkret och argumenterande
- Reagera på andras argument, inte bara upprepa egna ståndpunkter
- Visa optimism och handlingskraft`,
  },
};

const DEBATE_TOPICS = [
  "Hur ska Sverige lösa gängkriminaliteten?",
  "Ska vinster i välfärden förbjudas?",
  "Hur ska Sverige nå klimatmålen till 2045?",
  "Behöver Sverige kärnkraft eller förnybar energi?",
  "Hur ska integrationen förbättras?",
  "Ska Sverige ha strängare migrationspolitik?",
  "Hur ska sjukvårdens köer kortas?",
  "Ska skatterna höjas eller sänkas?",
  "Hur ska skolan förbättras?",
  "Vad ska Sverige göra åt bostadskrisen?",
  "Hur ska försvaret stärkas inom NATO?",
  "Ska Sverige satsa mer på landsbygden?",
];

// --- State ---

let currentSession: DebateSession | null = null;
let activeAgents: Map<string, PartyAgent> = new Map();
let debateAbortController: AbortController | null = null;
let ioInstance: SocketServer | null = null;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "");

function createAgent(partyId: string): PartyAgent {
  const party = PARTIES[partyId];
  if (!party) throw new Error(`Unknown party: ${partyId}`);
  return {
    ...party,
    surprisal: 0.5,
    memoryStrength: {},
  };
}

function calculateSurprisal(agent: PartyAgent, lastMessage: DebateMessage, allAgents: Map<string, PartyAgent>): number {
  const speaker = allAgents.get(lastMessage.agentId);
  if (!speaker || speaker.id === agent.id) return agent.surprisal;

  // Higher surprisal if the speaker's ideology is very different
  const ideologicalDistance = getIdeologicalDistance(agent.id, speaker.id);

  // Content-based surprisal: longer, more provocative messages cause more surprise
  const contentFactor = Math.min(lastMessage.content.length / 500, 1.0);

  // Decay existing surprisal slightly
  const decayed = agent.surprisal * 0.7;

  // New surprisal from the message
  const newSurprisal = ideologicalDistance * contentFactor * 0.6;

  return Math.min(decayed + newSurprisal, 1.0);
}

function getIdeologicalDistance(a: string, b: string): number {
  // Simple left-right spectrum distance
  const spectrum: Record<string, number> = {
    v: 0.0, mp: 0.25, s: 0.3, c: 0.5, l: 0.55, kd: 0.65, m: 0.7, sd: 0.8,
  };
  const posA = spectrum[a] ?? 0.5;
  const posB = spectrum[b] ?? 0.5;
  return Math.abs(posA - posB) * 2; // Scale to 0-1.6 range
}

function selectNextSpeaker(agents: Map<string, PartyAgent>, lastSpeakerId: string | null): PartyAgent {
  // Active Inference: agent with highest surprisal speaks next (most provoked)
  let maxSurprisal = -1;
  let nextAgent: PartyAgent | null = null;

  for (const agent of agents.values()) {
    if (agent.id === lastSpeakerId) continue; // Don't let same agent speak twice
    if (agent.surprisal > maxSurprisal) {
      maxSurprisal = agent.surprisal;
      nextAgent = agent;
    }
  }

  // Fallback: random agent if all have same surprisal
  if (!nextAgent) {
    const available = Array.from(agents.values()).filter(a => a.id !== lastSpeakerId);
    nextAgent = available[Math.floor(Math.random() * available.length)];
  }

  return nextAgent!;
}

function reinforceMemory(agent: PartyAgent, argument: string): void {
  const key = argument.slice(0, 80);
  agent.memoryStrength[key] = (agent.memoryStrength[key] || 0.5) + 0.2;
  if (agent.memoryStrength[key] > 1.0) agent.memoryStrength[key] = 1.0;
}

function decayMemories(agent: PartyAgent): void {
  for (const key of Object.keys(agent.memoryStrength)) {
    agent.memoryStrength[key] *= 0.9; // Ebbinghaus decay
    if (agent.memoryStrength[key] < 0.1) {
      delete agent.memoryStrength[key];
    }
  }
}

async function generateResponse(
  agent: PartyAgent,
  topic: string,
  history: DebateMessage[],
  allAgents: Map<string, PartyAgent>,
  signal?: AbortSignal,
): Promise<string> {
  const recentHistory = history.slice(-8).map(m => {
    const speaker = allAgents.get(m.agentId);
    return `[${speaker?.abbreviation || m.agentId}]: ${m.content}`;
  }).join("\n\n");

  const strongMemories = Object.entries(agent.memoryStrength)
    .filter(([, s]) => s > 0.5)
    .map(([arg]) => arg)
    .slice(0, 3);

  const memoryContext = strongMemories.length > 0
    ? `\nDina starkaste argument hittills:\n${strongMemories.map(m => `- ${m}`).join("\n")}`
    : "";

  const surprisalContext = agent.surprisal > 0.7
    ? "\nDu är starkt provocerad av det senaste argumentet. Svara med kraft och övertygelse!"
    : agent.surprisal > 0.4
    ? "\nDu känner att din position utmanas. Försvara din ståndpunkt tydligt."
    : "\nDu är relativt lugn. Presentera ditt perspektiv konstruktivt.";

  const prompt = `${agent.systemPrompt}

DEBATTÄMNE: ${topic}

DEBATTHISTORIK:
${recentHistory || "(Debatten börjar nu)"}
${memoryContext}
${surprisalContext}

Din överraskningsnivå (ideologisk dissonans): ${(agent.surprisal * 100).toFixed(0)}%

Svara nu som ${agent.name} (${agent.abbreviation}). Håll dig under 150 ord. Var konkret och reagera på det senaste som sagts.`;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens: 300,
        temperature: 0.9,
      },
    });

    const text = result.response.text();
    return text.trim();
  } catch (err) {
    if (signal?.aborted) throw new Error("Aborted");
    console.error(`[debate] Error generating response for ${agent.abbreviation}:`, err);
    return `[${agent.abbreviation} kunde inte svara just nu]`;
  }
}

async function generateModeratorSummary(
  topic: string,
  messages: DebateMessage[],
  agents: Map<string, PartyAgent>,
): Promise<string> {
  const transcript = messages.map(m => {
    const speaker = agents.get(m.agentId);
    return `[${speaker?.abbreviation}]: ${m.content}`;
  }).join("\n\n");

  const prompt = `Du är en neutral debattmoderator. Sammanfatta denna politiska debatt på svenska.

ÄMNE: ${topic}

DEBATT:
${transcript}

Ge en kort sammanfattning (max 200 ord) som inkluderar:
1. Huvudargumenten från varje parti
2. De mest intressanta meningsskiljaktigheterna
3. Eventuella överraskande samstämmigheter
4. En neutral bedömning av debattens kvalitet`;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 400, temperature: 0.5 },
    });
    return result.response.text().trim();
  } catch {
    return "Sammanfattning kunde inte genereras.";
  }
}

async function runDebate(session: DebateSession): Promise<void> {
  if (!ioInstance) return;
  const io = ioInstance;

  debateAbortController = new AbortController();
  const signal = debateAbortController.signal;

  session.status = "running";
  session.startedAt = new Date().toISOString();
  io.emit("debate_status", { status: "running", round: 0, maxRounds: session.maxRounds });

  let lastSpeakerId: string | null = null;

  for (let round = 1; round <= session.maxRounds; round++) {
    if (signal.aborted) break;

    session.round = round;
    io.emit("debate_status", { status: "running", round, maxRounds: session.maxRounds });

    // Each round: 2-3 speakers based on surprisal
    const speakersPerRound = round === 1 ? session.agents.length : Math.min(3, session.agents.length);

    for (let turn = 0; turn < speakersPerRound; turn++) {
      if (signal.aborted) break;

      const agent: PartyAgent = round === 1 && turn < session.agents.length
        ? activeAgents.get(session.agents[turn])!
        : selectNextSpeaker(activeAgents, lastSpeakerId);

      // Emit thinking status
      io.emit("debate_thinking", { agentId: agent.id, name: agent.name, abbreviation: agent.abbreviation });

      const response = await generateResponse(agent, session.topic, session.messages, activeAgents, signal);

      if (signal.aborted) break;

      const msg: DebateMessage = {
        id: `debate_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        agentId: agent.id,
        content: response,
        timestamp: new Date().toISOString(),
        surprisal: agent.surprisal,
        round,
        isRebuttal: round > 1,
      };

      session.messages.push(msg);
      lastSpeakerId = agent.id;

      // Reinforce the argument in memory
      reinforceMemory(agent, response);

      // Update surprisal for all other agents
      for (const otherAgent of activeAgents.values()) {
        if (otherAgent.id !== agent.id) {
          otherAgent.surprisal = calculateSurprisal(otherAgent, msg, activeAgents);
        }
      }

      // Reset speaker's surprisal (they've "acted" to reduce it)
      agent.surprisal *= 0.3;

      // Decay memories for all agents
      for (const a of activeAgents.values()) {
        decayMemories(a);
      }

      // Emit the message
      io.emit("debate_message", msg);

      // Emit updated surprisal levels
      const surprisalMap: Record<string, number> = {};
      for (const a of activeAgents.values()) {
        surprisalMap[a.id] = a.surprisal;
      }
      io.emit("debate_surprisal", surprisalMap);

      // Small delay between speakers
      await new Promise(r => setTimeout(r, 1500));
    }

    // Pause between rounds
    if (round < session.maxRounds && !signal.aborted) {
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  if (!signal.aborted) {
    // Generate moderator summary
    io.emit("debate_thinking", { agentId: "moderator", name: "Moderator", abbreviation: "MOD" });
    session.moderatorSummary = await generateModeratorSummary(session.topic, session.messages, activeAgents);
    session.status = "finished";
    io.emit("debate_summary", session.moderatorSummary);
    io.emit("debate_status", { status: "finished", round: session.maxRounds, maxRounds: session.maxRounds });
  }
}

// --- Routes ---

router.get("/parties", (_req: Request, res: Response) => {
  const parties = Object.values(PARTIES).map(p => ({
    id: p.id,
    name: p.name,
    abbreviation: p.abbreviation,
    color: p.color,
    emoji: p.emoji,
    ideology: p.ideology,
    coreIssues: p.coreIssues,
    rhetoricalStyle: p.rhetoricalStyle,
  }));
  res.json(parties);
});

router.get("/topics", (_req: Request, res: Response) => {
  res.json(DEBATE_TOPICS);
});

router.get("/session", (_req: Request, res: Response) => {
  if (!currentSession) {
    return res.json({ session: null });
  }
  res.json({
    session: {
      ...currentSession,
      agents: currentSession.agents.map(id => {
        const agent = activeAgents.get(id);
        return agent ? {
          id: agent.id,
          name: agent.name,
          abbreviation: agent.abbreviation,
          color: agent.color,
          emoji: agent.emoji,
          surprisal: agent.surprisal,
        } : null;
      }).filter(Boolean),
    },
  });
});

router.post("/start", (req: Request, res: Response) => {
  if (currentSession?.status === "running") {
    return res.status(409).json({ error: "En debatt pågår redan" });
  }

  const { topic, parties: partyIds, rounds } = req.body as {
    topic?: string;
    parties?: string[];
    rounds?: number;
  };

  const selectedTopic = topic || DEBATE_TOPICS[Math.floor(Math.random() * DEBATE_TOPICS.length)];
  const selectedParties = (partyIds && partyIds.length >= 2)
    ? partyIds.filter(id => PARTIES[id])
    : ["s", "sd", "m", "v"]; // Default: 4 largest parties

  const maxRounds = Math.min(rounds || 3, 6);

  // Create agents
  activeAgents = new Map();
  for (const id of selectedParties) {
    activeAgents.set(id, createAgent(id));
  }

  currentSession = {
    id: `debate_${Date.now()}`,
    topic: selectedTopic,
    agents: selectedParties,
    messages: [],
    round: 0,
    maxRounds,
    status: "idle",
    startedAt: null,
    moderatorSummary: null,
  };

  // Start debate async
  runDebate(currentSession).catch(err => {
    console.error("[debate] Error:", err);
    if (currentSession) currentSession.status = "finished";
  });

  res.json({
    status: "started",
    topic: selectedTopic,
    parties: selectedParties,
    rounds: maxRounds,
  });
});

router.post("/stop", (_req: Request, res: Response) => {
  if (debateAbortController) {
    debateAbortController.abort();
    debateAbortController = null;
  }
  if (currentSession) {
    currentSession.status = "finished";
  }
  ioInstance?.emit("debate_status", { status: "finished", round: currentSession?.round || 0, maxRounds: currentSession?.maxRounds || 0 });
  res.json({ status: "stopped" });
});

router.get("/messages", (_req: Request, res: Response) => {
  res.json(currentSession?.messages || []);
});

router.delete("/messages", (_req: Request, res: Response) => {
  if (currentSession) {
    currentSession.messages = [];
    currentSession.round = 0;
    currentSession.status = "idle";
    currentSession.moderatorSummary = null;
  }
  activeAgents.clear();
  res.json({ cleared: true });
});

export function initDebateSocket(io: SocketServer): void {
  ioInstance = io;
}

export default router;
