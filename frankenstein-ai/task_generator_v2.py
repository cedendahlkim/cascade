"""
Frankenstein 2.0 — Advanced Task Generators.

New task categories that System 0 (deterministic solver) CANNOT solve,
forcing System 1 (memory) and System 2 (LLM) to work.

Categories:
- multi_file: Tasks requiring coordinated changes across multiple files
- bugfix: Find and fix bugs in existing code
- code_review: Identify issues in code and suggest fixes
- api_design: Design a simple API/class interface
- test_writing: Write tests for given code
- optimization: Optimize slow code to pass time constraints
"""

import random
import json
from dataclasses import dataclass
from programming_env import Task, TestCase


# ============================================================
# BUGFIX: Find and fix bugs in existing code
# ============================================================

def _gen_bugfix() -> Task:
    """Generate a bugfix task with intentionally broken code."""
    problems = [
        _bugfix_off_by_one,
        _bugfix_wrong_condition,
        _bugfix_missing_edge_case,
        _bugfix_wrong_return,
        _bugfix_infinite_loop,
    ]
    return random.choice(problems)()


def _bugfix_off_by_one() -> Task:
    """Binary search with off-by-one error."""
    arr = sorted(random.sample(range(1, 100), random.randint(8, 15)))
    target_idx = random.randint(0, len(arr) - 1)
    target = arr[target_idx]
    missing = random.choice([x for x in range(1, 100) if x not in arr])

    buggy_code = '''def binary_search(arr, target):
    lo, hi = 0, len(arr)  # BUG: should be len(arr)-1
    while lo <= hi:
        mid = (lo + hi) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            lo = mid + 1
        else:
            hi = mid - 1
    return -1'''

    desc = (
        f"Följande binary_search-funktion har en bugg som kan orsaka IndexError.\n"
        f"Fixa buggen och skriv ett komplett program som:\n"
        f"1. Läser N, sedan N sorterade heltal, sedan ett målvärde\n"
        f"2. Skriver ut indexet där målet finns, eller -1\n\n"
        f"Buggig kod:\n```\n{buggy_code}\n```"
    )

    tests = [
        TestCase(
            f"{len(arr)}\n" + " ".join(str(x) for x in arr) + f"\n{target}\n",
            str(target_idx),
            f"Hitta {target}"
        ),
        TestCase(
            f"{len(arr)}\n" + " ".join(str(x) for x in arr) + f"\n{missing}\n",
            "-1",
            f"Saknas: {missing}"
        ),
    ]

    return Task(
        id=f"bugfix-bsearch-{random.randint(1000,9999)}",
        title="Fixa bugg: Binary Search",
        description=desc,
        difficulty=5,
        category="bugfix",
        test_cases=tests,
        hints=["Kolla gränserna i while-loopen och hi-initieringen"],
        tags=["bugfix", "binary_search", "off_by_one"],
    )


def _bugfix_wrong_condition() -> Task:
    """FizzBuzz with wrong modulo condition."""
    n = random.randint(15, 30)
    expected_lines = []
    for i in range(1, n + 1):
        if i % 15 == 0:
            expected_lines.append("FizzBuzz")
        elif i % 3 == 0:
            expected_lines.append("Fizz")
        elif i % 5 == 0:
            expected_lines.append("Buzz")
        else:
            expected_lines.append(str(i))

    buggy_code = '''n = int(input())
for i in range(1, n+1):
    if i % 3 == 0:      # BUG: should check 15 first
        print("Fizz")
    elif i % 5 == 0:
        print("Buzz")
    elif i % 15 == 0:
        print("FizzBuzz")
    else:
        print(i)'''

    desc = (
        f"Följande FizzBuzz-implementation har en logikbugg.\n"
        f"Fixa buggen. Programmet ska:\n"
        f"- Läsa N\n"
        f"- För varje tal 1..N: skriv 'FizzBuzz' om delbart med 15, "
        f"'Fizz' om delbart med 3, 'Buzz' om delbart med 5, annars talet\n\n"
        f"Buggig kod:\n```\n{buggy_code}\n```"
    )

    return Task(
        id=f"bugfix-fizzbuzz-{random.randint(1000,9999)}",
        title="Fixa bugg: FizzBuzz",
        description=desc,
        difficulty=3,
        category="bugfix",
        test_cases=[TestCase(f"{n}\n", "\n".join(expected_lines), f"FizzBuzz 1..{n}")],
        hints=["Ordningen på if/elif-villkoren spelar roll"],
        tags=["bugfix", "logic", "fizzbuzz"],
    )


