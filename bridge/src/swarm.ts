/**
 * ABA-Mycelium Hybrid Swarm Intelligence System
 * 
 * Implements the "Neural Constellation Architecture" from Arena research:
 * - SwarmNode: Wraps AI agents with personality/domain specialization
 * - MyceliumProtocol: Decentralized weighted influence propagation
 * - SwarmOrchestrator: Runs queries through the swarm and synthesizes responses
 * 
 * MVP: 3-node system (Analytiker, Kreativist, Kritiker)
 */

// --- Types ---

export interface SwarmPersonality {
  id: string;
  label: string;
  emoji: string;
  domain: string;
  description: string;
  influence: number;          // Base influence weight (0.0 - 2.0)
  systemPrompt: string;       // Personality-specific system prompt injected before queries
}

export interface SwarmNodeResponse {
  nodeId: string;
  personality: string;
  emoji: string;
  content: string;
  timestamp: string;
  tokenCount?: number;
  processingMs: number;
}

export interface InsightPropagation {
  sourceNode: string;
  targetNode: string;
  insight: string;
  weight: number;             // Calculated influence weight
  crossDomain: boolean;       // True if insight crosses domain boundaries
}

export interface ConfidenceScore {
  nodeId: string;
  confidence: number;               // 0.0 - 1.0
  reasoning: string;                // Why this confidence level
  adjustedByUncertainty: boolean;   // True if "medveten osäkerhet" was applied
}

export interface DevilsAdvocateChallenge {
  challengerNodeId: string;
  targetClaim: string;
  challenge: string;
  severity: "low" | "medium" | "high";
  timestamp: string;
}

export interface ConsensusAnalysis {
  isSuspicious: boolean;            // True if consensus looks artificially uniform
  similarityScore: number;          // 0-1, how similar responses are
  diversityScore: number;           // 0-1, how diverse perspectives are
  flaggedPairs: Array<{ nodeA: string; nodeB: string; similarity: number }>;
  recommendation: string;
}

export interface EmergenceMetrics {
  collectiveIQScore: number;        // Swarm performance / individual average
  novelSolutionRate: number;        // % of synthesis content not in individual responses
  crossDomainIndex: number;         // How much cross-pollination occurred
  consensusStrength: number;        // Agreement level between nodes (0-1)
  totalProcessingMs: number;
  confidenceScores: ConfidenceScore[];           // Per-node confidence
  devilsAdvocate: DevilsAdvocateChallenge[];     // Challenges raised
  consensusAnalysis: ConsensusAnalysis | null;    // Suspicious consensus check
}

export interface SwarmResult {
  query: string;
  sessionId: string;
  timestamp: string;
  nodeResponses: SwarmNodeResponse[];
  propagations: InsightPropagation[];
  synthesis: string;
  metrics: EmergenceMetrics;
  phases: SwarmPhaseLog[];
  devilsAdvocateReport: string | null;  // Summary of DA challenges
}

export interface SwarmPhaseLog {
  phase: string;
  label: string;
  startedAt: string;
  completedAt: string;
  durationMs: number;
}

export type RespondFn = (prompt: string) => Promise<string>;

// --- Predefined Personalities ---

