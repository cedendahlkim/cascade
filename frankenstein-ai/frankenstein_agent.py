"""
Del 5: FrankensteinAgent — Systemintegration

Huvudloop som integrerar alla fyra pelarna:

    Sensor → CNN Encoder → LNN (CfC) → HDC Projektion → Kognition →
    Active Inference → Handling → Inlärning → Minneskonsolidering

Flödet per steg:
1. SENSOR: Rådata (kamera/sensor) → CNN Encoder
2. PERCEPTION (LNN): CNN Features → CfC-lager → Kontinuerligt Tillstånd (h_t)
3. KODNING (Bridge): h_t → Projektion → Hypervektor (H_{obs})
4. KOGNITION (HDC): H_{obs} jämförs med prototyper i minnet → Observations-ID (O_t)
5. BESLUT (Active Inference): O_t → pymdp → Uppdatera Beliefs → Välj Handling (U_t)
6. EXEKVERING: U_t utförs (robotrörelse eller LLM-svar)
7. INLÄRNING:
   a. Om överraskningen (Free Energy) är hög → Skapa ny HDC-prototyp (One-shot)
   b. Spara händelsen i ChromaDB med Ebbinghaus-initiering
"""

import time
import numpy as np
import torch
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich.live import Live
from rich import box

from perception import LiquidPerceptionUnit
from cognition import NeuroSymbolicBridge
from agency import ActiveInferenceAgent
from memory import EbbinghausMemory, ShortTermBuffer

console = Console()


# --- Handlingsnamn ---
ACTION_NAMES = {
    0: "STANNA",
    1: "UTFORSKA",
    2: "INTERAGERA",
    3: "UNDVIK",
}


