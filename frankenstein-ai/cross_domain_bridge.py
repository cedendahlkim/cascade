"""
Cross-Domain Bridge — Frankenstein ASI-komponent.

Tvingar Frankenstein att hämta "regler" från en domän (t.ex. krypto)
och mappa dem mot en annan (t.ex. linjär algebra) i ett separat
minnesutrymme INNAN koden skrivs.

Arkitektur:
┌──────────────┐     ┌──────────────────┐     ┌──────────────┐
│  Domän A     │ ──→ │  Bridge Memory   │ ←── │  Domän B     │
│  (regler)    │     │  (mappningar)    │     │  (regler)    │
└──────────────┘     └────────┬─────────┘     └──────────────┘
                              │
                     ┌────────▼─────────┐
                     │  Unified Strategy │
                     │  (prompt-tillägg) │
                     └──────────────────┘

Flöde:
1. DETECT: Identifiera vilka domäner uppgiften kräver
2. EXTRACT: Hämta relevanta regler från varje domän
3. MAP: Hitta kopplingar mellan domänerna (analogier, delade koncept)
4. BRIDGE: Skapa en enhetlig strategi som kombinerar domänkunskap
5. INJECT: Lägg till bridge-kontext i LLM-prompten
"""

from dataclasses import dataclass, field
from typing import Any


@dataclass
class DomainRule:
    """En regel från en specifik domän."""
    domain: str
    name: str
    description: str
    formula: str
    prerequisites: list[str] = field(default_factory=list)
    outputs: list[str] = field(default_factory=list)


@dataclass
class DomainMapping:
    """En mappning mellan koncept i två domäner."""
    source_domain: str
    target_domain: str
    source_concept: str
    target_concept: str
    mapping_type: str       # "analogy", "dependency", "transformation"
    description: str
    confidence: float = 0.8


@dataclass
class BridgeResult:
    """Resultat från cross-domain bridge-analys."""
    domains_detected: list[str]
    rules_extracted: list[DomainRule]
    mappings_found: list[DomainMapping]
    unified_strategy: str
    prompt_injection: str
    confidence: float


# ============================================================
# DOMAIN KNOWLEDGE BASE
# ============================================================

