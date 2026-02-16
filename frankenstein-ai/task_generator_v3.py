"""
Frankenstein 3.0 — Superhuman Task Generators.

Tasks beyond human capability — complex chains, security analysis,
DevOps debugging, massive scale analysis, cross-domain problems,
adversarial challenges, and real-world automation.

Categories:
- chain_reasoning: Multi-step problem chains where each step depends on previous
- security_audit: Find vulnerabilities in code (SQLi, XSS, crypto weaknesses)
- devops_debug: Debug infrastructure configs, CI/CD, networking
- massive_scale: Analyze large codebases, optimize complex algorithms
- cross_domain: Problems requiring knowledge from 3+ domains simultaneously
- adversarial: Subtly broken code, edge case traps, time pressure
- real_world_auto: Complex automation scripts, data pipelines, API integration
"""

import random
import json
import hashlib
import math
from dataclasses import dataclass
from programming_env import Task, TestCase


# ============================================================
# 1. CHAIN REASONING — Multi-step dependent problem chains
# ============================================================

def _chain_log_analysis() -> Task:
    """Parse logs -> find anomalies -> generate fix -> verify."""
    n_entries = random.randint(15, 25)
    entries = []
    anomalies = []
    for i in range(n_entries):
        ts = f"2025-01-{10 + i // 10:02d}T{8 + i % 12:02d}:{random.randint(0,59):02d}:00"
        level = random.choices(["INFO", "WARN", "ERROR", "CRITICAL"], weights=[60, 20, 15, 5])[0]
        msgs = {
            "INFO": ["Request processed", "Cache hit", "User login"],
            "WARN": ["High memory usage", "Slow query detected", "Rate limit approaching"],
            "ERROR": ["Connection timeout", "Database error", "Auth failed"],
            "CRITICAL": ["Out of memory", "Disk full", "Service crash"],
        }
        msg = random.choice(msgs[level])
        latency = random.randint(10, 200) if level == "INFO" else random.randint(200, 5000)
        entries.append((ts, level, msg, latency))
        if level in ("ERROR", "CRITICAL") or latency > 1000:
            anomalies.append(i)

    input_lines = [str(n_entries)]
    for ts, level, msg, lat in entries:
        input_lines.append(f"{ts} {level} {msg} latency={lat}ms")

    # Expected: count anomalies, highest latency index, most common error
    error_msgs = [entries[i][2] for i in anomalies if entries[i][1] in ("ERROR", "CRITICAL")]
    from collections import Counter
    most_common_error = Counter(error_msgs).most_common(1)[0][0] if error_msgs else "none"
    max_lat_idx = max(range(n_entries), key=lambda i: entries[i][3])
    max_lat = entries[max_lat_idx][3]
    crit_count = sum(1 for _, l, _, _ in entries if l == "CRITICAL")

    expected_lines = [
        str(len(anomalies)),
        f"{max_lat_idx} {max_lat}",
        most_common_error,
        str(crit_count),
    ]

    desc = (
        f"Analysera en serverlogg med {n_entries} rader.\n"
        f"Varje rad: 'timestamp LEVEL meddelande latency=Xms'\n\n"
        f"Steg 1: Räkna anomalier (ERROR/CRITICAL eller latency > 1000ms)\n"
        f"Steg 2: Hitta raden med högst latency (0-indexerad rad och latency)\n"
        f"Steg 3: Hitta det vanligaste felmeddelandet bland ERROR/CRITICAL\n"
        f"Steg 4: Räkna antal CRITICAL-händelser\n\n"
        f"Output: 4 rader — anomali-antal, 'index latency', vanligaste felet, critical-antal"
    )

    return Task(
        id=f"chain-loganalysis-{random.randint(1000,9999)}",
        title="Kedja: Logganalys → Anomali → Diagnos",
        description=desc,
        difficulty=11,
        category="chain_reasoning",
        test_cases=[TestCase("\n".join(input_lines) + "\n", "\n".join(expected_lines), "Log chain")],
        hints=["Parsa varje rad, filtrera anomalier, aggregera statistik"],
        tags=["chain_reasoning", "log_analysis", "multi_step"],
    )


