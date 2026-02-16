"""
Del 1: Perception via Liquid Neural Networks (LNN)

Implementerar LiquidPerceptionUnit med:
- En liten CNN-encoder som extraherar särdrag från rådata
- CfC (Closed-form Continuous-time) neuroner från ncps
- AutoNCP-wiring inspirerad av C. elegans nervsystem

Nätverket är "flytande" — dess dynamik anpassas beroende på situationen.
Tidskonstanten τ varierar: snabb reaktion vid hög frekvens, långt minne vid stabil input.
"""

import torch
import torch.nn as nn
from ncps.torch import CfC
from ncps.wirings import AutoNCP


class CNNEncoder(nn.Module):
    """Enkel CNN som extraherar latenta särdrag från sensordata.
    
    Tar emot 1-kanals input (t.ex. gråskalebild eller 1D-signal)
    och producerar en kompakt feature-vektor.
    """

    def __init__(self, input_channels: int = 1, output_features: int = 32):
        super().__init__()
        self.conv = nn.Sequential(
            nn.Conv1d(input_channels, 16, kernel_size=3, padding=1),
            nn.ReLU(),
            nn.AdaptiveAvgPool1d(8),
            nn.Conv1d(16, 32, kernel_size=3, padding=1),
            nn.ReLU(),
            nn.AdaptiveAvgPool1d(4),
        )
        self.fc = nn.Linear(32 * 4, output_features)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        Args:
            x: (Batch, Channels, SeqLen) eller (Batch, SeqLen)
        Returns:
            features: (Batch, output_features)
        """
        if x.dim() == 2:
            x = x.unsqueeze(1)  # Lägg till kanal-dimension
        h = self.conv(x)
        h = h.view(h.size(0), -1)
        return self.fc(h)


class LiquidPerceptionUnit(nn.Module):
    """Komplett perceptionsmodul: CNN → CfC (Liquid Neural Network).
    
    CfC-neuroner modelleras som differentialekvationer med adaptiv tidskonstant.
    AutoNCP skapar en gles, strukturerad koppling (Sensory → Inter → Command → Motor)
    inspirerad av C. elegans nervsystem.
    
    Parametrar:
        input_features: Dimensionalitet av CNN-output (default 32)
        hidden_neurons: Antal LTC-neuroner (default 19, som i MIT-studien)
        output_features: Antal output-signaler (default 16, max = hidden_neurons-2)
    """

    def __init__(
        self,
        input_features: int = 32,
        hidden_neurons: int = 19,
        output_features: int = 16,
        input_channels: int = 1,
    ):
        super().__init__()
        self.encoder = CNNEncoder(input_channels, input_features)

        # AutoNCP skapar en 4-lagers struktur (Sensory → Inter → Command → Motor)
        # inspirerad av C. elegans nervsystem
        self.wiring = AutoNCP(hidden_neurons, output_features)

        # CfC ersätter behovet av en långsam ODE-lösare
        # batch_first=True är standard för modern ML-dataformatering
        self.lnn = CfC(input_features, self.wiring, batch_first=True)

    def forward(
        self, x: torch.Tensor, state: torch.Tensor | None = None
    ) -> tuple[torch.Tensor, torch.Tensor]:
        """
        Args:
            x: Sensordata (Batch, Time, SeqLen) eller (Batch, SeqLen) för single-step
            state: Internt dolt tillstånd för neuronerna (None = nollinitierat)
            
        Returns:
            output: (Batch, output_features) — tidsintegrerad representation
            new_state: Uppdaterat internt tillstånd
        """
        # Om single-step: lägg till tidsdimension
        single_step = x.dim() == 2
        if single_step:
            x = x.unsqueeze(1)  # (Batch, 1, SeqLen)

        batch_size, time_steps, seq_len = x.shape

        # Kör CNN-encoder för varje tidssteg
        features = []
        for t in range(time_steps):
            feat = self.encoder(x[:, t, :].unsqueeze(1))  # (Batch, input_features)
            features.append(feat)
        features = torch.stack(features, dim=1)  # (Batch, Time, input_features)

        # Kör CfC — det "flytande" nätverket
        output, new_state = self.lnn(features, state)

        if single_step:
            output = output.squeeze(1)  # (Batch, output_features)

        return output, new_state

    def get_initial_state(self, batch_size: int = 1) -> torch.Tensor | None:
        """Returnerar initialt tillstånd (None = CfC hanterar det internt)."""
        return None