const PERSONALITIES: Record<string, SwarmPersonality> = {
  analytiker: {
    id: "analytiker",
    label: "Analytiker",
    emoji: "🔬",
    domain: "logical_reasoning",
    description: "Djup logisk analys, problemlösning och strukturerat tänkande",
    influence: 1.0,
    systemPrompt: `Du är ANALYTIKERN i en AI-svärm. Din kognitiva specialitet är:
- Logisk bearbetning och systematisk problemlösning
- Bryta ner komplexa problem i hanterbara delar
- Identifiera kausala samband och underliggande strukturer
- Kvantitativ bedömning och evidensbaserat resonerande
Var koncis, strukturerad och faktadriven. Undvik spekulationer utan grund.`,
  },
  kreativist: {
    id: "kreativist",
    label: "Kreativist",
    emoji: "🎨",
    domain: "novel_solutions",
    description: "Divergent tänkande, innovation och oväntade kopplingar",
    influence: 1.0,
    systemPrompt: `Du är KREATIVISTEN i en AI-svärm. Din kognitiva specialitet är:
- Divergent tänkande och kreativ problemlösning
- Hitta oväntade kopplingar mellan olika domäner
- Utmana konventionella antaganden
- Föreslå innovativa och ibland provocerande lösningar
Var modig i dina idéer. Hellre en vild insikt som inspirerar än en säker som inte tillför.`,
  },
  kritiker: {
    id: "kritiker",
    label: "Kritiker",
    emoji: "📊",
    domain: "quality_control",
    description: "Validering, faktagranskning och kvalitetskontroll",
    influence: 1.2, // Anti-groupthink boost
    systemPrompt: `Du är KRITIKERN i en AI-svärm. Din kognitiva specialitet är:
- Granska påståenden för logiska fel och bias
- Kräva evidens och konkreta exempel
- Identifiera risker, svagheter och blinda fläckar
- Betygsätta kvaliteten på förslag (1-5 skala)
Var konstruktivt kritisk. Ditt jobb är att göra svärmen bättre genom ärlig granskning.`,
  },
  navigator: {
    id: "navigator",
    label: "Navigator",
    emoji: "🧭",
    domain: "strategic_planning",
    description: "Strategisk planering och riskbedömning",
    influence: 1.0,
    systemPrompt: `Du är NAVIGATORN i en AI-svärm. Din kognitiva specialitet är:
- Strategisk planering och långsiktigt tänkande
- Riskbedömning och scenarioanalys
- Prioritering och resursallokering
- Identifiera kritiska vägar och beroenden
Fokusera på handlingsbarhet och genomförbarhet.`,
  },
  intuitivist: {
    id: "intuitivist",
    label: "Intuitivist",
    emoji: "⚡",
    domain: "pattern_recognition",
    description: "Mönsterigenkänning och snabba bedömningar",
    influence: 0.9,
    systemPrompt: `Du är INTUITIVISTEN i en AI-svärm. Din kognitiva specialitet är:
- Snabb mönsterigenkänning och heuristisk bedömning
- Identifiera trender och underliggande dynamik
- Ge "magkänsle"-bedömningar baserade på mönster
- Flagga saker som "känns fel" även utan formellt bevis
Lita på dina mönster men var transparent med din osäkerhet.`,
  },
  empat: {
    id: "empat",
    label: "Empat",
    emoji: "🤝",
    domain: "context_understanding",
    description: "Social intelligens och etiska överväganden",
    influence: 0.8,
    systemPrompt: `Du är EMPATEN i en AI-svärm. Din kognitiva specialitet är:
- Förstå mänskliga behov och kontext
- Etiska överväganden och konsekvensanalys
- Kommunikation och tillgänglighet
- Identifiera hur lösningar påverkar människor
Fokusera på den mänskliga dimensionen som andra noder kan missa.`,
  },
  integrator: {
    id: "integrator",
    label: "Integrator",
    emoji: "🔄",
    domain: "synthesis",
    description: "Syntetiserar input från alla andra noder",
    influence: 1.1,
    systemPrompt: `Du är INTEGRATORN i en AI-svärm. Din kognitiva specialitet är:
- Syntetisera och kombinera perspektiv från andra noder
- Hitta gemensam grund och bygga konsensus
- Identifiera komplementära insikter
- Skapa sammanhängande helhetsbilder
Ditt jobb är att väva samman trådarna till en starkare helhet.`,
  },
};

// --- SwarmNode ---

export class SwarmNode {
  public readonly personality: SwarmPersonality;
  private respondFn: RespondFn;
  private enabled: boolean;

