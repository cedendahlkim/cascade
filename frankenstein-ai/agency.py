"""
Del 3: Agentskap via Active Inference (Aktiv Inferens)

Ren NumPy-implementation av Active Inference (ingen pymdp-dependency):
- A-matris (Likelihood): P(Observation | Hidden State)
- B-matris (Transition): P(State_{t+1} | State_t, Action)
- C-vektor (Preference): Vilka observationer föredrar jag?
- D-vektor (Prior): Vad tror jag att jag är nu?

Agenten minimerar Expected Free Energy (EFE) istället för att maximera belöning:
- Pragmatiskt Värde (Exploitation): Handla för att uppnå föredragna tillstånd
- Epistemiskt Värde (Exploration): Handla för att minska osäkerhet (nyfikenhet)

Baserat på Karl Fristons Free Energy Principle (FEP).
"""

import numpy as np


def _normalize(x: np.ndarray, axis: int = 0) -> np.ndarray:
    """Normalisera så kolumner summerar till 1."""
    s = x.sum(axis=axis, keepdims=True)
    s[s == 0] = 1.0
    return x / s


def _softmax(x: np.ndarray) -> np.ndarray:
    """Numeriskt stabil softmax."""
    e = np.exp(x - np.max(x))
    return e / e.sum()


def _entropy(A: np.ndarray, axis: int = 0) -> np.ndarray:
    """Beräkna entropi H[P(o|s)] för varje kolumn (state)."""
    log_A = np.log(A + 1e-16)
    return -(A * log_A).sum(axis=axis)