DOMAIN_KNOWLEDGE: dict[str, list[DomainRule]] = {
    "networking": [
        DomainRule("networking", "ip_parsing", "Parsa IP-adress till oktetter",
                   "octets = [int(p) for p in ip.split('.')]",
                   [], ["octets"]),
        DomainRule("networking", "cidr_mask", "Beräkna subnätmask från CIDR",
                   "mask = (0xFFFFFFFF << (32 - cidr)) & 0xFFFFFFFF",
                   ["cidr"], ["mask"]),
        DomainRule("networking", "network_addr", "Beräkna nätverksadress",
                   "network = ip_int & mask",
                   ["ip_int", "mask"], ["network"]),
        DomainRule("networking", "broadcast_addr", "Beräkna broadcast-adress",
                   "broadcast = network | (~mask & 0xFFFFFFFF)",
                   ["network", "mask"], ["broadcast"]),
        DomainRule("networking", "host_count", "Antal användbara hosts",
                   "hosts = max(2**(32-cidr) - 2, 0)",
                   ["cidr"], ["hosts"]),
        DomainRule("networking", "ip_to_int", "Konvertera IP till heltal",
                   "ip_int = sum(o << (8*(3-i)) for i, o in enumerate(octets))",
                   ["octets"], ["ip_int"]),
        DomainRule("networking", "int_to_ip", "Konvertera heltal till IP",
                   "ip_str = '.'.join(str((n >> (8*(3-i))) & 0xFF) for i in range(4))",
                   ["ip_int"], ["ip_str"]),
        DomainRule("networking", "port_classification", "Klassificera portar",
                   "sensitive = port in {22, 3306, 5432, 6379, 27017}",
                   ["port"], ["is_sensitive"]),
    ],
    "cryptography": [
        DomainRule("cryptography", "sha256", "SHA-256 hash",
                   "hashlib.sha256(data.encode()).hexdigest()",
                   ["data"], ["hash_hex"]),
        DomainRule("cryptography", "md5", "MD5 hash (svag)",
                   "hashlib.md5(data.encode()).hexdigest()",
                   ["data"], ["hash_hex"]),
        DomainRule("cryptography", "checksum", "Checksumma med modulo",
                   "checksum = sum(values) % modulus",
                   ["values", "modulus"], ["checksum"]),
        DomainRule("cryptography", "hex_truncate", "Trunkera hex-sträng",
                   "truncated = hex_str[:n_chars]",
                   ["hex_str", "n_chars"], ["truncated"]),
        DomainRule("cryptography", "weak_algo_check", "Identifiera svaga algoritmer",
                   "is_weak = algo in ('DES', '3DES', 'RC4', 'MD5')",
                   ["algo"], ["is_weak"]),
        DomainRule("cryptography", "key_strength", "Bedöm nyckelstyrka",
                   "is_short = (algo.startswith('RSA') and bits < 2048) or bits < 128",
                   ["algo", "bits"], ["is_short"]),
    ],
    "statistics": [
        DomainRule("statistics", "mean", "Beräkna medelvärde",
                   "mean = sum(values) / len(values)",
                   ["values"], ["mean"]),
        DomainRule("statistics", "variance", "Beräkna varians",
                   "var = sum((x-mean)**2 for x in values) / len(values)",
                   ["values", "mean"], ["variance"]),
        DomainRule("statistics", "linear_regression", "Linjär regression (OLS)",
                   "slope = SS_xy / SS_xx; intercept = y_mean - slope * x_mean",
                   ["x_vals", "y_vals"], ["slope", "intercept"]),
        DomainRule("statistics", "r_squared", "Determinationskoefficient",
                   "r2 = 1 - SS_res / SS_tot",
                   ["slope", "intercept", "x_vals", "y_vals"], ["r_squared"]),
        DomainRule("statistics", "prediction", "Prediktion med linjär modell",
                   "y_pred = slope * x_new + intercept",
                   ["slope", "intercept", "x_new"], ["y_pred"]),
    ],
    "mathematics": [
        DomainRule("mathematics", "bitwise_and", "Bitvis AND",
                   "result = a & b",
                   ["a", "b"], ["result"]),
        DomainRule("mathematics", "bitwise_or", "Bitvis OR",
                   "result = a | b",
                   ["a", "b"], ["result"]),
        DomainRule("mathematics", "bitwise_not", "Bitvis NOT (32-bit)",
                   "result = ~a & 0xFFFFFFFF",
                   ["a"], ["result"]),
        DomainRule("mathematics", "modular_arithmetic", "Modulär aritmetik",
                   "result = value % modulus",
                   ["value", "modulus"], ["result"]),
        DomainRule("mathematics", "integer_division", "Heltalsdivision",
                   "result = a // b",
                   ["a", "b"], ["result"]),
        DomainRule("mathematics", "floating_point", "Avrundning",
                   "result = round(value, decimals)",
                   ["value", "decimals"], ["result"]),
    ],
    "security": [
        DomainRule("security", "sql_injection_detect", "Detektera SQL injection",
                   "vulnerable = 'f\"' in code and ('SELECT' in code or 'INSERT' in code)",
                   ["code"], ["is_vulnerable"]),
        DomainRule("security", "xss_detect", "Detektera XSS",
                   "vulnerable = 'f\"<' in code or 'f\"<div>' in code",
                   ["code"], ["is_vulnerable"]),
        DomainRule("security", "cmd_injection_detect", "Detektera command injection",
                   "vulnerable = 'os.system(f' in code or 'subprocess.call(f' in code",
                   ["code"], ["is_vulnerable"]),
        DomainRule("security", "severity_classify", "Klassificera allvarlighetsgrad",
                   "severity = 'CRITICAL' if count >= 3 else 'HIGH' if count >= 2 else 'MEDIUM' if count >= 1 else 'LOW'",
                   ["count"], ["severity"]),
    ],
    "devops": [
        DomainRule("devops", "docker_latest_check", "Kontrollera :latest tag",
                   "is_latest = ':latest' in from_line or ':' not in from_line.split()[-1]",
                   ["from_line"], ["is_latest"]),
        DomainRule("devops", "firewall_conflict", "Hitta brandväggskonflikter",
                   "conflict = len(actions_per_port) > 1",
                   ["actions_per_port"], ["has_conflict"]),
        DomainRule("devops", "cicd_ordering", "Verifiera pipeline-ordning",
                   "valid = test_stage_index < deploy_stage_index",
                   ["stages"], ["is_valid_order"]),
    ],
    "data_processing": [
        DomainRule("data_processing", "csv_parse", "Parsa CSV-rad",
                   "fields = line.split(',')",
                   ["line"], ["fields"]),
        DomainRule("data_processing", "json_parse", "Parsa JSON",
                   "obj = json.loads(line)",
                   ["line"], ["obj"]),
        DomainRule("data_processing", "group_by", "Gruppera per nyckel",
                   "groups = {}; groups.setdefault(key, []).append(value)",
                   ["data", "key_fn"], ["groups"]),
        DomainRule("data_processing", "sort_by", "Sortera efter nyckel",
                   "sorted_data = sorted(data, key=key_fn, reverse=desc)",
                   ["data", "key_fn"], ["sorted_data"]),
        DomainRule("data_processing", "validate", "Validera data",
                   "valid = all(constraint(item) for item in data)",
                   ["data", "constraint"], ["is_valid"]),
    ],
}