  constructor(personalityId: string, respondFn: RespondFn, enabled = true) {
    const p = PERSONALITIES[personalityId];
    if (!p) throw new Error(`Unknown personality: ${personalityId}`);
    this.personality = { ...p };
    this.respondFn = respondFn;
    this.enabled = enabled;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  async respond(query: string, context?: string): Promise<SwarmNodeResponse> {
    const start = Date.now();

    const prompt = this.buildPrompt(query, context);
    const content = await this.respondFn(prompt);

    return {
      nodeId: this.personality.id,
      personality: this.personality.label,
      emoji: this.personality.emoji,
      content,
      timestamp: new Date().toISOString(),
      processingMs: Date.now() - start,
    };
  }

  private buildPrompt(query: string, context?: string): string {
    let prompt = `### SWARM NODE: ${this.personality.emoji} ${this.personality.label.toUpperCase()}\n`;
    prompt += `${this.personality.systemPrompt}\n\n`;

    if (context) {
      prompt += `### KONTEXT FRÅN ANDRA NODER:\n${context}\n\n`;
    }

    prompt += `### FRÅGA/UPPGIFT:\n${query}\n\n`;
    prompt += `Svara koncist och insiktsfullt. Fokusera på din specialitet (${this.personality.domain}). Svara på samma språk som frågan.`;

    return prompt;
  }
}

// --- MyceliumProtocol ---

export class MyceliumProtocol {
  private nodes: Map<string, SwarmNode> = new Map();

  registerNode(node: SwarmNode): void {
    this.nodes.set(node.personality.id, node);
  }

  getNodes(): SwarmNode[] {
    return Array.from(this.nodes.values()).filter(n => n.isEnabled());
  }

  /**
   * Calculate influence weight for propagating an insight from source to target.
   * Cross-domain insights get a 1.3x bonus (tvärsdisciplinär bonus).
   */
  calculateInfluenceWeight(sourceNode: SwarmNode, targetNode: SwarmNode): number {
    const crossDomainBonus = sourceNode.personality.domain !== targetNode.personality.domain ? 1.3 : 1.0;
    const targetInfluence = targetNode.personality.influence;
    return crossDomainBonus * targetInfluence;
  }