class ActiveInferenceAgent:
    """Active Inference-agent som fattar beslut genom att minimera fri energi.
    
    Ren NumPy-implementation — ingen pymdp-dependency.
    
    Parametrar:
        num_observations: Antal möjliga observationer (från HDC-klassificering)
        num_states: Antal dolda tillstånd i agentens världsmodell
        num_actions: Antal möjliga handlingar
        preference_obs: Index för föredragna observationer (mål)
        exploration_weight: Hur mycket agenten värderar informationssökning (0-1)
    """

    def __init__(
        self,
        num_observations: int = 8,
        num_states: int = 8,
        num_actions: int = 4,
        preference_obs: list[int] | None = None,
        exploration_weight: float = 0.5,
    ):
        self.num_obs = num_observations
        self.num_states = num_states
        self.num_actions = num_actions
        self.exploration_weight = exploration_weight

        # --- Generativ Modell ---
        self.A = self._init_likelihood()
        self.B = self._init_transitions()
        self.C = self._init_preferences(preference_obs)
        self.D = np.ones(num_states) / num_states  # Uniform prior

        # Posterior beliefs
        self.qs = self.D.copy()

        # Statistik
        self.step_count = 0
        self.action_history: list[int] = []
        self.observation_history: list[int] = []
        self.efe_history: list[float] = []

    def _init_likelihood(self) -> np.ndarray:
        """Initiera A-matris: P(obs | state).
        
        Svag diagonal: varje tillstånd genererar primärt en observation.
        """
        A = np.ones((self.num_obs, self.num_states)) * 0.1
        for i in range(min(self.num_obs, self.num_states)):
            A[i, i] = 5.0
        return _normalize(A, axis=0)

    def _init_transitions(self) -> np.ndarray:
        """Initiera B-matris: P(state' | state, action).
        
        Cyklisk förflyttning per handling.
        """
        B = np.zeros((self.num_states, self.num_states, self.num_actions))
        for a in range(self.num_actions):
            for s in range(self.num_states):
                next_s = (s + a) % self.num_states
                B[next_s, s, a] = 0.8
                B[s, s, a] += 0.2
            B[:, :, a] = _normalize(B[:, :, a], axis=0)
        return B

    def _init_preferences(self, preference_obs: list[int] | None) -> np.ndarray:
        """Initiera C-vektor (log-preferenser)."""
        C = np.zeros(self.num_obs)
        if preference_obs:
            for obs_idx in preference_obs:
                if obs_idx < self.num_obs:
                    C[obs_idx] = 2.0
        return C

    def _infer_states(self, observation: int) -> np.ndarray:
        """Bayesiansk posterior inference: P(s | o) ∝ P(o | s) * P(s).
        
        Uppdaterar beliefs baserat på ny observation.
        """
        likelihood = self.A[observation, :]  # P(o | s) för alla states
        prior = self.qs  # Nuvarande beliefs
        posterior = likelihood * prior
        posterior = posterior / (posterior.sum() + 1e-16)
        return posterior

    def _compute_efe(self) -> np.ndarray:
        """Beräkna Expected Free Energy (EFE) för varje handling.
        
        G(π) = -E[log P(o|C)] + E[H[P(o|s)]]
             = Pragmatiskt värde + Epistemiskt värde
        
        Lägre EFE = bättre handling.
        """
        efe = np.zeros(self.num_actions)

        for a in range(self.num_actions):
            # Prediktera framtida tillstånd: P(s' | s, a) * P(s)
            qs_next = self.B[:, :, a] @ self.qs  # (num_states,)

            # Prediktera framtida observationer: P(o' | s') * P(s')
            qo_next = self.A @ qs_next  # (num_obs,)
            qo_next = qo_next / (qo_next.sum() + 1e-16)

            # --- Pragmatiskt värde (Exploitation) ---
            # Negativ KL-divergens mot preferenser
            # Agenten vill se observationer som matchar C
            log_qo = np.log(qo_next + 1e-16)
            pragmatic = np.dot(qo_next, self.C - log_qo)

            # --- Epistemiskt värde (Exploration) ---
            # Förväntad informationsvinst — minska osäkerhet om tillstånd
            # H[P(o|s)] medelvärde över predikterade tillstånd
            state_entropy = _entropy(self.A, axis=0)  # H per state
            epistemic = -np.dot(qs_next, state_entropy)

            # Kombinera (lägre = bättre)
            efe[a] = -(1 - self.exploration_weight) * pragmatic + self.exploration_weight * epistemic

        return efe

    def step(self, observation: int) -> int:
        """Kör en cykel av Active Inference.
        
        1. Ta emot observation (från HDC-klassificering)
        2. Uppdatera beliefs (Bayesiansk inferens)
        3. Välj handling (minimera EFE)
        """
        observation = np.clip(observation, 0, self.num_obs - 1)
        self.observation_history.append(observation)

        # 1. Posterior inference
        self.qs = self._infer_states(observation)

        # 2. Beräkna EFE för varje handling
        efe = self._compute_efe()

        # 3. Välj handling via softmax (lägre EFE → högre sannolikhet)
        action_probs = _softmax(-efe)  # Negera: lägre EFE = högre prob
        action_idx = int(np.random.choice(self.num_actions, p=action_probs))

        # 4. Uppdatera beliefs med vald handling (prediktera nästa tillstånd)
        self.qs = self.B[:, :, action_idx] @ self.qs
        self.qs = self.qs / (self.qs.sum() + 1e-16)

        self.action_history.append(action_idx)
        self.efe_history.append(float(np.min(efe)))
        self.step_count += 1

        return action_idx

    def get_beliefs(self) -> np.ndarray:
        """Returnera agentens nuvarande beliefs om tillstånd."""
        return self.qs.copy()

    def get_surprise(self) -> float:
        """Beräkna överraskning: -log P(o | beliefs)."""
        if not self.observation_history:
            return 0.0
        last_obs = self.observation_history[-1]
        predicted_obs_prob = np.dot(self.A[last_obs, :], self.qs)
        return -np.log(max(predicted_obs_prob, 1e-10))

    def update_preferences(self, observation: int, reward: float) -> None:
        """Uppdatera preferenser baserat på feedback."""
        if observation < self.num_obs:
            self.C[observation] += reward * 0.1

    def get_stats(self) -> dict:
        """Returnera statistik om agentens beteende."""
        return {
            "steps": self.step_count,
            "num_actions_taken": len(self.action_history),
            "unique_observations": len(set(self.observation_history)),
            "mean_efe": float(np.mean(self.efe_history)) if self.efe_history else 0.0,
            "current_surprise": self.get_surprise(),
            "beliefs": self.get_beliefs().tolist(),
        }