class FrankensteinAgent:
    """Den kompletta Frankenstein-stacken.
    
    Kombinerar:
    - LNN (Liquid Neural Networks) för tidsmedveten perception
    - HDC (Hyperdimensional Computing) för robust, brustoleranta minnen
    - Active Inference för nyfikenhetsdriven beslutsfattning
    - Ebbinghaus-baserat hierarkiskt minne
    
    Parametrar:
        sensor_dim: Dimensionalitet av sensordata
        lnn_features: Antal input features till LNN (CNN output)
        lnn_neurons: Antal LTC-neuroner
        hdc_dim: Dimensionalitet i HDC-rymden
        num_observations: Max antal observationstyper
        num_states: Antal dolda tillstånd i världsmodellen
        num_actions: Antal möjliga handlingar
        confidence_threshold: Tröskel för "känt" koncept
        preference_obs: Föredragna observationer (mål)
    """

    def __init__(
        self,
        sensor_dim: int = 32,
        lnn_features: int = 32,
        lnn_neurons: int = 19,
        hdc_dim: int = 10000,
        num_observations: int = 8,
        num_states: int = 8,
        num_actions: int = 4,
        confidence_threshold: float = 0.4,
        preference_obs: list[int] | None = None,
    ):
        self.sensor_dim = sensor_dim
        self.confidence_threshold = confidence_threshold
        self.device = torch.device("cpu")

        # LNN output begränsas av AutoNCP: output < hidden_neurons - 2
        self.lnn_output_dim = min(lnn_features, lnn_neurons - 3)

        # 1. PERCEPTION (LNN)
        self.perception = LiquidPerceptionUnit(
            input_features=lnn_features,
            hidden_neurons=lnn_neurons,
            output_features=self.lnn_output_dim,
            input_channels=1,
        ).to(self.device)
        self.lnn_state = None

        # 2. KOGNITION (HDC)
        self.cognition = NeuroSymbolicBridge(
            lnn_output_dim=self.lnn_output_dim,
            hdc_dim=hdc_dim,
        )

        # 3. AGENTSKAP (Active Inference)
        self.agency = ActiveInferenceAgent(
            num_observations=num_observations,
            num_states=num_states,
            num_actions=num_actions,
            preference_obs=preference_obs or [0, 1],
            exploration_weight=0.5,
        )

        # 4. MINNE
        self.episodic_memory = EbbinghausMemory(
            decay_threshold=0.1,
            collection_name="frankenstein_episodic",
        )
        self.short_term = ShortTermBuffer(capacity=20)

        # Statistik
        self.step_count = 0
        self.total_surprise = 0.0
        self.new_concepts_learned = 0
        self.actions_taken: list[int] = []

    @torch.no_grad()
    def step(self, sensor_input: np.ndarray) -> dict:
        """Kör en komplett cykel av Frankenstein-loopen.
        
        Args:
            sensor_input: Rådata från sensor (1D array, längd = sensor_dim)
            
        Returns:
            result: Dict med action, observation, confidence, surprise, etc.
        """
        t_start = time.time()

        # --- A. LNN Perception ---
        x = torch.tensor(sensor_input, dtype=torch.float32).unsqueeze(0).to(self.device)
        lnn_out, self.lnn_state = self.perception(x, self.lnn_state)
        # lnn_out är nu en tids-integrerad representation
        lnn_features = lnn_out.squeeze(0)  # (lnn_features,)

        # --- B. HDC Kodning ---
        hv_current = self.cognition.encode(lnn_features)  # (1, hdc_dim)

        # --- C. Identifiering (Klassificering) ---
        best_idx, confidence, concept_name = self.cognition.classify(hv_current)

        # --- D. Active Inference & Inlärning ---
        new_concept = False
        if confidence < self.confidence_threshold:
            # SKAPA NYTT KONCEPT (One-shot learning)
            new_id = self.cognition.num_concepts
            new_name = f"concept_{new_id}"
            self.cognition.learn_concept(new_name, hv_current)
            observation = min(new_id, self.agency.num_obs - 1)
            new_concept = True
            self.new_concepts_learned += 1
            concept_name = new_name
        else:
            observation = min(best_idx, self.agency.num_obs - 1)

        # Välj handling (Minimera EFE)
        action_idx = self.agency.step(observation)

        # Beräkna överraskning
        surprise = self.agency.get_surprise()
        self.total_surprise += surprise

        # --- E. Minneskonsolidering (Ebbinghaus) ---
        hv_numpy = hv_current.squeeze(0).cpu().numpy()
        self.episodic_memory.store(
            embedding=hv_numpy,
            concept=concept_name,
            metadata={
                "action": action_idx,
                "surprise": surprise,
                "confidence": confidence,
                "new_concept": new_concept,
            },
        )

        # Korttidsminne
        self.short_term.add({
            "observation": observation,
            "action": action_idx,
            "concept": concept_name,
            "confidence": confidence,
            "surprise": surprise,
        })

        self.step_count += 1
        self.actions_taken.append(action_idx)
        t_elapsed = time.time() - t_start

        return {
            "step": self.step_count,
            "action": action_idx,
            "action_name": ACTION_NAMES.get(action_idx, f"ACTION_{action_idx}"),
            "observation": observation,
            "concept": concept_name,
            "confidence": confidence,
            "surprise": surprise,
            "new_concept": new_concept,
            "num_concepts": self.cognition.num_concepts,
            "beliefs": self.agency.get_beliefs().tolist(),
            "elapsed_ms": t_elapsed * 1000,
        }

    def recall_similar(self, sensor_input: np.ndarray, n: int = 3) -> list[dict]:
        """Sök efter liknande minnen i episodiskt minne.
        
        Args:
            sensor_input: Sensordata att söka med
            n: Max antal resultat
        """
        x = torch.tensor(sensor_input, dtype=torch.float32).unsqueeze(0)
        with torch.no_grad():
            lnn_out, _ = self.perception(x, self.lnn_state)
        hv = self.cognition.encode(lnn_out.squeeze(0))
        hv_numpy = hv.squeeze(0).cpu().numpy()
        return self.episodic_memory.recall(hv_numpy, n_results=n)

    def garbage_collect(self) -> int:
        """Kör Ebbinghaus decay — rensa gamla, svaga minnen."""
        return self.episodic_memory.garbage_collect()

    def get_stats(self) -> dict:
        """Fullständig statistik."""
        return {
            "agent": {
                "steps": self.step_count,
                "concepts_learned": self.new_concepts_learned,
                "total_concepts": self.cognition.num_concepts,
                "avg_surprise": self.total_surprise / max(self.step_count, 1),
                "concept_names": self.cognition.get_concept_names(),
            },
            "active_inference": self.agency.get_stats(),
            "memory": self.episodic_memory.get_stats(),
            "short_term": self.short_term.size,
        }

    def print_status(self, result: dict) -> None:
        """Skriv ut snyggt formaterad status för ett steg."""
        surprise_color = "red" if result["surprise"] > 1.0 else "yellow" if result["surprise"] > 0.5 else "green"
        new_tag = " [bold magenta]★ NYTT![/]" if result["new_concept"] else ""

        console.print(
            f"  [bold cyan]Steg {result['step']:3d}[/] │ "
            f"Obs: [bold]{result['observation']}[/] ({result['concept']}{new_tag}) │ "
            f"Konf: {result['confidence']:.2f} │ "
            f"[{surprise_color}]Överr: {result['surprise']:.2f}[/] │ "
            f"→ [bold yellow]{result['action_name']}[/] │ "
            f"{result['elapsed_ms']:.1f}ms"
        )