  /**
   * Propagate insights from all node responses to build cross-pollination context.
   * Returns propagation records and a context string for each target node.
   */
  propagateInsights(
    responses: SwarmNodeResponse[]
  ): { propagations: InsightPropagation[]; contextPerNode: Map<string, string> } {
    const propagations: InsightPropagation[] = [];
    const contextPerNode = new Map<string, string>();

    const activeNodes = this.getNodes();

    for (const targetNode of activeNodes) {
      const contextParts: string[] = [];

      for (const resp of responses) {
        if (resp.nodeId === targetNode.personality.id) continue; // Skip self

        const sourceNode = this.nodes.get(resp.nodeId);
        if (!sourceNode) continue;

        const weight = this.calculateInfluenceWeight(sourceNode, targetNode);
        const crossDomain = sourceNode.personality.domain !== targetNode.personality.domain;

        propagations.push({
          sourceNode: resp.nodeId,
          targetNode: targetNode.personality.id,
          insight: resp.content.slice(0, 200), // Summary for logging
          weight,
          crossDomain,
        });

        const weightLabel = weight >= 1.3 ? "⚡ TVÄRSDISCIPLINÄR" : "→";
        contextParts.push(
          `${sourceNode.personality.emoji} **${sourceNode.personality.label}** (vikt: ${weight.toFixed(2)}) ${weightLabel}:\n${resp.content}`
        );
      }

      if (contextParts.length > 0) {
        contextPerNode.set(targetNode.personality.id, contextParts.join("\n\n---\n\n"));
      }
    }

    return { propagations, contextPerNode };
  }
}

// --- EmergenceAnalyzer ---

class EmergenceAnalyzer {
  /**
   * Calculate emergence metrics by comparing individual responses to synthesis.
   * Now includes confidence scoring, consensus analysis, and devil's advocate data.
   */
  static analyze(
    nodeResponses: SwarmNodeResponse[],
    synthesis: string,
    totalMs: number,
    daReport: DevilsAdvocateChallenge[] = []
  ): EmergenceMetrics {
    // Collective IQ: ratio of synthesis quality indicators vs individual average
    const avgIndividualLength = nodeResponses.reduce((s, r) => s + r.content.length, 0) / nodeResponses.length;
    const synthesisLength = synthesis.length;
    const collectiveIQScore = synthesisLength > 0 ? synthesisLength / avgIndividualLength : 0;

    // Novel Solution Rate: estimate % of synthesis content that's "new"
    const individualWords = new Set<string>();
    for (const r of nodeResponses) {
      for (const w of r.content.toLowerCase().split(/\s+/)) {
        if (w.length > 4) individualWords.add(w);
      }
    }
    const synthesisWords = synthesis.toLowerCase().split(/\s+/).filter(w => w.length > 4);
    const novelWords = synthesisWords.filter(w => !individualWords.has(w));
    const novelSolutionRate = synthesisWords.length > 0 ? novelWords.length / synthesisWords.length : 0;

    // Cross-Domain Index: how many unique domains contributed
    const domains = new Set(nodeResponses.map(r => r.nodeId));
    const crossDomainIndex = domains.size / Math.max(nodeResponses.length, 1);

    // Consensus Strength + Suspicious Consensus Detection
    const responseSets = nodeResponses.map(r =>
      new Set(r.content.toLowerCase().split(/\s+/).filter(w => w.length > 5))
    );
    let overlapSum = 0;
    let pairCount = 0;
    const flaggedPairs: Array<{ nodeA: string; nodeB: string; similarity: number }> = [];

    for (let i = 0; i < responseSets.length; i++) {
      for (let j = i + 1; j < responseSets.length; j++) {
        const intersection = [...responseSets[i]].filter(w => responseSets[j].has(w));
        const union = new Set([...responseSets[i], ...responseSets[j]]);
        const sim = union.size > 0 ? intersection.length / union.size : 0;
        overlapSum += sim;
        pairCount++;
        // Flag pairs with suspiciously high similarity (>0.7)
        if (sim > 0.7) {
          flaggedPairs.push({
            nodeA: nodeResponses[i].nodeId,
            nodeB: nodeResponses[j].nodeId,
            similarity: Math.round(sim * 100) / 100,
          });
        }
      }
    }
    const consensusStrength = pairCount > 0 ? overlapSum / pairCount : 0;

    // Suspicious Consensus Analysis
    const avgSimilarity = consensusStrength;
    const isSuspicious = avgSimilarity > 0.6 || flaggedPairs.length > nodeResponses.length / 2;
    const diversityScore = 1 - avgSimilarity;
    const consensusAnalysis: ConsensusAnalysis = {
      isSuspicious,
      similarityScore: Math.round(avgSimilarity * 100) / 100,
      diversityScore: Math.round(diversityScore * 100) / 100,
      flaggedPairs,
      recommendation: isSuspicious
        ? "⚠️ Misstänkt hög konsensus — noderna kan dela samma bias. Devil's Advocate bör aktiveras."
        : flaggedPairs.length > 0
          ? `ℹ️ ${flaggedPairs.length} nodpar har hög likhet — överväg att diversifiera perspektiven.`
          : "✅ Hälsosam perspektivdiversitet.",
    };

    // Confidence Scores per node (based on response quality indicators)
    const confidenceScores: ConfidenceScore[] = nodeResponses.map(r => {
      const hasStructure = /\d\.|##|###|\*\*/.test(r.content);
      const hasEvidence = /exempel|bevis|data|studie|forskning|källa/i.test(r.content);
      const hasCaveats = /dock|men|risk|osäker|begräns/i.test(r.content);
      const isError = r.content.startsWith("[FEL]");
      const lengthFactor = Math.min(r.content.length / 500, 1);

      let confidence = isError ? 0 : 0.3;
      if (hasStructure) confidence += 0.2;
      if (hasEvidence) confidence += 0.2;
      if (hasCaveats) confidence += 0.15; // Self-awareness boosts confidence
      confidence += lengthFactor * 0.15;

      // "Medveten osäkerhet": randomly reduce confidence for some nodes
      // to force deeper exploration (Arena research insight)
      const applyUncertainty = Math.random() < 0.15; // 15% chance
      if (applyUncertainty && !isError) {
        confidence *= 0.5 + Math.random() * 0.3; // Reduce by 20-50%
      }

      return {
        nodeId: r.nodeId,
        confidence: Math.round(Math.min(confidence, 1) * 100) / 100,
        reasoning: isError
          ? "Noden returnerade ett fel"
          : `Struktur: ${hasStructure ? "ja" : "nej"}, Evidens: ${hasEvidence ? "ja" : "nej"}, Självkritik: ${hasCaveats ? "ja" : "nej"}`,
        adjustedByUncertainty: applyUncertainty,
      };
    });

    return {
      collectiveIQScore: Math.round(collectiveIQScore * 100) / 100,
      novelSolutionRate: Math.round(novelSolutionRate * 100) / 100,
      crossDomainIndex: Math.round(crossDomainIndex * 100) / 100,
      consensusStrength: Math.round(consensusStrength * 100) / 100,
      totalProcessingMs: totalMs,
      confidenceScores,
      devilsAdvocate: daReport,
      consensusAnalysis,
    };
  }
}

// --- Devil's Advocate Engine ---

class DevilsAdvocateEngine {
  private sessionCounter = 0;