# Cross-domain mappings — kopplingar mellan domäner
CROSS_DOMAIN_MAPPINGS: list[DomainMapping] = [
    # Networking ↔ Mathematics
    DomainMapping("networking", "mathematics", "cidr_mask", "bitwise_and",
                  "dependency", "Subnätmask kräver bitvis AND för nätverksadress"),
    DomainMapping("networking", "mathematics", "broadcast_addr", "bitwise_or",
                  "dependency", "Broadcast kräver bitvis OR med inverterad mask"),
    DomainMapping("networking", "mathematics", "host_count", "modular_arithmetic",
                  "transformation", "Antal hosts = 2^(32-CIDR) - 2"),

    # Networking ↔ Cryptography
    DomainMapping("networking", "cryptography", "network_addr", "sha256",
                  "dependency", "Nätverksadressen kan hashas för verifiering"),
    DomainMapping("networking", "cryptography", "ip_parsing", "checksum",
                  "transformation", "IP-oktetter kan summeras för checksumma"),

    # Statistics ↔ Mathematics
    DomainMapping("statistics", "mathematics", "linear_regression", "floating_point",
                  "dependency", "Regression kräver korrekt avrundning"),
    DomainMapping("statistics", "mathematics", "r_squared", "floating_point",
                  "dependency", "R² kräver precision i division"),

    # Security ↔ Cryptography
    DomainMapping("security", "cryptography", "severity_classify", "weak_algo_check",
                  "analogy", "Svag krypto → högre severity"),
    DomainMapping("security", "cryptography", "severity_classify", "key_strength",
                  "analogy", "Kort nyckel → högre severity"),

    # Data Processing ↔ Statistics
    DomainMapping("data_processing", "statistics", "group_by", "mean",
                  "dependency", "Gruppering → aggregering med medelvärde"),
    DomainMapping("data_processing", "mathematics", "validate", "modular_arithmetic",
                  "transformation", "Validering kan använda modulo-kontroller"),

    # DevOps ↔ Security
    DomainMapping("devops", "security", "docker_latest_check", "severity_classify",
                  "analogy", "Docker-problem → severity-klassificering"),
]