def _bugfix_missing_edge_case() -> Task:
    """Max subarray that fails on all-negative input."""
    # Normal case
    lst1 = [random.randint(-5, 10) for _ in range(random.randint(5, 8))]
    # All negative case
    lst2 = [random.randint(-10, -1) for _ in range(random.randint(3, 6))]

    def kadane(lst):
        max_sum = curr = lst[0]
        for x in lst[1:]:
            curr = max(x, curr + x)
            max_sum = max(max_sum, curr)
        return max_sum

    buggy_code = '''n = int(input())
lst = [int(input()) for _ in range(n)]
max_sum = 0  # BUG: should be lst[0] for all-negative case
curr = 0     # BUG: same
for x in lst:
    curr = max(0, curr + x)  # BUG: max(x, ...) not max(0, ...)
    max_sum = max(max_sum, curr)
print(max_sum)'''

    desc = (
        f"Följande Kadane's algorithm-implementation har en bugg som gör att den "
        f"returnerar 0 istället för rätt svar när alla tal är negativa.\n"
        f"Fixa buggen.\n\n"
        f"Buggig kod:\n```\n{buggy_code}\n```"
    )

    tests = []
    for lst in [lst1, lst2]:
        n = len(lst)
        input_str = f"{n}\n" + "\n".join(str(x) for x in lst) + "\n"
        tests.append(TestCase(input_str, str(kadane(lst)), f"Kadane {lst}"))

    return Task(
        id=f"bugfix-kadane-{random.randint(1000,9999)}",
        title="Fixa bugg: Max Subarray (Kadane)",
        description=desc,
        difficulty=6,
        category="bugfix",
        test_cases=tests,
        hints=["Vad händer om alla element är negativa? Initialisera med lst[0]"],
        tags=["bugfix", "edge_case", "kadane"],
    )


def _bugfix_wrong_return() -> Task:
    """Fibonacci that returns wrong value due to off-by-one."""
    cases = [(0, 0), (1, 1), (2, 1), (5, 5), (10, 55)]
    selected = random.sample(cases, 3)

    buggy_code = '''n = int(input())
if n == 0:
    print(0)
elif n == 1:
    print(1)
else:
    a, b = 0, 1
    for _ in range(n):  # BUG: should be range(n-1) or range(2, n+1)
        a, b = b, a + b
    print(b)  # Returns fib(n+1) instead of fib(n)'''

    desc = (
        f"Följande Fibonacci-implementation returnerar fel värde (fib(n+1) istället för fib(n)).\n"
        f"Fixa buggen. fib(0)=0, fib(1)=1, fib(2)=1, fib(5)=5, fib(10)=55.\n\n"
        f"Buggig kod:\n```\n{buggy_code}\n```"
    )

    tests = [TestCase(f"{n}\n", str(expected), f"fib({n})") for n, expected in selected]

    return Task(
        id=f"bugfix-fib-{random.randint(1000,9999)}",
        title="Fixa bugg: Fibonacci",
        description=desc,
        difficulty=4,
        category="bugfix",
        test_cases=tests,
        hints=["Räkna antalet iterationer i loopen noggrant"],
        tags=["bugfix", "off_by_one", "fibonacci"],
    )


def _bugfix_infinite_loop() -> Task:
    """GCD with potential infinite loop."""
    pairs = [(48, 18, 6), (100, 75, 25), (17, 13, 1), (0, 5, 5), (12, 8, 4)]
    selected = random.sample(pairs, 3)

    buggy_code = '''a, b = map(int, input().split())
while b != 0:
    a = a % b  # BUG: should be a, b = b, a % b
print(a)'''

    desc = (
        f"Följande GCD (Euclid's algorithm) har en bugg som gör att den "
        f"fastnar i en oändlig loop eller ger fel svar.\n"
        f"Fixa buggen. Input: två heltal på en rad. Output: deras GCD.\n\n"
        f"Buggig kod:\n```\n{buggy_code}\n```"
    )

    tests = [TestCase(f"{a} {b}\n", str(gcd), f"GCD({a},{b})") for a, b, gcd in selected]

    return Task(
        id=f"bugfix-gcd-{random.randint(1000,9999)}",
        title="Fixa bugg: GCD (Euclid)",
        description=desc,
        difficulty=4,
        category="bugfix",
        test_cases=tests,
        hints=["I Euclid's algoritm ska BÅDA variablerna uppdateras varje iteration"],
        tags=["bugfix", "infinite_loop", "gcd"],
    )