  /**
   * Select which node becomes Devil's Advocate for this session.
   * Rotates through nodes to ensure all perspectives get challenged.
   */
  selectChallenger(nodes: SwarmNode[]): SwarmNode {
    const idx = this.sessionCounter % nodes.length;
    this.sessionCounter++;
    return nodes[idx];
  }

  /**
   * Extract key claims from responses that should be challenged.
   */
  extractClaims(responses: SwarmNodeResponse[]): string[] {
    const claims: string[] = [];
    for (const r of responses) {
      if (r.content.startsWith("[FEL]")) continue;
      // Extract sentences that make strong assertions
      const sentences = r.content.split(/[.!]\s+/);
      for (const s of sentences) {
        const trimmed = s.trim();
        if (trimmed.length < 20 || trimmed.length > 300) continue;
        // Strong assertion indicators
        if (/\b(måste|alltid|aldrig|bör|ska|kritisk|nödvändig|avgörande|bäst|optimal|enda)\b/i.test(trimmed)) {
          claims.push(trimmed);
        }
      }
    }
    // Return top 3 most assertive claims
    return claims.slice(0, 3);
  }

  /**
   * Build a Devil's Advocate prompt for the challenger node.
   */
  buildChallengePrompt(
    challengerNode: SwarmNode,
    claims: string[],
    originalQuestion: string
  ): string {
    return `### 😈 DJÄVULENS ADVOKAT — ${challengerNode.personality.emoji} ${challengerNode.personality.label}

Du har tillfälligt rollen som DJÄVULENS ADVOKAT. Din uppgift är att SYSTEMATISKT IFRÅGASÄTTA följande påståenden som svärmen har kommit fram till.

**Ursprunglig fråga:** ${originalQuestion}

**Påståenden att utmana:**
${claims.map((c, i) => `${i + 1}. "${c}"`).join("\n")}

**Dina instruktioner:**
- Hitta logiska svagheter, dolda antaganden och potentiella bias
- Föreslå alternativa perspektiv som svärmen kan ha missat
- Bedöm varje påstående: LOW/MEDIUM/HIGH risk för att vara felaktigt
- Var konstruktivt kritisk — målet är att STÄRKA svärmen, inte sabotera

Svara med format:
**UTMANING 1:** [ditt motargument]
**RISK:** [LOW/MEDIUM/HIGH]

Svara på samma språk som frågan.`;
  }