class CrossDomainBridge:
    """Cross-Domain Bridge — mappar regler mellan domäner."""

    def __init__(self):
        self.bridge_memory: list[dict] = []  # Separat minnesutrymme
        self.bridges_built: int = 0
        self.domains_bridged: dict[str, int] = {}
        self.successful_bridges: int = 0

    def detect_domains(self, title: str, description: str, tags: list[str]) -> list[str]:
        """Identifiera vilka domäner uppgiften kräver."""
        text = f"{title} {description} {' '.join(tags)}".lower()
        detected = []

        domain_signals: dict[str, list[str]] = {
            "networking": ["ip", "subnet", "cidr", "mask", "nätverks", "broadcast",
                          "host", "port", "firewall", "tcp", "udp", "ping"],
            "cryptography": ["sha", "hash", "md5", "krypto", "checksumma", "checksum",
                            "encrypt", "aes", "rsa", "des", "cipher", "iv", "ecb", "cbc"],
            "statistics": ["medelvärde", "mean", "regression", "slope", "intercept",
                          "r²", "r_squared", "varians", "standardavvikelse", "prediktion"],
            "mathematics": ["bitvis", "bitwise", "modulo", "mod", "avrund", "round",
                           "heltalsdivision", "potens", "exponential", "logaritm"],
            "security": ["sårbarhet", "vulnerability", "injection", "xss", "audit",
                        "säkerhet", "security", "cve", "penetration"],
            "devops": ["docker", "ci/cd", "pipeline", "deploy", "container",
                      "kubernetes", "firewall", "nginx", "config"],
            "data_processing": ["csv", "json", "parsa", "parse", "etl", "transform",
                               "aggregera", "aggregate", "validera", "validate", "konvertera"],
        }

        for domain, signals in domain_signals.items():
            score = sum(1 for s in signals if s in text)
            if score >= 2:
                detected.append(domain)
            elif score == 1 and domain in ["networking", "cryptography", "statistics"]:
                detected.append(domain)

        return detected if detected else []

    def analyze(self, title: str, description: str, tags: list[str]) -> BridgeResult | None:
        """Fullständig cross-domain analys.

        Returnerar None om uppgiften bara kräver en domän.
        """
        domains = self.detect_domains(title, description, tags)

        if len(domains) < 2:
            return None

        self.bridges_built += 1
        for d in domains:
            self.domains_bridged[d] = self.domains_bridged.get(d, 0) + 1

        # Steg 1: Extrahera relevanta regler från varje domän
        rules = []
        for domain in domains:
            domain_rules = DOMAIN_KNOWLEDGE.get(domain, [])
            relevant = self._filter_relevant_rules(domain_rules, description)
            rules.extend(relevant)

        # Steg 2: Hitta mappningar mellan detekterade domäner
        mappings = self._find_mappings(domains, description)

        # Steg 3: Bygg enhetlig strategi
        strategy = self._build_unified_strategy(domains, rules, mappings)

        # Steg 4: Generera prompt-injection
        prompt = self._generate_prompt_injection(domains, rules, mappings, strategy)

        # Steg 5: Lagra i bridge memory
        bridge_entry = {
            "domains": domains,
            "rules_count": len(rules),
            "mappings_count": len(mappings),
            "strategy": strategy,
        }
        self.bridge_memory.append(bridge_entry)
        if len(self.bridge_memory) > 100:
            self.bridge_memory = self.bridge_memory[-50:]

        confidence = min(0.95, 0.5 + 0.1 * len(rules) + 0.15 * len(mappings))

        return BridgeResult(
            domains_detected=domains,
            rules_extracted=rules,
            mappings_found=mappings,
            unified_strategy=strategy,
            prompt_injection=prompt,
            confidence=confidence,
        )

    def record_outcome(self, success: bool) -> None:
        """Registrera om bridge-analysen ledde till korrekt lösning."""
        if success:
            self.successful_bridges += 1

    def _filter_relevant_rules(self, rules: list[DomainRule], description: str) -> list[DomainRule]:
        """Filtrera regler som är relevanta för uppgiften."""
        desc_lower = description.lower()
        relevant = []
        for rule in rules:
            # Kolla om regelns nyckelord finns i beskrivningen
            rule_keywords = rule.name.replace("_", " ").split() + rule.description.lower().split()
            if any(kw in desc_lower for kw in rule_keywords if len(kw) > 2):
                relevant.append(rule)
        return relevant

    def _find_mappings(self, domains: list[str], description: str) -> list[DomainMapping]:
        """Hitta relevanta cross-domain mappningar."""
        relevant = []
        for mapping in CROSS_DOMAIN_MAPPINGS:
            if (mapping.source_domain in domains and mapping.target_domain in domains):
                relevant.append(mapping)
        return relevant

    def _build_unified_strategy(self, domains: list[str], rules: list[DomainRule],
                                 mappings: list[DomainMapping]) -> str:
        """Bygg en enhetlig lösningsstrategi som kombinerar domänerna."""
        # Topologisk ordning baserat på beroenden
        steps = []

        # Gruppera regler per domän
        domain_rules: dict[str, list[DomainRule]] = {}
        for rule in rules:
            domain_rules.setdefault(rule.domain, []).append(rule)

        # Ordna domäner: de som producerar outputs som andra behöver kommer först
        all_outputs = set()
        all_prerequisites = set()
        for rule in rules:
            all_outputs.update(rule.outputs)
            all_prerequisites.update(rule.prerequisites)

        # Domäner som producerar grunddata först
        producer_domains = []
        consumer_domains = []
        for domain in domains:
            d_rules = domain_rules.get(domain, [])
            d_outputs = set()
            d_prereqs = set()
            for r in d_rules:
                d_outputs.update(r.outputs)
                d_prereqs.update(r.prerequisites)
            if d_outputs & all_prerequisites:
                producer_domains.append(domain)
            else:
                consumer_domains.append(domain)

        ordered_domains = producer_domains + [d for d in consumer_domains if d not in producer_domains]

        step_num = 1
        for domain in ordered_domains:
            d_rules = domain_rules.get(domain, [])
            if d_rules:
                rule_names = [r.name for r in d_rules]
                steps.append(f"Steg {step_num}: [{domain.upper()}] Berakna {', '.join(rule_names)}")
                step_num += 1

        # Lägg till mappningssteg
        for mapping in mappings:
            if mapping.mapping_type == "dependency":
                steps.append(
                    f"Steg {step_num}: [BRIDGE] {mapping.source_concept} → {mapping.target_concept}: "
                    f"{mapping.description}"
                )
                step_num += 1

        steps.append(f"Steg {step_num}: [OUTPUT] Formatera och skriv ut resultat")

        return "\n".join(steps)

    def _generate_prompt_injection(self, domains: list[str], rules: list[DomainRule],
                                    mappings: list[DomainMapping], strategy: str) -> str:
        """Generera prompt-tillägg för LLM."""
        parts = [
            "CROSS-DOMAIN ANALYS — Denna uppgift kraver kunskap fran FLERA domaner.\n",
            f"Detekterade domaner: {', '.join(d.upper() for d in domains)}\n\n",
        ]

        # Regler per domän
        parts.append("TILLGANGLIGA REGLER:\n")
        current_domain = ""
        for rule in rules:
            if rule.domain != current_domain:
                current_domain = rule.domain
                parts.append(f"\n  [{current_domain.upper()}]\n")
            parts.append(f"  - {rule.name}: {rule.formula}\n")

        # Mappningar
        if mappings:
            parts.append("\nKOPPLINGAR MELLAN DOMANER:\n")
            for m in mappings:
                parts.append(
                    f"  {m.source_domain}.{m.source_concept} → "
                    f"{m.target_domain}.{m.target_concept}: {m.description}\n"
                )

        # Strategi
        parts.append(f"\nLOSNINGSORDNING:\n{strategy}\n\n")

        parts.append(
            "VIKTIGT: Folj losningsordningen EXAKT. Berakna varje steg separat.\n"
            "Anvand INTE genvägar — varje doman-berakning maste vara explicit.\n"
        )

        return "".join(parts)

    def get_stats(self) -> dict:
        return {
            "bridges_built": self.bridges_built,
            "successful_bridges": self.successful_bridges,
            "success_rate": self.successful_bridges / max(self.bridges_built, 1),
            "domains_bridged": dict(self.domains_bridged),
            "memory_size": len(self.bridge_memory),
        }