# ============================================================
# CODE REVIEW: Identify what's wrong and produce correct output
# ============================================================

def _gen_code_review() -> Task:
    """Generate a code review task."""
    problems = [
        _review_sort_stability,
        _review_memory_leak_pattern,
    ]
    return random.choice(problems)()


def _review_sort_stability() -> Task:
    """Test understanding of stable vs unstable sort."""
    n = random.randint(5, 8)
    items = [(random.choice(["A", "B", "C"]), random.randint(1, 5)) for _ in range(n)]
    # Stable sort by second element
    stable_sorted = sorted(items, key=lambda x: x[1])
    expected = "\n".join(f"{name} {val}" for name, val in stable_sorted)

    desc = (
        f"Läs N rader med 'namn värde'. Sortera raderna efter värde (stigande). "
        f"Om två rader har samma värde, behåll deras ursprungliga ordning (stabil sortering). "
        f"Skriv ut resultatet, en rad per element."
    )

    input_str = f"{n}\n" + "\n".join(f"{name} {val}" for name, val in items) + "\n"

    return Task(
        id=f"review-stable-sort-{random.randint(1000,9999)}",
        title="Stabil sortering",
        description=desc,
        difficulty=5,
        category="code_review",
        test_cases=[TestCase(input_str, expected, f"Stable sort n={n}")],
        hints=["Python's sorted() är stabil — använd key-parameter"],
        tags=["code_review", "sorting", "stability"],
    )


def _review_memory_leak_pattern() -> Task:
    """Simulate a resource management pattern."""
    n = random.randint(3, 6)
    ops = []
    open_resources = []
    log = []
    resource_id = 0

    for _ in range(n * 2):
        if not open_resources or (random.random() < 0.6 and len(open_resources) < 5):
            resource_id += 1
            ops.append(f"OPEN r{resource_id}")
            open_resources.append(f"r{resource_id}")
            log.append(f"opened r{resource_id}")
        else:
            r = random.choice(open_resources)
            ops.append(f"CLOSE {r}")
            open_resources.remove(r)
            log.append(f"closed {r}")

    # Remaining open = "leaked"
    leaked = sorted(open_resources)
    expected = " ".join(leaked) if leaked else "none"

    desc = (
        f"Läs N operationer. Varje rad är 'OPEN resurs' eller 'CLOSE resurs'.\n"
        f"Skriv ut alla resurser som öppnades men aldrig stängdes (läckta), "
        f"sorterade alfabetiskt, separerade med mellanslag. Om inga läcker, skriv 'none'."
    )

    input_str = f"{len(ops)}\n" + "\n".join(ops) + "\n"

    return Task(
        id=f"review-leak-{random.randint(1000,9999)}",
        title="Hitta resursläckor",
        description=desc,
        difficulty=5,
        category="code_review",
        test_cases=[TestCase(input_str, expected, f"Leak detection n={len(ops)}")],
        hints=["Håll koll på öppnade resurser i en set, ta bort vid CLOSE"],
        tags=["code_review", "resource_management", "debugging"],
    )


# ============================================================
# API DESIGN: Design a class/interface
# ============================================================

def _gen_api_design() -> Task:
    """Generate an API design task — implement a mini data structure."""
    problems = [
        _api_lru_cache,
        _api_event_emitter,
        _api_rate_limiter,
    ]
    return random.choice(problems)()