def _chain_data_pipeline() -> Task:
    """ETL pipeline: parse CSV -> validate -> transform -> aggregate -> output."""
    headers = ["name", "age", "salary", "department"]
    depts = ["Engineering", "Sales", "Marketing", "HR"]
    n = random.randint(10, 20)
    rows = []
    for _ in range(n):
        name = random.choice(["Alice", "Bob", "Charlie", "Diana", "Eve", "Frank", "Grace", "Hank", "Ivy", "Jack"])
        age = random.randint(20, 65)
        salary = random.randint(30000, 150000)
        dept = random.choice(depts)
        rows.append((name, age, salary, dept))

    # Add some invalid rows
    n_invalid = random.randint(1, 3)
    invalid_indices = set()
    for _ in range(n_invalid):
        idx = random.randint(0, n - 1)
        invalid_indices.add(idx)
        r = list(rows[idx])
        corruption = random.choice(["age", "salary"])
        if corruption == "age":
            r[1] = -5  # invalid age
        else:
            r[2] = -1000  # invalid salary
        rows[idx] = tuple(r)

    valid_rows = [r for i, r in enumerate(rows) if i not in invalid_indices]

    # Aggregate: avg salary per department
    dept_salaries: dict[str, list[int]] = {}
    for name, age, salary, dept in valid_rows:
        dept_salaries.setdefault(dept, []).append(salary)

    dept_avgs = {d: sum(s) // len(s) for d, s in dept_salaries.items()}
    sorted_depts = sorted(dept_avgs.items(), key=lambda x: -x[1])

    input_lines = [str(n)]
    for name, age, salary, dept in rows:
        input_lines.append(f"{name},{age},{salary},{dept}")

    expected_lines = [
        str(len(valid_rows)),
        str(len(invalid_indices)),
    ]
    for dept, avg in sorted_depts:
        expected_lines.append(f"{dept} {avg}")

    desc = (
        f"ETL Data Pipeline:\n"
        f"Läs {n} CSV-rader: 'namn,ålder,lön,avdelning'\n\n"
        f"Steg 1: Validera — ta bort rader med negativ ålder eller negativ lön\n"
        f"Steg 2: Aggregera — beräkna snittlön per avdelning (heltalsdivision)\n"
        f"Steg 3: Sortera avdelningar efter snittlön (högst först)\n\n"
        f"Output:\n"
        f"- Rad 1: antal giltiga rader\n"
        f"- Rad 2: antal ogiltiga rader\n"
        f"- Sedan en rad per avdelning: 'avdelning snittlön'"
    )

    return Task(
        id=f"chain-etl-{random.randint(1000,9999)}",
        title="Kedja: ETL Pipeline (Parse→Validera→Aggregera)",
        description=desc,
        difficulty=11,
        category="chain_reasoning",
        test_cases=[TestCase("\n".join(input_lines) + "\n", "\n".join(expected_lines), "ETL pipeline")],
        hints=["Parsa CSV, filtrera ogiltiga, gruppera med dict, sortera"],
        tags=["chain_reasoning", "etl", "data_pipeline"],
    )


def _chain_compiler_pipeline() -> Task:
    """Tokenize -> parse -> evaluate expression chain."""
    # Generate a random arithmetic expression
    ops = ['+', '-', '*']
    n_terms = random.randint(4, 7)
    tokens = []
    val = random.randint(1, 20)
    tokens.append(str(val))
    result = val
    for _ in range(n_terms - 1):
        op = random.choice(ops)
        v = random.randint(1, 15)
        tokens.append(op)
        tokens.append(str(v))

    expr = " ".join(tokens)

    # Evaluate with proper precedence (* before +/-)
    # Use Python eval for correctness
    result = eval(expr)

    # Also count tokens
    token_count = len(tokens)
    num_count = sum(1 for t in tokens if t.isdigit())
    op_count = token_count - num_count

    input_lines = [expr]
    expected_lines = [
        str(token_count),
        f"{num_count} {op_count}",
        str(result),
    ]

    desc = (
        f"Mini-kompilator pipeline:\n"
        f"Läs ett aritmetiskt uttryck (heltal och +, -, *).\n\n"
        f"Steg 1: Tokenisera — räkna totalt antal tokens\n"
        f"Steg 2: Klassificera — räkna antal tal och antal operatorer\n"
        f"Steg 3: Evaluera uttrycket med korrekt operatorprecedens (* före +/-)\n\n"
        f"Output: 3 rader — token-antal, 'tal-antal op-antal', resultat"
    )

    return Task(
        id=f"chain-compiler-{random.randint(1000,9999)}",
        title="Kedja: Tokenize→Parse→Evaluate",
        description=desc,
        difficulty=12,
        category="chain_reasoning",
        test_cases=[TestCase("\n".join(input_lines) + "\n", "\n".join(expected_lines), "Compiler chain")],
        hints=["Split på mellanslag för tokens, eval() eller manuell precedens-parser"],
        tags=["chain_reasoning", "compiler", "expression_eval"],
    )


def _gen_chain_reasoning() -> Task:
    return random.choice([_chain_log_analysis, _chain_data_pipeline, _chain_compiler_pipeline])()


# ============================================================
# 2. SECURITY AUDIT — Find vulnerabilities in code
# ============================================================

def _security_sql_injection() -> Task:
    """Identify SQL injection vulnerabilities in code snippets."""
    snippets = [
        {
            "code": 'query = f"SELECT * FROM users WHERE name = \'{user_input}\'"',
            "vuln": "SQL_INJECTION",
            "line": 1,
            "fix": "parameterized",
        },
        {
            "code": 'cursor.execute("SELECT * FROM orders WHERE id = " + order_id)',
            "vuln": "SQL_INJECTION",
            "line": 1,
            "fix": "parameterized",
        },
        {
            "code": 'cursor.execute("SELECT * FROM products WHERE id = ?", (product_id,))',
            "vuln": "SAFE",
            "line": 1,
            "fix": "none",
        },
        {
            "code": 'html = f"<div>{user_comment}</div>"',
            "vuln": "XSS",
            "line": 1,
            "fix": "escape",
        },
        {
            "code": 'os.system(f"ping {hostname}")',
            "vuln": "COMMAND_INJECTION",
            "line": 1,
            "fix": "subprocess_list",
        },
        {
            "code": 'subprocess.run(["ping", hostname])',
            "vuln": "SAFE",
            "line": 1,
            "fix": "none",
        },
        {
            "code": 'password_hash = hashlib.md5(password.encode()).hexdigest()',
            "vuln": "WEAK_CRYPTO",
            "line": 1,
            "fix": "bcrypt",
        },
        {
            "code": 'token = str(random.randint(100000, 999999))',
            "vuln": "WEAK_RANDOM",
            "line": 1,
            "fix": "secrets",
        },
    ]

    selected = random.sample(snippets, random.randint(5, 7))
    input_lines = [str(len(selected))]
    for s in selected:
        input_lines.append(s["code"])

    expected_lines = []
    for s in selected:
        expected_lines.append(f"{s['vuln']} {s['fix']}")

    vuln_count = sum(1 for s in selected if s["vuln"] != "SAFE")
    expected_lines.append(str(vuln_count))

    desc = (
        f"Säkerhetsaudit: Analysera {len(selected)} kodrader.\n"
        f"För varje rad, identifiera sårbarhet och rekommenderad fix:\n\n"
        f"Möjliga sårbarheter:\n"
        f"- SQL_INJECTION → fix: parameterized\n"
        f"- XSS → fix: escape\n"
        f"- COMMAND_INJECTION → fix: subprocess_list\n"
        f"- WEAK_CRYPTO → fix: bcrypt\n"
        f"- WEAK_RANDOM → fix: secrets\n"
        f"- SAFE → fix: none\n\n"
        f"Output: en rad per kodsnutt med 'VULN_TYPE fix_type', sedan total antal sårbarheter"
    )

    return Task(
        id=f"sec-audit-{random.randint(1000,9999)}",
        title="Säkerhetsaudit: Hitta sårbarheter",
        description=desc,
        difficulty=12,
        category="security_audit",
        test_cases=[TestCase("\n".join(input_lines) + "\n", "\n".join(expected_lines), "Security audit")],
        hints=["Matcha mönster: f-string i SQL=injection, os.system=cmd injection, md5=weak crypto"],
        tags=["security", "sql_injection", "xss", "crypto"],
    )


def _security_crypto_analysis() -> Task:
    """Analyze cryptographic implementations for weaknesses."""
    key_len = random.choice([8, 16, 32, 64, 128, 256])
    algo = random.choice(["AES-128", "AES-256", "DES", "3DES", "RSA-1024", "RSA-2048", "RSA-4096"])
    mode = random.choice(["ECB", "CBC", "GCM", "CTR"])
    iv_reuse = random.choice([True, False])
    padding = random.choice(["PKCS7", "none", "zero"])

    weaknesses = []
    if algo in ("DES", "3DES"):
        weaknesses.append("WEAK_ALGORITHM")
    if algo == "RSA-1024":
        weaknesses.append("SHORT_KEY")
    if mode == "ECB":
        weaknesses.append("ECB_MODE")
    if iv_reuse and mode in ("CBC", "CTR"):
        weaknesses.append("IV_REUSE")
    if padding == "none":
        weaknesses.append("NO_PADDING")
    if key_len < 16:
        weaknesses.append("SHORT_KEY")

    # Remove duplicates
    weaknesses = list(dict.fromkeys(weaknesses))

    input_lines = [
        f"algorithm: {algo}",
        f"mode: {mode}",
        f"key_length: {key_len}",
        f"iv_reuse: {str(iv_reuse).lower()}",
        f"padding: {padding}",
    ]

    severity = "CRITICAL" if len(weaknesses) >= 3 else ("HIGH" if len(weaknesses) >= 2 else ("MEDIUM" if weaknesses else "LOW"))
    expected_lines = [
        str(len(weaknesses)),
        " ".join(weaknesses) if weaknesses else "NONE",
        severity,
    ]

    desc = (
        f"Kryptoanalys: Analysera en kryptografisk konfiguration.\n"
        f"Input: 5 rader med 'nyckel: värde' format.\n\n"
        f"Identifiera svagheter:\n"
        f"- WEAK_ALGORITHM: DES eller 3DES\n"
        f"- SHORT_KEY: RSA < 2048 eller key_length < 16\n"
        f"- ECB_MODE: ECB-läge (mönster läcker)\n"
        f"- IV_REUSE: IV återanvänds med CBC/CTR\n"
        f"- NO_PADDING: padding=none\n\n"
        f"Output:\n"
        f"- Rad 1: antal svagheter\n"
        f"- Rad 2: svagheter separerade med mellanslag (eller NONE)\n"
        f"- Rad 3: allvarlighetsgrad (CRITICAL ≥3, HIGH ≥2, MEDIUM ≥1, LOW =0)"
    )

    return Task(
        id=f"sec-crypto-{random.randint(1000,9999)}",
        title="Kryptoanalys: Hitta svagheter",
        description=desc,
        difficulty=13,
        category="security_audit",
        test_cases=[TestCase("\n".join(input_lines) + "\n", "\n".join(expected_lines), "Crypto analysis")],
        hints=["Parsa key-value, matcha mot kända svagheter, räkna och klassificera"],
        tags=["security", "cryptography", "analysis"],
    )


def _security_dependency_audit() -> Task:
    """Analyze dependency tree for known vulnerable versions."""
    packages = [
        ("lodash", "4.17.15", "CVE-2020-8203", "HIGH"),
        ("lodash", "4.17.21", None, None),
        ("express", "4.17.1", "CVE-2022-24999", "MEDIUM"),
        ("express", "4.18.2", None, None),
        ("axios", "0.21.0", "CVE-2021-3749", "HIGH"),
        ("axios", "1.4.0", None, None),
        ("jsonwebtoken", "8.5.0", "CVE-2022-23529", "CRITICAL"),
        ("jsonwebtoken", "9.0.0", None, None),
        ("minimist", "1.2.5", "CVE-2021-44906", "CRITICAL"),
        ("minimist", "1.2.8", None, None),
        ("moment", "2.29.1", "CVE-2022-31129", "HIGH"),
        ("moment", "2.29.4", None, None),
        ("node-fetch", "2.6.1", "CVE-2022-0235", "HIGH"),
        ("node-fetch", "2.6.9", None, None),
    ]

    # Select a mix of vulnerable and safe
    selected = []
    used_names = set()
    for pkg_name, ver, cve, sev in random.sample(packages, min(8, len(packages))):
        if pkg_name not in used_names:
            selected.append((pkg_name, ver, cve, sev))
            used_names.add(pkg_name)

    input_lines = [str(len(selected))]
    for name, ver, _, _ in selected:
        input_lines.append(f"{name}@{ver}")

    vuln_list = [(name, ver, cve, sev) for name, ver, cve, sev in selected if cve]
    expected_lines = [str(len(vuln_list))]
    for name, ver, cve, sev in sorted(vuln_list, key=lambda x: {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2}.get(x[3], 3)):
        expected_lines.append(f"{name}@{ver} {cve} {sev}")

    has_critical = any(sev == "CRITICAL" for _, _, _, sev in vuln_list)
    expected_lines.append("BLOCK" if has_critical else ("WARN" if vuln_list else "PASS"))

    desc = (
        f"Dependency Audit: Analysera {len(selected)} paket för kända sårbarheter.\n"
        f"Input: paket@version per rad.\n\n"
        f"Kända sårbara versioner:\n"
        f"- lodash@4.17.15 → CVE-2020-8203 HIGH\n"
        f"- express@4.17.1 → CVE-2022-24999 MEDIUM\n"
        f"- axios@0.21.0 → CVE-2021-3749 HIGH\n"
        f"- jsonwebtoken@8.5.0 → CVE-2022-23529 CRITICAL\n"
        f"- minimist@1.2.5 → CVE-2021-44906 CRITICAL\n"
        f"- moment@2.29.1 → CVE-2022-31129 HIGH\n"
        f"- node-fetch@2.6.1 → CVE-2022-0235 HIGH\n\n"
        f"Output:\n"
        f"- Rad 1: antal sårbara paket\n"
        f"- Sedan per sårbart paket (sorterat CRITICAL först): 'paket@ver CVE SEVERITY'\n"
        f"- Sista raden: BLOCK om CRITICAL finns, WARN om bara HIGH/MEDIUM, PASS om inga"
    )

    return Task(
        id=f"sec-deps-{random.randint(1000,9999)}",
        title="Dependency Audit: Supply Chain",
        description=desc,
        difficulty=11,
        category="security_audit",
        test_cases=[TestCase("\n".join(input_lines) + "\n", "\n".join(expected_lines), "Dep audit")],
        hints=["Matcha paket@version mot känd lista, sortera efter severity"],
        tags=["security", "supply_chain", "dependency_audit"],
    )


def _gen_security_audit() -> Task:
    return random.choice([_security_sql_injection, _security_crypto_analysis, _security_dependency_audit])()


# ============================================================
# 3. DEVOPS DEBUG — Infrastructure debugging
# ============================================================

def _devops_firewall_rules() -> Task:
    """Analyze firewall rules and find conflicts/gaps."""
    rules = []
    n = random.randint(6, 10)
    ports_used = set()
    for i in range(n):
        port = random.choice([22, 80, 443, 3306, 5432, 6379, 8080, 8443, 9090, 27017])
        action = random.choice(["ALLOW", "DENY"])
        src = random.choice(["0.0.0.0/0", "10.0.0.0/8", "192.168.1.0/24", "172.16.0.0/12"])
        proto = random.choice(["TCP", "UDP"])
        rules.append((action, proto, port, src))
        ports_used.add(port)

    # Find conflicts: same port with both ALLOW and DENY
    port_actions: dict[int, set] = {}
    for action, proto, port, src in rules:
        port_actions.setdefault(port, set()).add(action)
    conflicts = [p for p, acts in port_actions.items() if len(acts) > 1]

    # Find dangerous: ALLOW from 0.0.0.0/0 on sensitive ports
    sensitive_ports = {22, 3306, 5432, 6379, 27017}
    dangerous = []
    for action, proto, port, src in rules:
        if action == "ALLOW" and src == "0.0.0.0/0" and port in sensitive_ports:
            dangerous.append(port)
    dangerous = sorted(set(dangerous))

    input_lines = [str(n)]
    for action, proto, port, src in rules:
        input_lines.append(f"{action} {proto} {port} {src}")

    expected_lines = [
        str(len(conflicts)),
        " ".join(str(p) for p in sorted(conflicts)) if conflicts else "none",
        str(len(dangerous)),
        " ".join(str(p) for p in dangerous) if dangerous else "none",
    ]

    desc = (
        f"Firewall-analys: Analysera {n} brandväggsregler.\n"
        f"Format: 'ACTION PROTO PORT SOURCE'\n\n"
        f"Steg 1: Hitta konflikter — portar med både ALLOW och DENY\n"
        f"Steg 2: Hitta farliga regler — ALLOW från 0.0.0.0/0 på känsliga portar "
        f"(22, 3306, 5432, 6379, 27017)\n\n"
        f"Output:\n"
        f"- Rad 1: antal portar med konflikter\n"
        f"- Rad 2: konfliktportar sorterade (eller 'none')\n"
        f"- Rad 3: antal farliga regler\n"
        f"- Rad 4: farliga portar sorterade (eller 'none')"
    )

    return Task(
        id=f"devops-firewall-{random.randint(1000,9999)}",
        title="DevOps: Firewall-analys",
        description=desc,
        difficulty=11,
        category="devops_debug",
        test_cases=[TestCase("\n".join(input_lines) + "\n", "\n".join(expected_lines), "Firewall")],
        hints=["Gruppera regler per port, kolla action-konflikter och 0.0.0.0/0 på känsliga portar"],
        tags=["devops", "firewall", "network_security"],
    )


def _devops_docker_analysis() -> Task:
    """Analyze Dockerfile for security issues and best practices."""
    instructions = []
    issues = []

    patterns = [
        ("FROM ubuntu:latest", "LATEST_TAG"),
        ("FROM python:3.11-slim", None),
        ("RUN apt-get update && apt-get install -y curl wget", None),
        ("RUN apt-get install -y sudo", "UNNECESSARY_SUDO"),
        ("USER root", "ROOT_USER"),
        ("USER appuser", None),
        ("COPY . /app", "COPY_ALL"),
        ("COPY requirements.txt /app/", None),
        ("ENV DB_PASSWORD=secret123", "HARDCODED_SECRET"),
        ("ENV APP_PORT=8080", None),
        ("EXPOSE 22", "EXPOSED_SSH"),
        ("EXPOSE 8080", None),
        ("RUN chmod 777 /app", "WORLD_WRITABLE"),
        ("RUN chmod 755 /app", None),
        ("HEALTHCHECK NONE", "NO_HEALTHCHECK"),
        ("HEALTHCHECK CMD curl -f http://localhost:8080/health", None),
    ]

    selected = random.sample(patterns, random.randint(7, 10))
    for instr, issue in selected:
        instructions.append(instr)
        if issue:
            issues.append(issue)

    # Sort issues alphabetically for deterministic expected output
    issues.sort()

    input_lines = [str(len(instructions))]
    input_lines.extend(instructions)

    expected_lines = [
        str(len(issues)),
        " ".join(issues) if issues else "NONE",
        "FAIL" if len(issues) >= 3 else ("WARN" if issues else "PASS"),
    ]

    desc = (
        f"Docker Security Audit: Analysera {len(instructions)} Dockerfile-instruktioner.\n\n"
        f"Kända problem:\n"
        f"- LATEST_TAG: FROM med :latest\n"
        f"- UNNECESSARY_SUDO: installerar sudo\n"
        f"- ROOT_USER: USER root\n"
        f"- COPY_ALL: COPY . (kopierar allt inkl secrets)\n"
        f"- HARDCODED_SECRET: ENV med password/secret\n"
        f"- EXPOSED_SSH: EXPOSE 22\n"
        f"- WORLD_WRITABLE: chmod 777\n"
        f"- NO_HEALTHCHECK: HEALTHCHECK NONE\n\n"
        f"Output:\n"
        f"- Rad 1: antal problem\n"
        f"- Rad 2: problemtyper SORTERADE ALFABETISKT separerade med mellanslag (eller NONE)\n"
        f"- Rad 3: FAIL (≥3 problem), WARN (1-2), PASS (0)"
    )

    return Task(
        id=f"devops-docker-{random.randint(1000,9999)}",
        title="DevOps: Docker Security Audit",
        description=desc,
        difficulty=12,
        category="devops_debug",
        test_cases=[TestCase("\n".join(input_lines) + "\n", "\n".join(expected_lines), "Docker audit")],
        hints=["Matcha varje instruktion mot kända problemmönster"],
        tags=["devops", "docker", "security", "best_practices"],
    )


def _devops_cicd_debug() -> Task:
    """Debug a CI/CD pipeline configuration."""
    stages = ["build", "test", "lint", "deploy", "notify"]
    n_stages = random.randint(4, len(stages))
    selected_stages = random.sample(stages, n_stages)

    pipeline = []
    deps: dict[str, list[str]] = {}
    for i, stage in enumerate(selected_stages):
        dep = selected_stages[i - 1] if i > 0 and random.random() < 0.7 else None
        timeout = random.choice([60, 120, 300, 600, 0])  # 0 = missing timeout
        retry = random.randint(0, 3)
        pipeline.append((stage, dep, timeout, retry))
        if dep:
            deps[stage] = [dep]

    # Find issues
    issues_found = []
    for stage, dep, timeout, retry in pipeline:
        if timeout == 0:
            issues_found.append(f"NO_TIMEOUT:{stage}")
        if dep and dep not in [s for s, _, _, _ in pipeline]:
            issues_found.append(f"MISSING_DEP:{stage}")
        if stage == "deploy" and retry > 0:
            issues_found.append(f"DEPLOY_RETRY:{stage}")

    # Check for circular deps (simplified)
    has_deploy = any(s == "deploy" for s, _, _, _ in pipeline)
    has_test_before_deploy = False
    if has_deploy:
        deploy_idx = next(i for i, (s, _, _, _) in enumerate(pipeline) if s == "deploy")
        has_test_before_deploy = any(s == "test" for s, _, _, _ in pipeline[:deploy_idx])
    if has_deploy and not has_test_before_deploy:
        issues_found.append("DEPLOY_WITHOUT_TEST")

    input_lines = [str(n_stages)]
    for stage, dep, timeout, retry in pipeline:
        dep_str = dep if dep else "none"
        input_lines.append(f"{stage} depends={dep_str} timeout={timeout} retry={retry}")

    expected_lines = [
        str(len(issues_found)),
        "\n".join(issues_found) if issues_found else "NONE",
    ]

    desc = (
        f"CI/CD Pipeline Debug: Analysera {n_stages} pipeline-steg.\n"
        f"Format: 'stage depends=X timeout=Y retry=Z'\n\n"
        f"Hitta problem:\n"
        f"- NO_TIMEOUT:stage — timeout=0\n"
        f"- DEPLOY_RETRY:stage — deploy med retry > 0 (farligt!)\n"
        f"- DEPLOY_WITHOUT_TEST — deploy utan att test körs före\n\n"
        f"Output:\n"
        f"- Rad 1: antal problem\n"
        f"- Sedan ett problem per rad (eller NONE)"
    )

    return Task(
        id=f"devops-cicd-{random.randint(1000,9999)}",
        title="DevOps: CI/CD Pipeline Debug",
        description=desc,
        difficulty=12,
        category="devops_debug",
        test_cases=[TestCase("\n".join(input_lines) + "\n", "\n".join(expected_lines), "CI/CD debug")],
        hints=["Parsa varje steg, kolla timeout=0, deploy+retry, test-ordning"],
        tags=["devops", "cicd", "pipeline", "debugging"],
    )


def _gen_devops_debug() -> Task:
    return random.choice([_devops_firewall_rules, _devops_docker_analysis, _devops_cicd_debug])()


# ============================================================
# 4. MASSIVE SCALE — Large code/data analysis
# ============================================================

def _massive_code_metrics() -> Task:
    """Analyze a large codebase and compute metrics."""
    n_files = random.randint(15, 30)
    files = []
    for i in range(n_files):
        name = f"module_{i}.py"
        lines = random.randint(10, 500)
        functions = random.randint(1, lines // 10)
        classes = random.randint(0, functions // 3)
        imports = random.randint(1, 15)
        complexity = random.randint(1, 20)  # cyclomatic
        files.append((name, lines, functions, classes, imports, complexity))

    total_lines = sum(f[1] for f in files)
    total_functions = sum(f[2] for f in files)
    total_classes = sum(f[3] for f in files)
    avg_complexity = sum(f[5] for f in files) / n_files
    most_complex = max(files, key=lambda f: f[5])
    largest = max(files, key=lambda f: f[1])

    # Files with high complexity (> 10)
    high_complexity = [f for f in files if f[5] > 10]
    # Files with too many imports (> 10)
    high_imports = [f for f in files if f[4] > 10]

    input_lines = [str(n_files)]
    for name, lines, funcs, classes, imports, complexity in files:
        input_lines.append(f"{name} {lines} {funcs} {classes} {imports} {complexity}")

    expected_lines = [
        f"{total_lines} {total_functions} {total_classes}",
        f"{avg_complexity:.1f}",
        f"{most_complex[0]} {most_complex[5]}",
        f"{largest[0]} {largest[1]}",
        str(len(high_complexity)),
        str(len(high_imports)),
    ]

    desc = (
        f"Kodanalys: Analysera {n_files} filer.\n"
        f"Format: 'filnamn rader funktioner klasser imports complexity'\n\n"
        f"Beräkna:\n"
        f"1. Totalt: rader, funktioner, klasser (en rad, mellanslag-separerade)\n"
        f"2. Snitt cyclomatic complexity (1 decimal)\n"
        f"3. Mest komplexa filen: 'filnamn complexity'\n"
        f"4. Största filen: 'filnamn rader'\n"
        f"5. Antal filer med complexity > 10\n"
        f"6. Antal filer med imports > 10"
    )

    return Task(
        id=f"massive-metrics-{random.randint(1000,9999)}",
        title="Massiv: Kodbasanalys ({n_files} filer)",
        description=desc,
        difficulty=11,
        category="massive_scale",
        test_cases=[TestCase("\n".join(input_lines) + "\n", "\n".join(expected_lines), f"Code metrics n={n_files}")],
        hints=["Parsa alla filer, aggregera med sum/max/filter"],
        tags=["massive_scale", "code_analysis", "metrics"],
    )


def _massive_algorithm_optimize() -> Task:
    """Optimize an algorithm from O(n²) to O(n log n) or O(n)."""
    n = random.randint(500, 2000)
    lst = [random.randint(-1000, 1000) for _ in range(n)]

    # Task: find the maximum sum of any subarray of length exactly K
    k = random.randint(3, min(50, n // 2))
    # Sliding window O(n) solution
    window_sum = sum(lst[:k])
    max_sum = window_sum
    for i in range(k, n):
        window_sum += lst[i] - lst[i - k]
        max_sum = max(max_sum, window_sum)

    input_lines = [f"{n} {k}"] + [str(x) for x in lst]
    expected = str(max_sum)

    desc = (
        f"Optimering: Hitta maximal summa av en sammanhängande delarray med exakt {k} element.\n"
        f"Input: N K, sedan N heltal.\n"
        f"Output: maximal summa.\n\n"
        f"KRAV: N={n}, måste klara inom 2 sekunder.\n"
        f"En O(n*k) brute-force tar för lång tid. Använd sliding window O(n)."
    )

    return Task(
        id=f"massive-slidingwin-{random.randint(1000,9999)}",
        title=f"Optimera: Max Subarray Sum (K={k}, N={n})",
        description=desc,
        difficulty=12,
        category="massive_scale",
        test_cases=[TestCase("\n".join(input_lines) + "\n", expected, f"Sliding window n={n} k={k}")],
        hints=["Sliding window: håll en löpande summa, addera nytt element, subtrahera äldsta"],
        tags=["massive_scale", "optimization", "sliding_window"],
    )


def _gen_massive_scale() -> Task:
    return random.choice([_massive_code_metrics, _massive_algorithm_optimize])()


# ============================================================
# 5. CROSS-DOMAIN — Problems requiring 3+ domains
# ============================================================

def _cross_network_crypto_math() -> Task:
    """Combine networking, cryptography, and math."""
    # Simulate: compute subnet info + hash + checksum
    ip_parts = [random.randint(1, 254) for _ in range(4)]
    ip = ".".join(str(p) for p in ip_parts)
    cidr = random.choice([8, 16, 24, 28])

    # Network calculations
    mask_bits = (0xFFFFFFFF << (32 - cidr)) & 0xFFFFFFFF
    ip_int = sum(p << (8 * (3 - i)) for i, p in enumerate(ip_parts))
    network_int = ip_int & mask_bits
    broadcast_int = network_int | (~mask_bits & 0xFFFFFFFF)
    num_hosts = (1 << (32 - cidr)) - 2

    def int_to_ip(n):
        return ".".join(str((n >> (8 * (3 - i))) & 0xFF) for i in range(4))

    network_addr = int_to_ip(network_int)
    broadcast_addr = int_to_ip(broadcast_int)

    # Hash the network address
    net_hash = hashlib.sha256(network_addr.encode()).hexdigest()[:16]

    # Checksum: sum of all IP octets mod 256
    checksum = sum(ip_parts) % 256

    input_lines = [f"{ip}/{cidr}"]
    expected_lines = [
        network_addr,
        broadcast_addr,
        str(max(num_hosts, 0)),
        net_hash,
        str(checksum),
    ]

    desc = (
        f"Cross-domain: Nätverk + Krypto + Matematik\n"
        f"Input: IP-adress/CIDR\n\n"
        f"Beräkna:\n"
        f"1. Nätverksadress (IP AND mask)\n"
        f"2. Broadcast-adress (network OR ~mask)\n"
        f"3. Antal användbara hosts (2^(32-CIDR) - 2, min 0)\n"
        f"4. SHA-256 hash av nätverksadressen (första 16 hex-tecken)\n"
        f"5. Checksumma: summan av IP-oktetterna mod 256"
    )

    return Task(
        id=f"cross-netcrypto-{random.randint(1000,9999)}",
        title="Cross-domain: Nätverk+Krypto+Math",
        description=desc,
        difficulty=13,
        category="cross_domain",
        test_cases=[TestCase("\n".join(input_lines) + "\n", "\n".join(expected_lines), "Net+Crypto+Math")],
        hints=["Parsa IP/CIDR, beräkna mask med bitshift, SHA-256 med hashlib"],
        tags=["cross_domain", "networking", "cryptography", "math"],
    )


def _cross_stats_ml_optimization() -> Task:
    """Combine statistics, ML concepts, and optimization."""
    n = random.randint(20, 50)
    # Generate data points for linear regression
    true_slope = random.uniform(0.5, 5.0)
    true_intercept = random.uniform(-10, 10)
    x_vals = [random.uniform(0, 100) for _ in range(n)]
    y_vals = [true_slope * x + true_intercept + random.gauss(0, 5) for x in x_vals]

    # Round to 2 decimals (same as what appears in input)
    x_vals = [round(x, 2) for x in x_vals]
    y_vals = [round(y, 2) for y in y_vals]
    x_new = round(random.uniform(50, 150), 2)

    # Compute linear regression from the ROUNDED values (what the solver will see)
    x_mean = sum(x_vals) / n
    y_mean = sum(y_vals) / n
    ss_xy = sum((x - x_mean) * (y - y_mean) for x, y in zip(x_vals, y_vals))
    ss_xx = sum((x - x_mean) ** 2 for x in x_vals)
    slope = ss_xy / ss_xx
    intercept = y_mean - slope * x_mean

    # R² score
    ss_res = sum((y - (slope * x + intercept)) ** 2 for x, y in zip(x_vals, y_vals))
    ss_tot = sum((y - y_mean) ** 2 for y in y_vals)
    r_squared = 1 - ss_res / ss_tot

    # Predict for a new x
    y_pred = slope * x_new + intercept

    input_lines = [str(n)]
    for x, y in zip(x_vals, y_vals):
        input_lines.append(f"{x:.2f} {y:.2f}")
    input_lines.append(f"{x_new:.2f}")

    expected_lines = [
        f"{slope:.4f}",
        f"{intercept:.4f}",
        f"{r_squared:.4f}",
        f"{y_pred:.4f}",
    ]

    desc = (
        f"Cross-domain: Statistik + ML + Optimering\n"
        f"Input: {n} datapunkter (x y), sedan ett nytt x-värde.\n\n"
        f"Beräkna linjär regression (minsta kvadratmetoden):\n"
        f"1. Lutning (slope) med 4 decimaler\n"
        f"2. Intercept med 4 decimaler\n"
        f"3. R²-score med 4 decimaler\n"
        f"4. Prediktion för det nya x-värdet med 4 decimaler\n\n"
        f"Formler:\n"
        f"- slope = Σ(xi-x̄)(yi-ȳ) / Σ(xi-x̄)²\n"
        f"- intercept = ȳ - slope * x̄\n"
        f"- R² = 1 - SS_res/SS_tot"
    )

    return Task(
        id=f"cross-regression-{random.randint(1000,9999)}",
        title="Cross-domain: Linjär Regression",
        description=desc,
        difficulty=13,
        category="cross_domain",
        test_cases=[TestCase("\n".join(input_lines) + "\n", "\n".join(expected_lines), "LinReg")],
        hints=["Beräkna medelvärden, SS_xy, SS_xx, sedan slope och intercept"],
        tags=["cross_domain", "statistics", "ml", "regression"],
    )


def _gen_cross_domain() -> Task:
    return random.choice([_cross_network_crypto_math, _cross_stats_ml_optimization])()


# ============================================================
# 6. ADVERSARIAL — Subtly broken code, edge case traps
# ============================================================

def _adversarial_subtle_bug() -> Task:
    """Code that looks correct but has a subtle edge case bug."""
    # Floating point precision trap
    n = random.randint(5, 10)
    prices = [round(random.uniform(0.01, 99.99), 2) for _ in range(n)]
    discount = random.choice([0.1, 0.15, 0.2, 0.25])

    # Correct: use round on each item, then sum
    discounted = [round(p * (1 - discount), 2) for p in prices]
    total = round(sum(discounted), 2)

    input_lines = [str(n), str(discount)]
    input_lines.extend(f"{p:.2f}" for p in prices)

    # Format total with exactly 2 decimals
    expected = f"{total:.2f}"

    desc = (
        f"Beräkna totalpris efter rabatt.\n"
        f"Input: N (antal varor), rabatt (decimal), sedan N priser.\n"
        f"Applicera rabatten på varje pris individuellt, avrunda till 2 decimaler.\n"
        f"Summera de rabatterade priserna och avrunda totalen till 2 decimaler.\n\n"
        f"VARNING: Floating-point precision! Avrunda VARJE steg.\n"
        f"Output: totalpris med exakt 2 decimaler."
    )

    return Task(
        id=f"adv-floatprecision-{random.randint(1000,9999)}",
        title="Adversarial: Floating-point Precision",
        description=desc,
        difficulty=12,
        category="adversarial",
        test_cases=[TestCase("\n".join(input_lines) + "\n", expected, "Float precision")],
        hints=["Avrunda varje rabatterat pris separat med round(x, 2) INNAN summering"],
        tags=["adversarial", "floating_point", "precision"],
    )


def _adversarial_unicode_trap() -> Task:
    """String processing with Unicode edge cases."""
    test_strings = [
        ("hello world", 11, 2, "HELLO WORLD"),
        ("café", 4, 1, "CAFÉ"),
        ("naïve", 5, 1, "NAÏVE"),
        ("über cool", 9, 2, "ÜBER COOL"),
        ("日本語テスト", 6, 1, "日本語テスト"),
    ]

    selected = random.sample(test_strings, random.randint(3, 4))
    input_lines = [str(len(selected))]
    for s, _, _, _ in selected:
        input_lines.append(s)

    expected_lines = []
    for s, length, words, upper in selected:
        expected_lines.append(f"{length} {words} {upper}")

    desc = (
        f"Unicode-hantering: Analysera {len(selected)} strängar.\n"
        f"För varje sträng, beräkna:\n"
        f"- Antal tecken (len)\n"
        f"- Antal ord (split på mellanslag)\n"
        f"- Versaler (upper)\n\n"
        f"Output: en rad per sträng med 'längd ord VERSALER'"
    )

    return Task(
        id=f"adv-unicode-{random.randint(1000,9999)}",
        title="Adversarial: Unicode Edge Cases",
        description=desc,
        difficulty=11,
        category="adversarial",
        test_cases=[TestCase("\n".join(input_lines) + "\n", "\n".join(expected_lines), "Unicode")],
        hints=["Python hanterar Unicode nativt — len(), split(), upper() fungerar"],
        tags=["adversarial", "unicode", "string"],
    )


def _adversarial_race_condition() -> Task:
    """Simulate detecting race conditions in event ordering."""
    n_events = random.randint(8, 15)
    resources = ["db", "cache", "file", "api"]
    events = []
    locks_held: dict[str, str] = {}  # resource -> thread
    races = []

    threads = ["T1", "T2", "T3"]
    for i in range(n_events):
        thread = random.choice(threads)
        resource = random.choice(resources)
        action = random.choice(["LOCK", "UNLOCK", "READ", "WRITE"])
        events.append((thread, action, resource))

        if action == "LOCK":
            if resource in locks_held and locks_held[resource] != thread:
                races.append(f"DEADLOCK_RISK:{thread}:{resource}")
            locks_held[resource] = thread
        elif action == "UNLOCK":
            if resource in locks_held and locks_held[resource] == thread:
                del locks_held[resource]
        elif action in ("READ", "WRITE"):
            if resource in locks_held and locks_held[resource] != thread:
                races.append(f"RACE:{thread}:{action}:{resource}")
            elif resource not in locks_held and action == "WRITE":
                races.append(f"UNPROTECTED_WRITE:{thread}:{resource}")

    input_lines = [str(n_events)]
    for thread, action, resource in events:
        input_lines.append(f"{thread} {action} {resource}")

    unique_races = list(dict.fromkeys(races))
    expected_lines = [str(len(unique_races))]
    expected_lines.extend(unique_races if unique_races else ["NONE"])

    desc = (
        f"Race Condition Detector: Analysera {n_events} trådhändelser.\n"
        f"Format: 'THREAD ACTION RESOURCE'\n"
        f"Actions: LOCK, UNLOCK, READ, WRITE\n\n"
        f"Detektera:\n"
        f"- DEADLOCK_RISK:thread:resource — LOCK på redan låst resurs av annan tråd\n"
        f"- RACE:thread:action:resource — READ/WRITE på resurs låst av annan tråd\n"
        f"- UNPROTECTED_WRITE:thread:resource — WRITE utan att hålla lås\n\n"
        f"Output: antal problem, sedan ett per rad (eller NONE). Behåll ordning, ta bort dubbletter."
    )

    return Task(
        id=f"adv-race-{random.randint(1000,9999)}",
        title="Adversarial: Race Condition Detector",
        description=desc,
        difficulty=14,
        category="adversarial",
        test_cases=[TestCase("\n".join(input_lines) + "\n", "\n".join(expected_lines), "Race detection")],
        hints=["Håll koll på vilken tråd som håller lås per resurs, kolla vid varje operation"],
        tags=["adversarial", "concurrency", "race_condition", "threading"],
    )


def _gen_adversarial() -> Task:
    return random.choice([_adversarial_subtle_bug, _adversarial_unicode_trap, _adversarial_race_condition])()


# ============================================================
# 7. REAL-WORLD AUTOMATION — Complex automation tasks
# ============================================================

def _auto_config_merger() -> Task:
    """Merge multiple configuration files with conflict resolution."""
    base_config = {
        "port": 3000,
        "host": "localhost",
        "debug": False,
        "log_level": "info",
        "max_connections": 100,
        "timeout": 30,
    }

    overrides = {}
    n_overrides = random.randint(3, 5)
    keys = list(base_config.keys())
    override_keys = random.sample(keys, n_overrides)
    for key in override_keys:
        if isinstance(base_config[key], int):
            overrides[key] = random.randint(1, 9999)
        elif isinstance(base_config[key], bool):
            overrides[key] = not base_config[key]
        else:
            overrides[key] = random.choice(["debug", "warn", "error", "0.0.0.0", "production"])

    merged = {**base_config, **overrides}

    input_lines = [str(len(base_config))]
    for k, v in base_config.items():
        input_lines.append(f"{k}={json.dumps(v)}")
    input_lines.append(str(len(overrides)))
    for k, v in overrides.items():
        input_lines.append(f"{k}={json.dumps(v)}")

    expected_lines = [str(len(merged))]
    for k in sorted(merged.keys()):
        expected_lines.append(f"{k}={json.dumps(merged[k])}")
    expected_lines.append(str(n_overrides))

    desc = (
        f"Config Merger: Slå ihop två konfigurationer.\n"
        f"Input:\n"
        f"- N1 rader med base config (key=JSON_value)\n"
        f"- N2 rader med overrides (key=JSON_value)\n\n"
        f"Regler: Overrides skriver över base. Behåll alla nycklar.\n\n"
        f"Output:\n"
        f"- Antal nycklar i merged config\n"
        f"- Alla key=value sorterade alfabetiskt\n"
        f"- Antal överskrivna nycklar"
    )

    return Task(
        id=f"auto-configmerge-{random.randint(1000,9999)}",
        title="Automation: Config Merger",
        description=desc,
        difficulty=11,
        category="real_world_auto",
        test_cases=[TestCase("\n".join(input_lines) + "\n", "\n".join(expected_lines), "Config merge")],
        hints=["Parsa key=value, bygg dict, merga med overrides, sortera output"],
        tags=["automation", "config", "merge"],
    )


def _auto_api_retry_logic() -> Task:
    """Simulate API calls with retry logic and exponential backoff."""
    n_requests = random.randint(5, 10)
    requests_data = []
    for i in range(n_requests):
        url = f"/api/resource/{random.randint(1, 100)}"
        # Simulate responses: list of status codes for each attempt
        n_attempts = random.randint(1, 4)
        statuses = []
        for j in range(n_attempts):
            if j == n_attempts - 1 and random.random() < 0.7:
                statuses.append(200)  # succeed eventually
            else:
                statuses.append(random.choice([200, 429, 500, 503]))
        requests_data.append((url, statuses))

    input_lines = [str(n_requests)]
    for url, statuses in requests_data:
        input_lines.append(f"{url} {' '.join(str(s) for s in statuses)}")

    # Simulate retry logic
    results = []
    total_attempts = 0
    successful = 0
    for url, statuses in requests_data:
        attempts = 0
        final_status = None
        for status in statuses:
            attempts += 1
            if status == 200:
                final_status = 200
                break
            elif status in (429, 500, 503):
                continue  # retry
            else:
                final_status = status
                break
        if final_status is None:
            final_status = statuses[-1]
        total_attempts += attempts
        if final_status == 200:
            successful += 1
        # Backoff: 1s, 2s, 4s, 8s...
        backoff_total = sum(2 ** i for i in range(attempts - 1)) if attempts > 1 else 0
        results.append((url, final_status, attempts, backoff_total))

    expected_lines = [f"{successful}/{n_requests}"]
    expected_lines.append(str(total_attempts))
    for url, status, attempts, backoff in results:
        expected_lines.append(f"{url} {status} {attempts} {backoff}s")

    desc = (
        f"API Retry Logic: Simulera {n_requests} API-anrop med retry.\n"
        f"Input: URL följt av statusar för varje försök.\n\n"
        f"Regler:\n"
        f"- 200 = success, sluta\n"
        f"- 429/500/503 = retry med exponential backoff (1s, 2s, 4s...)\n"
        f"- Andra = fail, sluta\n"
        f"- Max försök = antal givna statusar\n\n"
        f"Output:\n"
        f"- Rad 1: lyckade/totala (t.ex. '7/10')\n"
        f"- Rad 2: totalt antal försök\n"
        f"- Per request: 'URL slutstatus försök total_backoff_s'"
    )

    return Task(
        id=f"auto-apiretry-{random.randint(1000,9999)}",
        title="Automation: API Retry med Backoff",
        description=desc,
        difficulty=12,
        category="real_world_auto",
        test_cases=[TestCase("\n".join(input_lines) + "\n", "\n".join(expected_lines), "API retry")],
        hints=["Iterera statusar, bryt vid 200 eller icke-retrybar, beräkna backoff med 2^i"],
        tags=["automation", "api", "retry", "backoff"],
    )


def _auto_data_format_converter() -> Task:
    """Convert between data formats (JSON-like -> CSV -> aggregated)."""
    n = random.randint(8, 15)
    records = []
    categories = ["electronics", "clothing", "food", "books", "toys"]
    for _ in range(n):
        name = f"item_{random.randint(100, 999)}"
        cat = random.choice(categories)
        price = round(random.uniform(5.0, 500.0), 2)
        qty = random.randint(1, 50)
        records.append((name, cat, price, qty))

    input_lines = [str(n)]
    for name, cat, price, qty in records:
        input_lines.append(f'{{"name":"{name}","category":"{cat}","price":{price},"qty":{qty}}}')

    # CSV output
    csv_lines = ["name,category,price,qty"]
    for name, cat, price, qty in records:
        csv_lines.append(f"{name},{cat},{price:.2f},{qty}")

    # Aggregation per category
    cat_totals: dict[str, float] = {}
    cat_counts: dict[str, int] = {}
    for name, cat, price, qty in records:
        cat_totals[cat] = cat_totals.get(cat, 0) + price * qty
        cat_counts[cat] = cat_counts.get(cat, 0) + qty

    sorted_cats = sorted(cat_totals.items(), key=lambda x: -x[1])

    expected_lines = csv_lines.copy()
    expected_lines.append("---")
    for cat, total in sorted_cats:
        expected_lines.append(f"{cat} {total:.2f} {cat_counts[cat]}")

    desc = (
        f"Data Format Converter: JSON → CSV → Aggregering\n"
        f"Input: {n} JSON-objekt (en per rad).\n\n"
        f"Steg 1: Konvertera till CSV (header: name,category,price,qty)\n"
        f"  - price med 2 decimaler\n"
        f"Steg 2: Aggregera per kategori: total revenue (price*qty), total qty\n"
        f"  - Sortera efter revenue (högst först)\n\n"
        f"Output:\n"
        f"- CSV-rader (inkl header)\n"
        f"- '---' separator\n"
        f"- Per kategori: 'category total_revenue total_qty'"
    )

    return Task(
        id=f"auto-dataconv-{random.randint(1000,9999)}",
        title="Automation: JSON→CSV→Aggregering",
        description=desc,
        difficulty=12,
        category="real_world_auto",
        test_cases=[TestCase("\n".join(input_lines) + "\n", "\n".join(expected_lines), "Data converter")],
        hints=["Parsa JSON med json.loads, formatera CSV, gruppera med dict"],
        tags=["automation", "data_conversion", "json", "csv", "aggregation"],
    )


def _gen_real_world_auto() -> Task:
    return random.choice([_auto_config_merger, _auto_api_retry_logic, _auto_data_format_converter])()


# ============================================================
# REGISTRY
# ============================================================

V3_GENERATORS = [
    (11, _gen_chain_reasoning),
    (12, _gen_security_audit),
    (12, _gen_devops_debug),
    (12, _gen_massive_scale),
    (13, _gen_cross_domain),
    (13, _gen_adversarial),
    (12, _gen_real_world_auto),
]

V3_CATEGORIES = [
    "chain_reasoning",
    "security_audit",
    "devops_debug",
    "massive_scale",
    "cross_domain",
    "adversarial",
    "real_world_auto",
]


def generate_v3_task(difficulty: int | None = None) -> Task:
    """Generate a Superhuman task (difficulty 11-14)."""
    if difficulty is not None:
        eligible = [fn for d, fn in V3_GENERATORS if abs(d - difficulty) <= 2]
    else:
        eligible = [fn for _, fn in V3_GENERATORS]

    if not eligible:
        eligible = [fn for _, fn in V3_GENERATORS]

    gen_fn = random.choice(eligible)
    return gen_fn()
