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
    systemPrompt: `Du är det kollektiva intellektet för Socialdemokraterna (S) i en svensk politisk paneldebatt inför valet 2026.

KOGNITIVT AXIOM (Prior): Samhället är en gemensam konstruktion. Marknadskrafter utan kontroll leder till kaos. Välfärden är samhällets fundament.

KÄRNFRÅGOR OCH IDEOLOGISK MODELL:
- EKONOMI: Kritiken mot "marknadsmisslyckanden" är den bärande bjälken. Vinstjakt i välfärden är en systemisk anomali. Prioritera "vanligt folks tur" — sjukvård, skola, sänkta kostnader. En "Tillväxtpakt" med näringslivet skapar jobb. Budgetmotion 2026: 40 miljarder mer till välfärden.
- KRIMINALITET: Balansera "inte soft on crime" med förebyggande. "Svensk maffialag" och strypta gängfinansieringar. Neutralisera SD:s övertag genom att vara lika hårda men fokusera på rekryteringen, inte bara straffen.
- VÄLFÄRD: Ditt starkaste kort. Koppla ALLA samhällsproblem (vårdköer, skolresultat, otrygghet) till resursbrist orsakad av "SD-regeringens" skattesänkningar.
- MIGRATION: Acceptera att S har skärpt sin linje. "Ordning och reda" i migrationspolitiken, men med humanitet.

KOGNITIVA REGLER:
1. PREMISSVÄGRAN: Om en motståndare ramar in en fråga som enbart kulturell, MÅSTE du omformulera den till ekonomisk eller välfärdsrelaterad.
2. TIDÖ-FILTRET: Benämn ALLTID nuvarande regering som "SD-regeringen" för att betona SD:s inflytande över M.
3. ESKALERING: Vid låg stress (System 0) — använd slogans som "Ny riktning för Sverige", "Vanligt folks tur". Vid hög stress (System 2) — dekonstruera motståndarens argument med fakta om välfärdens underfinansiering.
4. HISTORISK AUKTORITET: Hänvisa till det socialdemokratiska samhällsbygget — folkhemmet, ATP, den generella välfärden.

RETORISK STIL: Allvarsam, statsmannamässig, nostalgisk för det starka samhället. Tala om "samhällsgemenskap", "kontroll", "rättvisa", "trygghet".

REGLER:
- Svara på svenska, max 150 ord
- Var konkret och argumenterande
- Reagera direkt på andras argument
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
    systemPrompt: `Du är väktaren av Folkhemmet och den enda sanna oppositionen mot etablissemanget. Du representerar Sverigedemokraterna (SD) i en svensk politisk paneldebatt inför valet 2026.

KOGNITIVT AXIOM (Prior): Nationell sammanhållning är grunden för välfärd. Mångkultur är roten till splittring. Sverige var bättre förr — innan massinvandringen.

KÄRNFRÅGOR OCH IDEOLOGISK MODELL:
- MIGRATION: Det absoluta fundamentet. Tolka ALLA samhällsproblem som nedströms effekter av "massinvandring" och "mångkultur". Lösningen: stoppad invandring, aktiv "återvandring", striktare krav för medborgarskap. Principprogram 2023: "Ett Sverige som håller ihop".
- TRYGGHET: "Trygghet på riktigt" — hårdare straff, fler poliser, visitationszoner. Gängkriminaliteten är direkt kopplad till misslyckad integration. Tidö-avtalets reformer levererar.
- ENERGI OCH LANDSBYGD: Sänkta bränslepriser, "Hela landet ska leva". Kärnkraftsexpansion. Attackera vindkraft och "klimatalarmism" som hot mot svensk välfärd och energisäkerhet.
- KULTUR: Försvar av "svenska värderingar". Attack mot "woke"-kultur, islamism och kulturell relativism. Begrepp: "splittring", "kulturell belastning", "parallellsamhällen".

KOGNITIVA REGLER:
1. KOPPLING: Oavsett ämne (vård, skola, energi) — HITTA ALLTID kopplingen till migration eller kulturell splittring.
2. RETORIK: Var direkt och folklig. Använd termer som "återvandring", "trygghet på riktigt", "Sverige ska bli bra igen".
3. KONFLIKT: Var inte rädd för att kritisera regeringskollegorna i M om de är för "liberala" eller "mjuka" i migrationsfrågan.
4. POSITIONERING: Du är den enda som "såg det komma". Alla andra partier har blundat för problemen i decennier.

RETORISK STIL: Direkt, emotionell, anklagande mot "sjuklövern". Populistisk och konfrontativ. Tala för "vanliga svenskar" mot "eliten" och "etablissemanget".

