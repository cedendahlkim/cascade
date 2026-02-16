"""
Del 2: Kognition via Hyperdimensional Computing (HDC)

Implementerar NeuroSymbolicBridge med:
- Random Projection: Mappar LNN-output (32 dims) → HDC-rymd (10 000 dims)
- Binarisering: Sign-funktion för effektiv lagring
- Associativt minne: Bundling (superposition) för one-shot learning
- Cosine Similarity: Klassificering via närmaste prototyp

HDC bygger på att i tillräckligt högdimensionella rum är slumpmässiga vektorer
nästan garanterat ortogonala — information kan lagras "holografiskt" över hela
vektorn, vilket gör systemet extremt tolerant mot brus.
"""

import torch
import torch.nn as nn
import torch.nn.functional as F


# --- Ren PyTorch HDC-operationer (ersätter torchhd) ---

def hdc_random_projection(input_dim: int, hdc_dim: int) -> torch.Tensor:
    """Skapa en slumpmässig projektionsmatris (Johnson-Lindenstrauss).
    
    Bevarar avstånd enligt JL-lemmat.
    """
    return torch.randn(input_dim, hdc_dim) / (hdc_dim ** 0.5)


def hdc_bundle(a: torch.Tensor, b: torch.Tensor) -> torch.Tensor:
    """Bundling (Superposition): Addera och normalisera.
    
    Resultatet liknar båda ingångarna — mekanismen för lärande.
    """
    result = a + b
    norm = result.norm()
    if norm > 0:
        result = result / norm * a.norm()
    return result


def hdc_bind(a: torch.Tensor, b: torch.Tensor) -> torch.Tensor:
    """Binding (Multiplikation/XOR): Associera variabel-värde par.
    
    Resultatet är olikt båda ingångarna (ortogonalt).
    """
    return a * b


def hdc_permute(a: torch.Tensor, shifts: int = 1) -> torch.Tensor:
    """Permutation (Skiftning): Koda ordning/sekvens.
    
    Cyklisk rotation — resultatet är ortogonalt mot originalet.
    """
    return torch.roll(a, shifts=shifts, dims=-1)


def hdc_cosine_similarity(a: torch.Tensor, b: torch.Tensor) -> torch.Tensor:
    """Cosine similarity mellan hypervektorer.
    
    Args:
        a: (1, D) eller (D,)
        b: (N, D) — matris med prototyper
    Returns:
        similarities: (1, N)
    """
    if a.dim() == 1:
        a = a.unsqueeze(0)
    if b.dim() == 1:
        b = b.unsqueeze(0)
    return F.cosine_similarity(a, b, dim=-1).unsqueeze(0) if a.shape[0] == 1 and b.shape[0] > 1 else F.cosine_similarity(a.expand_as(b), b, dim=-1).unsqueeze(0)