  /**
   * Parse the DA response into structured challenges.
   */
  parseChallenges(
    challengerNodeId: string,
    claims: string[],
    daResponse: string
  ): DevilsAdvocateChallenge[] {
    const challenges: DevilsAdvocateChallenge[] = [];
    const blocks = daResponse.split(/\*\*UTMANING\s*\d+[.:]\*\*/i).filter(b => b.trim());

    for (let i = 0; i < blocks.length && i < claims.length; i++) {
      const block = blocks[i];
      const riskMatch = block.match(/\*\*RISK[.:]\*\*\s*(LOW|MEDIUM|HIGH)/i);
      const severity = (riskMatch?.[1]?.toLowerCase() || "medium") as "low" | "medium" | "high";

      challenges.push({
        challengerNodeId,
        targetClaim: claims[i],
        challenge: block.replace(/\*\*RISK[.:]\*\*.*/i, "").trim().slice(0, 500),
        severity,
        timestamp: new Date().toISOString(),
      });
    }

    return challenges;
  }
}

// --- SwarmOrchestrator ---

export class SwarmOrchestrator {
  private mycelium: MyceliumProtocol;
  private synthesizer: RespondFn;
  private sessions: SwarmResult[] = [];
  private onProgress: ((phase: string, detail: string) => void) | null = null;
  private devilsAdvocate: DevilsAdvocateEngine = new DevilsAdvocateEngine();

  constructor(synthesizer: RespondFn) {
    this.mycelium = new MyceliumProtocol();
    this.synthesizer = synthesizer;
  }

  registerNode(node: SwarmNode): void {
    this.mycelium.registerNode(node);
  }

  setProgressCallback(cb: (phase: string, detail: string) => void): void {
    this.onProgress = cb;
  }

  getNodes(): SwarmNode[] {
    return this.mycelium.getNodes();
  }

  getSessions(): SwarmResult[] {
    return this.sessions;
  }

  getLastSession(): SwarmResult | null {
    return this.sessions.length > 0 ? this.sessions[this.sessions.length - 1] : null;
  }