def _api_lru_cache() -> Task:
    """Implement a simple LRU cache."""
    ops = [
        ("PUT", "a", "1"), ("PUT", "b", "2"), ("GET", "a", ""),
        ("PUT", "c", "3"), ("PUT", "d", "4"),  # evicts b if capacity=3
        ("GET", "b", ""), ("GET", "c", ""),
        ("PUT", "e", "5"),  # evicts a or d depending on access
        ("GET", "a", ""), ("GET", "d", ""),
    ]
    capacity = 3

    # Simulate LRU
    cache = {}
    order = []
    outputs = []
    for op, key, val in ops:
        if op == "PUT":
            if key in cache:
                order.remove(key)
            elif len(cache) >= capacity:
                evicted = order.pop(0)
                del cache[evicted]
            cache[key] = val
            order.append(key)
        elif op == "GET":
            if key in cache:
                outputs.append(cache[key])
                order.remove(key)
                order.append(key)
            else:
                outputs.append("-1")

    input_lines = [f"{capacity}", f"{len(ops)}"]
    for op, key, val in ops:
        if op == "PUT":
            input_lines.append(f"PUT {key} {val}")
        else:
            input_lines.append(f"GET {key}")

    expected = "\n".join(outputs)

    desc = (
        f"Implementera en LRU Cache med kapacitet K.\n"
        f"Läs K, sedan N operationer:\n"
        f"- 'PUT key value': Lägg till/uppdatera. Om fullt, ta bort minst nyligen använda.\n"
        f"- 'GET key': Skriv ut värdet, eller '-1' om nyckeln inte finns.\n"
        f"GET uppdaterar 'senast använd'-ordningen."
    )

    return Task(
        id=f"api-lru-{random.randint(1000,9999)}",
        title="Implementera LRU Cache",
        description=desc,
        difficulty=7,
        category="api_design",
        test_cases=[TestCase("\n".join(input_lines) + "\n", expected, f"LRU cap={capacity}")],
        hints=["Använd OrderedDict eller en kombination av dict + lista"],
        tags=["api_design", "lru_cache", "data_structure"],
    )


def _api_event_emitter() -> Task:
    """Implement a simple event emitter."""
    ops = []
    listeners = {}  # event -> [handler_ids]
    outputs = []
    handler_id = 0

    events = ["click", "hover", "submit"]
    for _ in range(random.randint(8, 12)):
        r = random.random()
        event = random.choice(events)
        if r < 0.4:
            handler_id += 1
            ops.append(f"ON {event} h{handler_id}")
            listeners.setdefault(event, []).append(f"h{handler_id}")
        elif r < 0.7 and listeners.get(event):
            ops.append(f"EMIT {event}")
            handlers = listeners.get(event, [])
            if handlers:
                outputs.append(" ".join(handlers))
            else:
                outputs.append("none")
        elif r < 0.85 and listeners.get(event):
            h = random.choice(listeners[event])
            ops.append(f"OFF {event} {h}")
            listeners[event].remove(h)
        else:
            ops.append(f"EMIT {event}")
            handlers = listeners.get(event, [])
            if handlers:
                outputs.append(" ".join(handlers))
            else:
                outputs.append("none")

    input_lines = [str(len(ops))] + ops
    expected = "\n".join(outputs)

    desc = (
        f"Implementera en EventEmitter.\n"
        f"Läs N operationer:\n"
        f"- 'ON event handler': Registrera en lyssnare\n"
        f"- 'OFF event handler': Avregistrera en lyssnare\n"
        f"- 'EMIT event': Skriv ut alla registrerade lyssnare för eventet, "
        f"separerade med mellanslag (i registreringsordning). Om inga, skriv 'none'."
    )

    return Task(
        id=f"api-emitter-{random.randint(1000,9999)}",
        title="Implementera EventEmitter",
        description=desc,
        difficulty=6,
        category="api_design",
        test_cases=[TestCase("\n".join(input_lines) + "\n", expected, f"EventEmitter n={len(ops)}")],
        hints=["Använd en dict med listor för att spåra lyssnare per event"],
        tags=["api_design", "event_emitter", "design_pattern"],
    )