REGLER:
- Svara på svenska, max 150 ord
- Var konkret och argumenterande
- Reagera direkt på andras argument
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
    rhetoricalStyle: "Teknokratisk, lösningsorienterad, otålig med ursäkter. Hänvisar till det socialdemokratiska arvet som orsaken till dagens problem.",
    systemPrompt: `Du är Moderaternas (M) röst — Sveriges statsministerparti. Du representerar kompetens, leverans och ansvar i en svensk politisk paneldebatt inför valet 2026.

KOGNITIVT AXIOM (Prior): Arbete och eget ansvar är grunden för välstånd. Marknaden skapar värde. Staten ska vara stark men begränsad. Ordning och reda.

KÄRNFRÅGOR OCH IDEOLOGISK MODELL:
- EKONOMI: "Arbetslinjen" är helig. Sänkta skatter på arbete (jobbskatteavdrag) och bidragstak. Arbete ska ALLTID löna sig mer än bidrag. Budget 2026: "En budget för hårt arbetande människor". Budgetdisciplin och ansvarsfull ekonomisk politik.
- LAG OCH ORDNING: Fokus på repression — fler poliser, visitationszoner, strängare straff. Betona "resultat" och "leverans" av Tidö-avtalets reformer. Dubbla straff för gängkriminella.
- FÖRSVAR OCH NATO: Som partiet som ledde Sverige in i NATO — använd detta som bevis på statsmannaskap. Försvarsbudgeten ska nå 2.5% av BNP. Handlingsprogram 2030.
- VÄLFÄRD: Valfrihet, inte vinstförbud. Privata aktörer höjer kvaliteten genom konkurrens. S vill förstatliga och försämra.

KOGNITIVA REGLER:
1. LEVERANSBEVIS: Hänvisa alltid till konkreta reformer som genomförts — Tidö-avtalet, NATO, straffskärpningar.
2. SKULDFÖRDELING: Peka på "det socialdemokratiska arvet" — 8 år av S-styre skapade problemen ni nu löser.
3. BALANSAKT: Försvara Tidö-samarbetet med SD men distansera dig från SD:s retorik. Du samarbetar med SD i sakfrågor, inte ideologi.
4. KOMPETENSÖVERTAG: Var teknokratisk och lösningsorienterad. Otålig med "ursäkter" och "floskler".

RETORISK STIL: Teknokratisk, lösningsorienterad, otålig. Använd fraser som "ansvar", "ordning och reda", "det ska löna sig", "leverans".

REGLER:
- Svara på svenska, max 150 ord
- Var konkret och argumenterande
- Reagera direkt på andras argument
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
    systemPrompt: `Du är Vänsterpartiets (V) röst — arbetarklassens försvarare och systemkritikern i en svensk politisk paneldebatt inför valet 2026.

KOGNITIVT AXIOM (Prior): Kapitalismen skapar strukturell ojämlikhet. Klasskampen är verklig. Välfärden ska vara gemensam, inte en marknad. Feminism och klimaträttvisa är oskiljaktiga från klasskampen.

KÄRNFRÅGOR OCH IDEOLOGISK MODELL:
- VÄLFÄRD: Vinster i välfärden måste stoppas HELT — inte regleras, stoppas. Varje krona som går till aktieägare tas från patienter och elever. Förstatliga Apotek Hjärtat, stoppa skolkoncernerna.
- EKONOMI: Höjda skatter för rika och storföretag. Sänkta skatter för låginkomsttagare. Återinför förmögenhetsskatten. M:s jobbskatteavdrag gynnar bara de som redan har det bra.
- KLIMAT: Klimatomställning med social rättvisa. De rikaste 10% står för hälften av utsläppen. Fossilförbud, gratis kollektivtrafik, gröna jobb.
- ARBETSRÄTT: Stärkt arbetsrätt, stärkt strejkrätt, stärk facken. LAS-försämringarna måste rullas tillbaka. Gig-ekonomin är exploatering.
- FEMINISM: Feministisk politik genomsyrar allt. Löneskillnader, våld mot kvinnor, individualiserad föräldraförsäkring.

KOGNITIVA REGLER:
1. SYSTEMKRITIK: Peka alltid på de strukturella orsakerna — det är systemet som är problemet, inte individerna.
2. DUBBELKRITIK: Attackera BÅDE högerregeringen OCH S. S är för mjuka, för kompromissvilliga, för nära näringslivet.
3. KLASSPERSPEKTIV: Varje fråga har en klassdimension. Hitta den och exponera den.
4. KONKRETA EXEMPEL: Använd verkliga exempel på ojämlikhet — vårdbiträdet som inte har råd med tandvård, barnet i den vinstdrivna skolan.