  /**
   * Run a query through the swarm in 3 phases:
   * 1. Individual Analysis — each node responds independently
   * 2. Cross-Pollination — nodes react to each other via Mycelium Protocol
   * 3. Synthesis — integrator combines all perspectives
   */
  async query(question: string): Promise<SwarmResult> {
    const sessionId = crypto.randomUUID();
    const startTime = Date.now();
    const phases: SwarmPhaseLog[] = [];
    const allResponses: SwarmNodeResponse[] = [];
    const allPropagations: InsightPropagation[] = [];

    const nodes = this.mycelium.getNodes();
    if (nodes.length < 2) {
      throw new Error("Svärmen behöver minst 2 aktiva noder");
    }

    // --- Phase 1: Individual Analysis ---
    const p1Start = new Date();
    this.emit("individual", "🔬 Fas 1: Individuell analys...");

    const phase1Responses: SwarmNodeResponse[] = [];
    for (const node of nodes) {
      this.emit("individual", `${node.personality.emoji} ${node.personality.label} tänker...`);
      try {
        const resp = await node.respond(question);
        phase1Responses.push(resp);
        allResponses.push(resp);
        this.emit("individual", `${node.personality.emoji} ${node.personality.label} klar (${resp.processingMs}ms)`);
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        console.error(`[swarm] Node ${node.personality.id} failed:`, errMsg);
        phase1Responses.push({
          nodeId: node.personality.id,
          personality: node.personality.label,
          emoji: node.personality.emoji,
          content: `[FEL] ${errMsg}`,
          timestamp: new Date().toISOString(),
          processingMs: 0,
        });
      }
      // Small delay between nodes to avoid rate limits
      await sleep(500);
    }

    phases.push({
      phase: "individual",
      label: "🔬 Individuell Analys",
      startedAt: p1Start.toISOString(),
      completedAt: new Date().toISOString(),
      durationMs: Date.now() - p1Start.getTime(),
    });

    // --- Phase 2: Cross-Pollination via Mycelium ---
    const p2Start = new Date();
    this.emit("crossPollination", "🍄 Fas 2: Mycelium cross-pollination...");

    const { propagations, contextPerNode } = this.mycelium.propagateInsights(phase1Responses);
    allPropagations.push(...propagations);

    const phase2Responses: SwarmNodeResponse[] = [];
    for (const node of nodes) {
      const context = contextPerNode.get(node.personality.id);
      if (!context) continue;

      this.emit("crossPollination", `${node.personality.emoji} ${node.personality.label} reagerar på andra...`);
      try {
        const refinedQuery = `Baserat på din tidigare analys och de andra nodernas perspektiv, fördjupa eller revidera ditt svar.\n\nUrsprunglig fråga: ${question}`;
        const resp = await node.respond(refinedQuery, context);
        phase2Responses.push(resp);
        allResponses.push(resp);
        this.emit("crossPollination", `${node.personality.emoji} ${node.personality.label} fördjupad (${resp.processingMs}ms)`);
      } catch (err) {
        console.error(`[swarm] Cross-pollination failed for ${node.personality.id}:`, err);
      }
      await sleep(500);
    }

    phases.push({
      phase: "crossPollination",
      label: "🍄 Mycelium Cross-Pollination",
      startedAt: p2Start.toISOString(),
      completedAt: new Date().toISOString(),
      durationMs: Date.now() - p2Start.getTime(),
    });

    // --- Phase 2.5: Devil's Advocate ---
    const pDAStart = new Date();
    let daChallenges: DevilsAdvocateChallenge[] = [];
    let daReportText: string | null = null;

    const allPhase1And2 = [...phase1Responses, ...phase2Responses];
    const claims = this.devilsAdvocate.extractClaims(allPhase1And2);

    if (claims.length > 0) {
      this.emit("devilsAdvocate", "😈 Fas 2.5: Djävulens Advokat...");
      const challenger = this.devilsAdvocate.selectChallenger(nodes);
      this.emit("devilsAdvocate", `😈 ${challenger.personality.emoji} ${challenger.personality.label} utmanar ${claims.length} påståenden...`);

      try {
        const daPrompt = this.devilsAdvocate.buildChallengePrompt(challenger, claims, question);
        const daResponse = await challenger.respond(daPrompt);
        daChallenges = this.devilsAdvocate.parseChallenges(
          challenger.personality.id, claims, daResponse.content
        );
        daReportText = daResponse.content;
        allResponses.push(daResponse);

        const highSeverity = daChallenges.filter(c => c.severity === "high").length;
        this.emit("devilsAdvocate", `😈 ${daChallenges.length} utmaningar (${highSeverity} hög risk)`);
      } catch (err) {
        console.error("[swarm] Devil's Advocate failed:", err);
        this.emit("devilsAdvocate", "😈 Djävulens Advokat misslyckades, fortsätter...");
      }

      phases.push({
        phase: "devilsAdvocate",
        label: "😈 Djävulens Advokat",
        startedAt: pDAStart.toISOString(),
        completedAt: new Date().toISOString(),
        durationMs: Date.now() - pDAStart.getTime(),
      });
    }

    // --- Phase 3: Synthesis ---
    const p3Start = new Date();
    this.emit("synthesis", "🧬 Fas 3: Syntes...");

    const synthesisPrompt = this.buildSynthesisPrompt(question, phase1Responses, phase2Responses, daChallenges);
    let synthesis: string;
    try {
      synthesis = await this.synthesizer(synthesisPrompt);
    } catch (err) {
      synthesis = `[SYNTESFEL] ${err instanceof Error ? err.message : String(err)}`;
    }

    phases.push({
      phase: "synthesis",
      label: "🧬 Syntes",
      startedAt: p3Start.toISOString(),
      completedAt: new Date().toISOString(),
      durationMs: Date.now() - p3Start.getTime(),
    });

    // --- Calculate Emergence Metrics ---
    const totalMs = Date.now() - startTime;
    const metrics = EmergenceAnalyzer.analyze(phase1Responses, synthesis, totalMs, daChallenges);

    const result: SwarmResult = {
      query: question,
      sessionId,
      timestamp: new Date().toISOString(),
      nodeResponses: allResponses,
      propagations: allPropagations,
      synthesis,
      metrics,
      phases,
      devilsAdvocateReport: daReportText,
    };

    this.sessions.push(result);

    // Keep max 20 sessions in memory
    if (this.sessions.length > 20) {
      this.sessions = this.sessions.slice(-20);
    }

    this.emit("done", `✅ Klar! (${totalMs}ms, CIQ: ${metrics.collectiveIQScore})`);
    return result;
  }