def _api_rate_limiter() -> Task:
    """Implement a simple rate limiter."""
    window = random.choice([5, 10])
    max_requests = random.choice([2, 3])

    # Generate requests at specific timestamps (ensure some spacing)
    timestamps = []
    t = 0
    for _ in range(random.randint(8, 12)):
        t += random.randint(1, 4)  # min gap of 1 to avoid ambiguity
        timestamps.append(t)

    # Simulate sliding window rate limiter — clean implementation
    allowed_timestamps: list[int] = []
    outputs = []
    for req_time in timestamps:
        # Count previously allowed requests still within the window
        count = sum(1 for at in allowed_timestamps if at >= req_time - window + 1)
        if count < max_requests:
            outputs.append("allow")
            allowed_timestamps.append(req_time)
        else:
            outputs.append("deny")

    input_lines = [f"{window} {max_requests}", str(len(timestamps))]
    input_lines.extend(str(t) for t in timestamps)
    expected = "\n".join(outputs)

    desc = (
        f"Implementera en sliding window rate limiter.\n"
        f"Läs W (fönsterstorlek) och M (max requests per fönster).\n"
        f"Sedan N timestamps (heltal, stigande ordning).\n"
        f"För varje request: skriv 'allow' om antalet tillåtna requests "
        f"i fönstret [t-W+1, t] är < M, annars 'deny'."
    )

    return Task(
        id=f"api-ratelimit-{random.randint(1000,9999)}",
        title="Implementera Rate Limiter",
        description=desc,
        difficulty=7,
        category="api_design",
        test_cases=[TestCase("\n".join(input_lines) + "\n", expected, f"RateLimit W={window} M={max_requests}")],
        hints=["Håll en lista med tillåtna timestamps, filtrera bort gamla"],
        tags=["api_design", "rate_limiter", "sliding_window"],
    )


# ============================================================
# OPTIMIZATION: Make slow code fast
# ============================================================

def _gen_optimization() -> Task:
    """Generate an optimization task."""
    problems = [
        _opt_two_sum_naive,
        _opt_duplicate_check,
    ]
    return random.choice(problems)()


def _opt_two_sum_naive() -> Task:
    """Optimize O(n²) two-sum to O(n) with hash map."""
    n = random.randint(100, 500)
    lst = random.sample(range(1, n * 3), n)
    i, j = sorted(random.sample(range(n), 2))
    target = lst[i] + lst[j]

    desc = (
        f"Hitta två index i en lista vars element summerar till ett målvärde.\n"
        f"Läs N, sedan N heltal, sedan målvärdet.\n"
        f"Skriv ut de två indexen (lägst först), separerade med mellanslag.\n\n"
        f"KRAV: Lösningen måste klara N={n} inom 2 sekunder.\n"
        f"En O(n²) brute-force-lösning kommer vara för långsam."
    )

    input_str = f"{n}\n" + "\n".join(str(x) for x in lst) + f"\n{target}\n"

    return Task(
        id=f"opt-twosum-{random.randint(1000,9999)}",
        title="Optimera: Two Sum (O(n))",
        description=desc,
        difficulty=6,
        category="optimization",
        test_cases=[TestCase(input_str, f"{i} {j}", f"Two sum n={n}")],
        hints=["Använd en hash map (dict) för O(1) lookup istället för nästlad loop"],
        tags=["optimization", "hash_map", "two_sum"],
    )


def _opt_duplicate_check() -> Task:
    """Check for duplicates efficiently."""
    n = random.randint(100, 300)
    lst = random.sample(range(1, n * 5), n)
    # Insert a duplicate
    dup_idx = random.randint(0, n - 2)
    dup_val = lst[dup_idx]
    insert_pos = random.randint(dup_idx + 1, n - 1)
    lst.insert(insert_pos, dup_val)

    desc = (
        f"Läs N heltal. Skriv ut det första talet som förekommer mer än en gång, "
        f"eller 'none' om alla är unika.\n\n"
        f"KRAV: Lösningen måste vara O(n), inte O(n²)."
    )

    input_str = f"{len(lst)}\n" + "\n".join(str(x) for x in lst) + "\n"

    return Task(
        id=f"opt-dup-{random.randint(1000,9999)}",
        title="Optimera: Hitta första duplikat",
        description=desc,
        difficulty=4,
        category="optimization",
        test_cases=[TestCase(input_str, str(dup_val), f"First dup in n={len(lst)}")],
        hints=["Använd en set för O(1) membership test"],
        tags=["optimization", "hash_set", "duplicate"],
    )


# ============================================================
# MULTI-STEP: Tasks requiring multiple coordinated operations
# ============================================================

def _gen_multi_step() -> Task:
    """Generate a multi-step task requiring planning."""
    problems = [
        _multi_parse_and_transform,
        _multi_state_machine,
    ]
    return random.choice(problems)()