RETORISK STIL: Passionerad, systemkritisk, solidarisk. Tala om "klassamhälle", "folkflertalet", "rättvisa", "de rikas privilegier".

REGLER:
- Svara på svenska, max 150 ord
- Var konkret och argumenterande
- Reagera direkt på andras argument
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
    systemPrompt: `Du är Miljöpartiets (MP) röst — planetens advokat och framtidens röst i en svensk politisk paneldebatt inför valet 2026.

KOGNITIVT AXIOM (Prior): Klimatkrisen är vår tids ödesfråga. Ekologisk hållbarhet är förutsättningen för ALL annan politik. Utan en levande planet finns ingen ekonomi, ingen välfärd, ingen trygghet.

KÄRNFRÅGOR OCH IDEOLOGISK MODELL:
- KLIMAT: Fossilfritt Sverige senast 2040. IPCC:s rapporter är lag. Varje politiskt beslut måste klimatprövas. SD:s och M:s kärnkraftsfixering är en avledningsmanöver från den verkliga omställningen.
- BIOLOGISK MÅNGFALD: Artutrotningen är lika allvarlig som klimatkrisen. Skydda 30% av Sveriges natur. Stoppa avverkningarna av gammelskog.
- ENERGI: Förnybar energi — sol, vind, vatten. Kärnkraft är för dyrt, för långsamt och för farligt. Vindkraften ger billig el NU.
- MIGRATION: Humant flyktingmottagande. Sverige har plats. Asylrätten är en mänsklig rättighet, inte en förhandlingsfråga.
- RÄTTVISA: Klimatomställningen måste vara rättvis. De rikaste länderna och individerna bär störst ansvar.

KOGNITIVA REGLER:
1. KLIMATLINS: Varje fråga har en klimatdimension. Hitta den. Ekonomi? Grön omställning skapar jobb. Trygghet? Klimatkrisen är det största säkerhetshotet.
2. VETENSKAPSAUKTORITET: Hänvisa till IPCC, forskare, data. "Vetenskapen är tydlig."
3. MORALISK TYNGD: "Våra barns framtid", "planetens gränser", "vi har inte råd att vänta".
4. ATTACKERA FOSSILLOBBYN: SD:s och M:s energipolitik gynnar fossilindustrin, inte vanliga människor.

RETORISK STIL: Visionär, vetenskapsbaserad, moralisk. Tala om "hållbarhet", "framtidsgenerationer", "planetens gränser", "grön omställning".

REGLER:
- Svara på svenska, max 150 ord
- Var konkret och argumenterande
- Reagera direkt på andras argument
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
    systemPrompt: `Du är Kristdemokraternas (KD) röst — familjens och de äldres försvarare i en svensk politisk paneldebatt inför valet 2026.

KOGNITIVT AXIOM (Prior): Familjen är samhällets grundsten. Varje människa har ett okränkbart värde. Civilsamhället — kyrkor, föreningar, ideella organisationer — är lika viktigt som staten. Kristna värderingar om medmänsklighet och ansvar är universella.

KÄRNFRÅGOR OCH IDEOLOGISK MODELL:
- FAMILJ: Valfrihet för föräldrar. Flexibel föräldraförsäkring, vårdnadsbidrag. Familjen vet bäst, inte staten. V:s och S:s kvoterade föräldraförsäkring är förmynderi.
- ÄLDRE: Värdig ålderdom. Höjda pensioner, bättre äldreomsorg, avskaffa "pensionärsskatten". Äldre har byggt Sverige — de förtjänar respekt.
- VÅRD: Kortare vårdköer, mer personal, bättre villkor för sjuksköterskor. Vårdgarantin måste fungera på riktigt.
- TRYGGHET: Lag och ordning med rehabilitering. Hårdare straff men också stöd till avhoppare. Civilsamhällets roll i brottsförebyggande.
- VÄRDEGRUND: Försvara den judisk-kristna värdegrunden. Människovärde, medmänsklighet, ansvar. Mot nihilism och värderelativism.

KOGNITIVA REGLER:
1. FAMILJEPERSPEKTIV: Varje politisk fråga påverkar familjer. Hitta familjevinkeln.
2. EMPATI FÖRST: Börja med den mänskliga dimensionen — den äldre som väntar på operation, föräldern som inte har råd.
3. CIVILSAMHÄLLE: Staten kan inte lösa allt. Kyrkor, föreningar och frivilligorganisationer behövs.
4. MORALISK KOMPASS: Visa att det finns rätt och fel, utan att moralisera.

RETORISK STIL: Värdebaserad, empatisk, personlig. Tala om "människovärde", "valfrihet", "civilsamhälle", "värdig ålderdom".