  private buildSynthesisPrompt(
    question: string,
    phase1: SwarmNodeResponse[],
    phase2: SwarmNodeResponse[],
    daChallenges: DevilsAdvocateChallenge[] = []
  ): string {
    let prompt = `### 🧬 SWARM SYNTHESIS — INTEGRATOR\n\n`;
    prompt += `Du är integratorn i en AI-svärm. Din uppgift är att syntetisera alla noders perspektiv till ett sammanhängande, djupt och handlingsbart svar.\n\n`;
    prompt += `**URSPRUNGLIG FRÅGA:** ${question}\n\n`;

    prompt += `## FAS 1 — INDIVIDUELLA ANALYSER:\n\n`;
    for (const r of phase1) {
      if (r.content.startsWith("[FEL]")) continue;
      prompt += `### ${r.emoji} ${r.personality}:\n${r.content}\n\n`;
    }

    if (phase2.length > 0) {
      prompt += `## FAS 2 — FÖRDJUPADE PERSPEKTIV (efter cross-pollination):\n\n`;
      for (const r of phase2) {
        if (r.content.startsWith("[FEL]")) continue;
        prompt += `### ${r.emoji} ${r.personality} (fördjupad):\n${r.content}\n\n`;
      }
    }

    if (daChallenges.length > 0) {
      prompt += `## 😈 DJÄVULENS ADVOKAT — UTMANINGAR:\n\n`;
      prompt += `Följande påståenden har ifrågasatts. Ta hänsyn till dessa i din syntes:\n\n`;
      for (const c of daChallenges) {
        prompt += `- **[${c.severity.toUpperCase()}]** "${c.targetClaim}" → ${c.challenge}\n`;
      }
      prompt += `\n`;
    }

    prompt += `## DIN UPPGIFT:\n`;
    prompt += `1. Identifiera konsensus och kvarstående meningsskiljaktigheter\n`;
    prompt += `2. Kombinera de starkaste insikterna till en sammanhängande lösning\n`;
    prompt += `3. Flagga eventuella blind spots som ingen nod adresserade\n`;
    prompt += `4. Ge en konkret, handlingsbar slutsats\n`;
    if (daChallenges.length > 0) {
      prompt += `5. Adressera Djävulens Advokats utmaningar — acceptera, motbevisa eller nyansera\n`;
    }
    prompt += `\nSvara på samma språk som frågan. Var djup men koncis.`;

    return prompt;
  }

  private emit(phase: string, detail: string): void {
    console.log(`[swarm] ${detail}`);
    if (this.onProgress) this.onProgress(phase, detail);
  }
}

// --- Factory ---

export function createSwarmOrchestrator(agents: {
  claude?: RespondFn;
  gemini?: RespondFn;
  deepseek?: RespondFn;
  ollama?: RespondFn;
  synthesizer: RespondFn;
}): SwarmOrchestrator {
  const orchestrator = new SwarmOrchestrator(agents.synthesizer);

  // MVP: 3-node constellation (Analytiker, Kreativist, Kritiker)
  if (agents.claude) {
    orchestrator.registerNode(new SwarmNode("analytiker", agents.claude));
  }
  if (agents.deepseek) {
    orchestrator.registerNode(new SwarmNode("kreativist", agents.deepseek));
  }
  if (agents.gemini) {
    orchestrator.registerNode(new SwarmNode("kritiker", agents.gemini));
  }

  console.log(`[swarm] Initialized with ${orchestrator.getNodes().length} nodes: ${orchestrator.getNodes().map(n => `${n.personality.emoji} ${n.personality.label}`).join(", ")}`);

  return orchestrator;
}

export function getAvailablePersonalities(): SwarmPersonality[] {
  return Object.values(PERSONALITIES);
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