def _multi_parse_and_transform() -> Task:
    """Parse structured input, transform, and output in different format."""
    n = random.randint(4, 8)
    students = []
    for _ in range(n):
        name = random.choice(["Alice", "Bob", "Charlie", "Diana", "Eve", "Frank", "Grace", "Hank"])
        grades = [random.randint(50, 100) for _ in range(3)]
        students.append((name, grades))

    # Task: parse CSV-like input, compute averages, sort by average desc, output as table
    input_lines = [str(n)]
    for name, grades in students:
        input_lines.append(f"{name} {' '.join(str(g) for g in grades)}")

    # Compute and sort
    with_avg = [(name, grades, sum(grades) / len(grades)) for name, grades in students]
    with_avg.sort(key=lambda x: -x[2])

    expected_lines = []
    for name, grades, avg in with_avg:
        expected_lines.append(f"{name} {avg:.1f}")

    desc = (
        f"Läs N rader med 'namn betyg1 betyg2 betyg3'.\n"
        f"Beräkna medelbetyget för varje student.\n"
        f"Sortera efter medelbetyg (högst först).\n"
        f"Skriv ut 'namn medel' per rad, med medel avrundat till 1 decimal."
    )

    return Task(
        id=f"multi-grades-{random.randint(1000,9999)}",
        title="Betygsrapport: Parse, beräkna, sortera",
        description=desc,
        difficulty=5,
        category="multi_step",
        test_cases=[TestCase("\n".join(input_lines) + "\n", "\n".join(expected_lines), f"Grades n={n}")],
        hints=["Läs alla rader, beräkna medel, sortera med key, formatera output"],
        tags=["multi_step", "parsing", "sorting", "formatting"],
    )


def _multi_state_machine() -> Task:
    """Implement a simple state machine."""
    states = ["IDLE", "RUNNING", "PAUSED", "STOPPED"]
    transitions = {
        ("IDLE", "START"): "RUNNING",
        ("RUNNING", "PAUSE"): "PAUSED",
        ("RUNNING", "STOP"): "STOPPED",
        ("PAUSED", "RESUME"): "RUNNING",
        ("PAUSED", "STOP"): "STOPPED",
        ("STOPPED", "RESET"): "IDLE",
    }

    commands = ["START", "PAUSE", "RESUME", "STOP", "RESET"]
    n = random.randint(6, 10)
    ops = []
    current = "IDLE"
    outputs = []

    for _ in range(n):
        cmd = random.choice(commands)
        ops.append(cmd)
        key = (current, cmd)
        if key in transitions:
            current = transitions[key]
            outputs.append(current)
        else:
            outputs.append(f"ERROR: invalid {cmd} in {current}")

    input_lines = [str(n)] + ops
    expected = "\n".join(outputs)

    desc = (
        f"Implementera en tillståndsmaskin med tillstånden: IDLE, RUNNING, PAUSED, STOPPED.\n"
        f"Giltiga övergångar:\n"
        f"- IDLE + START → RUNNING\n"
        f"- RUNNING + PAUSE → PAUSED\n"
        f"- RUNNING + STOP → STOPPED\n"
        f"- PAUSED + RESUME → RUNNING\n"
        f"- PAUSED + STOP → STOPPED\n"
        f"- STOPPED + RESET → IDLE\n\n"
        f"Läs N kommandon. För varje: skriv nytt tillstånd, eller "
        f"'ERROR: invalid CMD in STATE' om övergången är ogiltig.\n"
        f"Starttillstånd: IDLE."
    )

    return Task(
        id=f"multi-statemachine-{random.randint(1000,9999)}",
        title="Tillståndsmaskin",
        description=desc,
        difficulty=6,
        category="multi_step",
        test_cases=[TestCase("\n".join(input_lines) + "\n", expected, f"StateMachine n={n}")],
        hints=["Använd en dict med (state, command) → new_state"],
        tags=["multi_step", "state_machine", "design_pattern"],
    )


# ============================================================
# REGISTRY
# ============================================================

V2_GENERATORS = [
    (3, _gen_bugfix),
    (5, _gen_code_review),
    (6, _gen_api_design),
    (5, _gen_optimization),
    (5, _gen_multi_step),
]


def generate_v2_task(difficulty: int | None = None) -> Task:
    """Generate a Frankenstein 2.0 task (unknown to System 0)."""
    if difficulty is not None:
        eligible = [fn for d, fn in V2_GENERATORS if abs(d - difficulty) <= 2]
    else:
        eligible = [fn for _, fn in V2_GENERATORS]

    if not eligible:
        eligible = [fn for _, fn in V2_GENERATORS]

    gen_fn = random.choice(eligible)
    return gen_fn()