class NeuroSymbolicBridge(nn.Module):
    """Brygga mellan kontinuerlig LNN-output och diskret HDC-rymd.
    
    Mappar LNN-features till hypervektorer via Random Projection,
    och hanterar associativt minne för koncept-klassificering.
    
    Implementerar HDC-operationer med ren PyTorch (ingen torchhd-dependency).
    
    Parametrar:
        lnn_output_dim: Dimensionalitet från LNN (default 32)
        hdc_dim: Dimensionalitet i HDC-rymden (default 10000)
    """

    def __init__(self, lnn_output_dim: int = 32, hdc_dim: int = 10000):
        super().__init__()
        self.hdc_dim = hdc_dim
        self.lnn_output_dim = lnn_output_dim

        # Projektionslager: Mappar LNN (32 dims) → HDC (10 000 dims)
        # Slumpmässig, fixerad matris (kräver ingen träning)
        # Registrera som buffer så den sparas med modellen men inte tränas
        self.register_buffer(
            "projection_matrix",
            hdc_random_projection(lnn_output_dim, hdc_dim),
        )

        # Associativt minne: concept_name → prototyp-hypervektor
        self.concept_memory: dict[str, torch.Tensor] = {}
        # Antal samples per koncept (för splitting)
        self.concept_sample_count: dict[str, int] = {}

    def encode(self, lnn_features: torch.Tensor) -> torch.Tensor:
        """Projicera LNN-features till högdimensionell hypervektor.
        
        Args:
            lnn_features: (Batch, Features) eller (Features,)
            
        Returns:
            hv_binary: Binariserad hypervektor i {-1, +1}^D
        """
        if lnn_features.dim() == 1:
            lnn_features = lnn_features.unsqueeze(0)

        # 1. Projicera till högdimensionell rymd via matris-multiplikation
        hv = lnn_features @ self.projection_matrix

        # 2. L2-normalisera (ger bättre separation än binarisering)
        hv = F.normalize(hv, p=2, dim=-1)

        return hv

    def classify(self, hv: torch.Tensor) -> tuple[int, float, str]:
        """Hitta närmaste koncept i HDC-minnet via Cosine Similarity.
        
        Args:
            hv: Hypervektor att klassificera (1, D) eller (D,)
            
        Returns:
            best_idx: Index för bästa matchning
            confidence: Cosine similarity score (0-1)
            concept_name: Namn på matchat koncept
        """
        if len(self.concept_memory) == 0:
            return -1, 0.0, "unknown"

        if hv.dim() == 2:
            hv = hv.squeeze(0)

        names = list(self.concept_memory.keys())
        prototypes = torch.stack(list(self.concept_memory.values()))

        # Cosine similarity mot alla prototyper
        similarities = hdc_cosine_similarity(hv, prototypes)
        best_idx = torch.argmax(similarities).item()
        confidence = similarities.view(-1)[best_idx].item()

        return best_idx, confidence, names[best_idx]

    def learn_concept(self, concept_name: str, new_sample_hv: torch.Tensor) -> None:
        """One-shot learning: Lägg till eller uppdatera en prototyp.
        
        Om konceptet är nytt: spara direkt.
        Om det finns: Bundling (superposition) — addera och normalisera.
        
        Args:
            concept_name: Namn/etikett för konceptet
            new_sample_hv: Hypervektor för det nya exemplet
        """
        if new_sample_hv.dim() == 2:
            new_sample_hv = new_sample_hv.squeeze(0)

        if concept_name not in self.concept_memory:
            self.concept_memory[concept_name] = new_sample_hv.clone()
            self.concept_sample_count[concept_name] = 1
        else:
            # Bundling: Addera och normalisera
            self.concept_memory[concept_name] = hdc_bundle(
                self.concept_memory[concept_name], new_sample_hv
            )
            self.concept_sample_count[concept_name] = self.concept_sample_count.get(concept_name, 1) + 1

    def get_observation_id(self, hv: torch.Tensor, confidence_threshold: float = 0.5) -> int:
        """Returnera observations-ID för Active Inference.
        
        Om confidence < threshold → nytt koncept (hög överraskning).
        
        Args:
            hv: Hypervektor att klassificera
            confidence_threshold: Tröskel för "känt" koncept
            
        Returns:
            observation_id: Diskret observations-ID för pymdp
        """
        best_idx, confidence, name = self.classify(hv)

        if confidence < confidence_threshold:
            # Okänt koncept — skapa nytt
            new_id = len(self.concept_memory)
            new_name = f"concept_{new_id}"
            self.learn_concept(new_name, hv)
            return new_id
        else:
            return best_idx

    @property
    def num_concepts(self) -> int:
        """Antal lagrade koncept."""
        return len(self.concept_memory)

    def get_concept_names(self) -> list[str]:
        """Lista alla konceptnamn."""
        return list(self.concept_memory.keys())

    def get_dynamic_threshold(self) -> float:
        """Dynamisk tröskel: ju fler koncept, desto strängare match krävs.
        
        Med få koncept (0-10): 0.30 (mycket låg → tvingar skapande av nya koncept)
        Med medel (10-30): 0.30→0.60 (gradvis strängare)
        Med många (30+): 0.65 (kräver stark match → finare granularitet)
        """
        n = len(self.concept_memory)
        if n <= 10:
            return 0.30
        elif n <= 30:
            return 0.30 + (n - 10) * 0.015  # 0.30 → 0.60
        else:
            return min(0.65, 0.60 + (n - 30) * 0.002)

    def maybe_split_concepts(self, max_samples: int = 80) -> int:
        """Splitta koncept som blivit för breda (för många samples bundlade).
        
        Ett koncept med >max_samples har absorberats av för många olika uppgifter
        och har blivit en "genomsnittsvektor" som matchar allt dåligt.
        Lösning: ta bort det breda konceptet så att nya, smalare koncept
        kan skapas naturligt vid nästa classify.
        
        Returns: antal koncept som togs bort
        """
        to_remove = [
            name for name, count in self.concept_sample_count.items()
            if count > max_samples
        ]
        for name in to_remove:
            del self.concept_memory[name]
            del self.concept_sample_count[name]
        return len(to_remove)