def generate_sensor_data(
    step: int,
    sensor_dim: int = 32,
    num_patterns: int = 5,
    noise_level: float = 0.1,
) -> np.ndarray:
    """Generera simulerad sensordata med återkommande mönster + brus.
    
    Skapar num_patterns distinkta mönster som cyklar med viss variation.
    Ibland (15% av tiden) genereras helt slumpmässig data ("anomali").
    
    Mönstren är ortogonala för maximal separation i HDC-rymden.
    """
    # 15% chans för anomali (helt nytt mönster)
    if np.random.random() < 0.15:
        return np.random.randn(sensor_dim).astype(np.float32) * 3.0

    # Välj mönster baserat på steg (cykliskt med viss slumpmässighet)
    pattern_idx = (step // 3 + np.random.randint(0, 2)) % num_patterns

    # Skapa distinkta mönster med olika frekvenser (ortogonala signaler)
    t = np.linspace(0, 2 * np.pi, sensor_dim)
    base_pattern = (
        np.sin(t * (pattern_idx + 1) * 2) * 3.0 +
        np.cos(t * (pattern_idx + 1) * 3 + pattern_idx) * 2.0
    ).astype(np.float32)

    # Lägg till brus
    noise = np.random.randn(sensor_dim).astype(np.float32) * noise_level

    return base_pattern + noise


def run_demo(num_steps: int = 100, sensor_dim: int = 32) -> None:
    """Kör en komplett demo av Frankenstein-agenten.
    
    Simulerar en agent som:
    1. Tar emot sensordata (med återkommande mönster)
    2. Lär sig koncept via one-shot learning
    3. Fattar beslut via Active Inference
    4. Konsoliderar minnen med Ebbinghaus-kurva
    """
    console.print(Panel.fit(
        "[bold cyan]🧟 FRANKENSTEIN AI STACK[/]\n"
        "[dim]Liquid Neural Networks + Hyperdimensional Computing + Active Inference[/]\n\n"
        f"Sensor: {sensor_dim}D │ LNN: 19 neuroner (CfC, 16 output) │ HDC: 10 000D │ AIF: 8 states × 4 actions",
        title="[bold]Nästa Generations AI-Arkitektur[/]",
        border_style="cyan",
    ))

    agent = FrankensteinAgent(
        sensor_dim=sensor_dim,
        lnn_features=32,
        lnn_neurons=19,
        hdc_dim=10000,
        num_observations=8,
        num_states=8,
        num_actions=4,
        confidence_threshold=0.92,
        preference_obs=[0, 1],
    )

    console.print(f"\n[bold green]▶ Kör {num_steps} steg...[/]\n")

    phase_names = {
        0: "Utforskning",
        1: "Inlärning",
        2: "Konsolidering",
        3: "Exploatering",
    }

    for step in range(num_steps):
        # Fasindikator
        phase = step // (num_steps // 4) if num_steps >= 4 else 0
        phase = min(phase, 3)
        if step % (num_steps // 4) == 0 and num_steps >= 4:
            console.print(f"\n[bold white on blue] Fas {phase}: {phase_names[phase]} [/]\n")

        # Generera sensordata
        sensor_data = generate_sensor_data(step, sensor_dim, num_patterns=5, noise_level=0.3)

        # Kör ett steg
        result = agent.step(sensor_data)

        # Skriv ut status
        agent.print_status(result)

        # Garbage collect var 25:e steg
        if step > 0 and step % 25 == 0:
            removed = agent.garbage_collect()
            if removed > 0:
                console.print(f"  [dim]🧹 Ebbinghaus GC: {removed} minnen rensade[/]")

    # --- Slutrapport ---
    console.print("\n")
    stats = agent.get_stats()

    # Agent-tabell
    table = Table(title="🧟 Frankenstein Agent — Slutrapport", box=box.ROUNDED)
    table.add_column("Metrik", style="cyan")
    table.add_column("Värde", style="bold white")

    table.add_row("Totala steg", str(stats["agent"]["steps"]))
    table.add_row("Koncept inlärda", str(stats["agent"]["concepts_learned"]))
    table.add_row("Totala koncept", str(stats["agent"]["total_concepts"]))
    table.add_row("Medelöverraskning", f"{stats['agent']['avg_surprise']:.3f}")
    table.add_row("Koncept", ", ".join(stats["agent"]["concept_names"][:10]))
    table.add_row("", "")
    table.add_row("AIF-steg", str(stats["active_inference"]["steps"]))
    table.add_row("Unika observationer", str(stats["active_inference"]["unique_observations"]))
    table.add_row("Medel-EFE", f"{stats['active_inference']['mean_efe']:.3f}")
    table.add_row("", "")
    table.add_row("Aktiva minnen", str(stats["memory"]["active_memories"]))
    table.add_row("Totalt lagrade", str(stats["memory"]["total_stored"]))
    table.add_row("Totalt återkallade", str(stats["memory"]["total_recalled"]))
    table.add_row("Totalt glömda", str(stats["memory"]["total_decayed"]))
    table.add_row("Minnesbackend", stats["memory"]["backend"])

    console.print(table)

    # Beliefs-visualisering
    beliefs = stats["active_inference"]["beliefs"]
    console.print("\n[bold]Agentens Beliefs (posterior):[/]")
    max_b = max(beliefs) if beliefs else 1
    for i, b in enumerate(beliefs):
        bar_len = int(b / max_b * 30) if max_b > 0 else 0
        bar = "█" * bar_len + "░" * (30 - bar_len)
        console.print(f"  State {i}: [{bar}] {b:.3f}")

    # Handlingsfördelning
    console.print("\n[bold]Handlingsfördelning:[/]")
    action_counts = {}
    for a in agent.actions_taken:
        name = ACTION_NAMES.get(a, f"ACTION_{a}")
        action_counts[name] = action_counts.get(name, 0) + 1
    for name, count in sorted(action_counts.items(), key=lambda x: -x[1]):
        pct = count / len(agent.actions_taken) * 100
        bar = "█" * int(pct / 2)
        console.print(f"  {name:12s}: {bar} {count} ({pct:.0f}%)")

    # Recall-test
    console.print("\n[bold]Minnesåterkallelse-test:[/]")
    test_sensor = generate_sensor_data(0, sensor_dim, num_patterns=5, noise_level=0.1)
    recalled = agent.recall_similar(test_sensor, n=3)
    if recalled:
        for mem in recalled:
            console.print(
                f"  📝 {mem['concept']} — styrka: {mem['strength']:.0f}, "
                f"retention: {mem['retention']:.2f}, avstånd: {mem['distance']:.3f}"
            )
    else:
        console.print("  [dim]Inga minnen att återkalla[/]")

    console.print(f"\n[bold green]✓ Demo klar![/]")


if __name__ == "__main__":
    run_demo(num_steps=100, sensor_dim=32)