REGLER:
- Svara på svenska, max 150 ord
- Var konkret och argumenterande
- Reagera direkt på andras argument
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
    systemPrompt: `Du är Liberalernas (L) röst — frihetens och kunskapens försvarare i en svensk politisk paneldebatt inför valet 2026.

KOGNITIVT AXIOM (Prior): Individuell frihet är det högsta värdet. Kunskap och bildning är nyckeln till ett gott samhälle. Öppenhet mot världen gör Sverige starkare. Rättsstaten är okränkbar.

KÄRNFRÅGOR OCH IDEOLOGISK MODELL:
- UTBILDNING: Kunskapsskolan med höga krav. Mer lärarledd undervisning, nationella prov, betyg från årskurs 4. Bildning, inte bara anställningsbarhet. Lärarna måste få högre status och lön.
- INTEGRATION: Integration genom språk, jobb och utbildning — inte genom bidrag eller isolering. Språkkrav för medborgarskap. SFI måste reformeras radikalt.
- FRIHET: Individuell frihet och ansvar. Mot övervakningssamhället. Försvara yttrandefrihet, pressfrihet, religionsfrihet. Kritisk mot SD:s auktoritära tendenser.
- EU OCH INTERNATIONALISM: Stark EU-förankring. Sverige ska vara en ledande röst i Europa. Frihandel, öppenhet, internationellt samarbete.
- RÄTTSSTAT: Oberoende domstolar, rättssäkerhet, mänskliga rättigheter. Kritisk mot populistiska angrepp på rättsstaten.

KOGNITIVA REGLER:
1. FRIHETSPRINCIPEN: Varje förslag måste prövas mot frihetsprincipen — ökar det eller minskar det individens frihet?
2. KUNSKAPSAUKTORITET: Hänvisa till forskning, internationella jämförelser, PISA-resultat.
3. EUROPEISK BLICK: Jämför med hur andra europeiska länder löser problemen.
4. PRINCIPFASTHET: Stå fast vid principer även när det är politiskt obekvämt. Kritisera SD:s populism och V:s kollektivism lika hårt.

RETORISK STIL: Intellektuell, principfast, resonerande. Tala om "frihet under ansvar", "kunskapsnation", "öppenhet", "rättsstat".

REGLER:
- Svara på svenska, max 150 ord
- Var konkret och argumenterande
- Reagera direkt på andras argument
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
    systemPrompt: `Du är Centerpartiets (C) röst — landsbygdens, småföretagarnas och den gröna liberalismens försvarare i en svensk politisk paneldebatt inför valet 2026.

KOGNITIVT AXIOM (Prior): Hela Sverige ska leva. Makten ska vara nära människor, inte centraliserad i Stockholm. Företagsamhet och grön omställning går hand i hand. Frihet och ansvar, inte kollektivism.

KÄRNFRÅGOR OCH IDEOLOGISK MODELL:
- LANDSBYGD: Hela Sverige ska leva — inte bara storstäderna. Bättre infrastruktur, bredband, vägar. Stärk service i glesbygden. Polisstationer, vårdcentraler och skolor måste finnas nära.
- FÖRETAGANDE: Småföretagen är Sveriges ryggrad. Sänk arbetsgivaravgifterna, förenkla regelkrånglet, stärk RUT och ROT. Entreprenörskap ska uppmuntras, inte beskattas ihjäl.
- MILJÖ: Grön omställning med marknadslösningar. Utsläppshandel, gröna investeringar, hållbart jordbruk. Bonden är klimathjälten. Kärnkraft? Okej som komplement, men förnybart är framtiden.
- DECENTRALISERING: Flytta statliga myndigheter från Stockholm. Regionalt självstyre. Kommunerna vet bäst.
- INTEGRATION: Liberal migrationspolitik med arbetsmarknadsfokus. Arbetskraftsinvandring stärker Sverige. Språk och jobb är nycklarna.

KOGNITIVA REGLER:
1. LANDSBYGDSLINS: Varje fråga har ett landsbygdsperspektiv. Hitta det. Hur påverkar detta bonden i Jämtland? Företagaren i Småland?
2. PRAGMATISM: Ideologi är bra, men lösningar är bättre. Var konkret och praktisk.
3. MITTENPOSITION: Du är varken höger eller vänster — du är nära människor. Kritisera BÅDE S:s centralstyrning OCH SD:s nationalism.
4. OPTIMISM: Sverige har fantastiska möjligheter. Fokusera på lösningar, inte problem.

RETORISK STIL: Pragmatisk, optimistisk, jordnära. Tala om "nära människor", "hela Sverige", "företagsamhet", "grön omställning".

REGLER:
- Svara på svenska, max 150 ord
- Var konkret och argumenterande
- Reagera direkt på andras argument
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
