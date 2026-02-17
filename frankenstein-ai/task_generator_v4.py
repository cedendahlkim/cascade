"""
Frankenstein 4.0 — Expanded Training Domains.

New task categories that broaden Frankenstein's capabilities beyond
pure algorithmic coding:

1. REGEX: Pattern matching, extraction, validation
2. JSON/DATA: Parse, transform, query structured data
3. SQL-LIKE: Query tabular data with filtering, grouping, joining
4. STATE MACHINES: Implement FSMs, parsers, protocol handlers
5. CONCURRENCY SIMULATION: Producer-consumer, scheduling, deadlock detection
6. DESIGN PATTERNS: Implement common OOP patterns
7. BIT MANIPULATION: Bitwise operations, encoding, compression
8. MATH ADVANCED: Modular arithmetic, matrix ops, probability
9. TEXT PROCESSING: NLP-lite tasks (tokenize, frequency, similarity)
10. SYSTEM DESIGN: Rate limiters, caches, load balancers
"""

import random
import json
import re
import math
import string
from collections import Counter
from programming_env import Task, TestCase


# ============================================================
# 1. REGEX — Pattern matching and extraction
# ============================================================

def _gen_regex_email_extract() -> Task:
    """Extract emails from text."""
    domains = ["gmail.com", "yahoo.se", "company.org", "test.io", "uni.edu"]
    names = ["alice", "bob.smith", "charlie_99", "dev-team", "info"]
    
    tests = []
    for _ in range(4):
        n_emails = random.randint(1, 4)
        emails = [f"{random.choice(names)}{random.randint(1,99)}@{random.choice(domains)}" for _ in range(n_emails)]
        noise_words = ["kontakta", "oss", "pa", "eller", "skicka", "till", "och", "via"]
        parts = []
        for e in emails:
            parts.append(" ".join(random.sample(noise_words, random.randint(1, 3))))
            parts.append(e)
        parts.append(random.choice(noise_words))
        text = " ".join(parts)
        expected = " ".join(sorted(set(emails)))
        tests.append(TestCase(f"{text}\n", expected, f"Emails in: {text[:60]}..."))

    return Task(
        id=f"gen-regex-email-{random.randint(1000,9999)}",
        title="Regex: Extrahera e-postadresser",
        description=(
            "Läs en rad text. Extrahera alla e-postadresser (format: namn@domän.tld). "
            "Skriv ut dem sorterade, separerade med mellanslag. Inga dubbletter."
        ),
        difficulty=5, category="regex",
        test_cases=tests,
        hints=["Använd re.findall med mönster r'[\\w.-]+@[\\w.-]+'"],
        tags=["regex", "email", "extraction"],
    )


def _gen_regex_validate() -> Task:
    """Validate strings against patterns."""
    validators = [
        ("ipv4", "IPv4-adress (x.x.x.x där x=0-255)",
         lambda s: "yes" if re.match(r'^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$', s) and all(0 <= int(g) <= 255 for g in re.match(r'^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$', s).groups()) else "no",
         ["192.168.1.1", "10.0.0.0", "256.1.1.1", "1.2.3", "0.0.0.0", "255.255.255.255", "abc.def.ghi.jkl", "1.2.3.4.5"]),
        ("date", "Datum (YYYY-MM-DD)",
         lambda s: "yes" if re.match(r'^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$', s) else "no",
         ["2025-01-15", "2025-13-01", "2025-00-10", "2025-12-31", "25-01-01", "2025-1-1", "2025-02-30", "abcd-ef-gh"]),
        ("hex_color", "Hexadecimal färgkod (#RRGGBB eller #RGB)",
         lambda s: "yes" if re.match(r'^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$', s) else "no",
         ["#FF0000", "#abc", "#1234567", "#GGG", "#000", "#ABCDEF", "FF0000", "#12"]),
    ]
    name, desc, fn, examples = random.choice(validators)
    
    tests = []
    for ex in random.sample(examples, min(4, len(examples))):
        tests.append(TestCase(f"{ex}\n", fn(ex), f"'{ex}' -> {fn(ex)}"))

    return Task(
        id=f"gen-regex-validate-{name}-{random.randint(1000,9999)}",
        title=f"Regex: Validera {desc}",
        description=f"Läs en sträng. Skriv 'yes' om den är en giltig {desc}, annars 'no'.",
        difficulty=5, category="regex",
        test_cases=tests,
        hints=["Använd re.match() med ett noggrant mönster"],
        tags=["regex", "validation", name],
    )


def _gen_regex_replace() -> Task:
    """Search and replace with regex."""
    tasks = [
        ("censor_numbers", "Ersätt alla siffror med *",
         lambda s: re.sub(r'\d', '*', s),
         ["Ring 08-123456", "Pris: 99kr", "Konto 1234-5678", "Ingen siffra har"]),
        ("camel_to_snake", "Konvertera camelCase till snake_case",
         lambda s: re.sub(r'(?<!^)(?=[A-Z])', '_', s).lower(),
         ["camelCase", "myVariableName", "HTMLParser", "simple", "getHTTPResponse"]),
        ("remove_html", "Ta bort alla HTML-taggar",
         lambda s: re.sub(r'<[^>]+>', '', s),
         ["<b>hello</b>", "<p>text</p>", "no tags", "<div class='x'>content</div>", "<br/>"]),
    ]
    name, desc, fn, examples = random.choice(tasks)
    
    tests = []
    for ex in random.sample(examples, min(4, len(examples))):
        tests.append(TestCase(f"{ex}\n", fn(ex), f"'{ex}' -> '{fn(ex)}'"))

    return Task(
        id=f"gen-regex-replace-{name}-{random.randint(1000,9999)}",
        title=f"Regex: {desc}",
        description=f"Läs en sträng. {desc}. Skriv ut resultatet.",
        difficulty=5, category="regex",
        test_cases=tests,
        hints=["Använd re.sub()"],
        tags=["regex", "replace", name],
    )


# ============================================================
# 2. JSON/DATA — Parse and transform structured data
# ============================================================

def _gen_json_query() -> Task:
    """Query JSON data."""
    n_people = random.randint(4, 7)
    names = random.sample(["Alice", "Bob", "Charlie", "Diana", "Eve", "Frank", "Grace", "Hank"], n_people)
    ages = [random.randint(18, 65) for _ in range(n_people)]
    cities = [random.choice(["Stockholm", "Goteborg", "Malmo", "Uppsala", "Lund"]) for _ in range(n_people)]
    
    people = [{"name": n, "age": a, "city": c} for n, a, c in zip(names, ages, cities)]
    
    queries = [
        ("oldest", "Hitta den äldsta personens namn",
         lambda p: max(p, key=lambda x: x["age"])["name"]),
        ("avg_age", "Beräkna medelåldern (avrundat till heltal)",
         lambda p: str(round(sum(x["age"] for x in p) / len(p)))),
        ("count_city", "Räkna hur många som bor i den vanligaste staden. Skriv 'stad antal'",
         lambda p: (lambda c: f"{c[0][0]} {c[0][1]}")(Counter(x["city"] for x in p).most_common(1))),
    ]
    qname, qdesc, qfn = random.choice(queries)
    
    json_str = json.dumps(people, ensure_ascii=False)
    expected = qfn(people)
    
    tests = []
    for _ in range(3):
        p2 = [{"name": n, "age": random.randint(18, 65), "city": random.choice(cities)} for n in names]
        j2 = json.dumps(p2, ensure_ascii=False)
        tests.append(TestCase(f"{j2}\n", qfn(p2), f"Query: {qname}"))
    tests.insert(0, TestCase(f"{json_str}\n", expected, f"Query: {qname}"))

    return Task(
        id=f"gen-json-{qname}-{random.randint(1000,9999)}",
        title=f"JSON: {qdesc}",
        description=(
            f"Läs en rad JSON (en lista med objekt som har 'name', 'age', 'city'). "
            f"{qdesc}."
        ),
        difficulty=6, category="json_data",
        test_cases=tests,
        hints=["Använd json.loads() för att parsa, sedan bearbeta listan"],
        tags=["json", "data", qname],
    )


def _gen_csv_transform() -> Task:
    """Parse and transform CSV-like data."""
    n_rows = random.randint(3, 6)
    products = random.sample(["Apple", "Banana", "Cherry", "Date", "Elderberry", "Fig", "Grape"], n_rows)
    prices = [round(random.uniform(5, 50), 2) for _ in range(n_rows)]
    quantities = [random.randint(1, 20) for _ in range(n_rows)]
    
    header = "product,price,quantity"
    rows = [f"{p},{pr},{q}" for p, pr, q in zip(products, prices, quantities)]
    input_str = f"{header}\n" + "\n".join(rows) + "\n"
    
    # Total value per product, sorted by value descending
    values = [(p, round(pr * q, 2)) for p, pr, q in zip(products, prices, quantities)]
    values.sort(key=lambda x: -x[1])
    expected = "\n".join(f"{p} {v}" for p, v in values)
    
    tests = [TestCase(input_str, expected, "CSV transform")]
    
    # Generate more test cases
    for _ in range(2):
        n2 = random.randint(3, 5)
        prods2 = random.sample(products + ["Kiwi", "Lemon"], n2)
        pr2 = [round(random.uniform(5, 50), 2) for _ in range(n2)]
        q2 = [random.randint(1, 20) for _ in range(n2)]
        h2 = "product,price,quantity"
        r2 = [f"{p},{pr},{q}" for p, pr, q in zip(prods2, pr2, q2)]
        inp2 = f"{h2}\n" + "\n".join(r2) + "\n"
        v2 = [(p, round(pr * q, 2)) for p, pr, q in zip(prods2, pr2, q2)]
        v2.sort(key=lambda x: -x[1])
        exp2 = "\n".join(f"{p} {v}" for p, v in v2)
        tests.append(TestCase(inp2, exp2, "CSV transform"))

    return Task(
        id=f"gen-csv-transform-{random.randint(1000,9999)}",
        title="Data: CSV total-värde per produkt",
        description=(
            "Läs CSV-data (header: product,price,quantity, sedan rader). "
            "Beräkna totalvärde (price * quantity) per produkt. "
            "Skriv ut 'produkt totalvärde' sorterat efter totalvärde (störst först), ett per rad."
        ),
        difficulty=6, category="json_data",
        test_cases=tests,
        hints=["Parsa header, splitta rader på komma, beräkna och sortera"],
        tags=["csv", "data", "transform"],
    )


# ============================================================
# 3. STATE MACHINES — Implement FSMs and parsers
# ============================================================

def _gen_state_machine_parser() -> Task:
    """Implement a simple state machine parser."""
    # Balanced parentheses checker with state tracking
    test_strings = [
        ("(())", "yes"),
        ("(()", "no"),
        ("()()", "yes"),
        (")(", "no"),
        ("", "yes"),
        ("(((())))", "yes"),
        ("(())(", "no"),
        ("((())())", "yes"),
    ]
    
    tests = [TestCase(f"{s}\n", exp, f"'{s}' -> {exp}") for s, exp in random.sample(test_strings, 4)]

    return Task(
        id=f"gen-fsm-parens-{random.randint(1000,9999)}",
        title="FSM: Balanserade parenteser",
        description=(
            "Läs en sträng med parenteser. Skriv 'yes' om parenteserna är balanserade, annars 'no'. "
            "En tom sträng räknas som balanserad."
        ),
        difficulty=4, category="state_machine",
        test_cases=tests,
        hints=["Använd en räknare: +1 för '(', -1 för ')'. Om den blir negativ → ej balanserad."],
        tags=["state_machine", "parser", "parentheses"],
    )


def _gen_state_machine_tokenizer() -> Task:
    """Tokenize a simple expression."""
    expressions = [
        ("3+4*2", "NUM:3 OP:+ NUM:4 OP:* NUM:2"),
        ("10-5", "NUM:10 OP:- NUM:5"),
        ("100/25+3", "NUM:100 OP:/ NUM:25 OP:+ NUM:3"),
        ("42", "NUM:42"),
        ("1+2+3+4", "NUM:1 OP:+ NUM:2 OP:+ NUM:3 OP:+ NUM:4"),
        ("99*0", "NUM:99 OP:* NUM:0"),
    ]
    
    tests = [TestCase(f"{expr}\n", tokens, f"'{expr}'") for expr, tokens in random.sample(expressions, 4)]

    return Task(
        id=f"gen-fsm-tokenizer-{random.randint(1000,9999)}",
        title="FSM: Tokenisera matematiskt uttryck",
        description=(
            "Läs ett matematiskt uttryck (bara heltal och +-*/). "
            "Tokenisera det och skriv ut tokens separerade med mellanslag. "
            "Format: NUM:värde för tal, OP:tecken för operatorer."
        ),
        difficulty=6, category="state_machine",
        test_cases=tests,
        hints=["Iterera tecken för tecken, bygg upp tal-tokens tills du hittar en operator"],
        tags=["state_machine", "tokenizer", "parser"],
    )


def _gen_state_machine_protocol() -> Task:
    """Simulate a simple protocol state machine."""
    # HTTP-like request state machine
    # States: IDLE -> REQUEST_LINE -> HEADERS -> BODY -> DONE
    test_cases_data = [
        ("GET /index.html HTTP/1.1\nHost: example.com\n\nHello", "method:GET path:/index.html headers:1 body:5"),
        ("POST /api HTTP/1.1\nContent-Type: json\nAuth: token\n\n{}", "method:POST path:/api headers:2 body:2"),
        ("GET / HTTP/1.1\n\n", "method:GET path:/ headers:0 body:0"),
    ]
    
    tests = [TestCase(f"{req}\n", exp, f"Request parse") for req, exp in test_cases_data]

    return Task(
        id=f"gen-fsm-protocol-{random.randint(1000,9999)}",
        title="FSM: Parsa HTTP-liknande request",
        description=(
            "Läs rader tills EOF. Första raden är 'METHOD PATH HTTP/1.1'. "
            "Sedan headers (nyckel: värde) tills en tom rad. Resten är body. "
            "Skriv ut: 'method:X path:Y headers:N body:L' där N=antal headers, L=body-längd i tecken."
        ),
        difficulty=7, category="state_machine",
        test_cases=tests,
        hints=["Läs alla rader, parsa första raden, räkna headers tills tom rad, resten är body"],
        tags=["state_machine", "protocol", "http"],
    )


# ============================================================
# 4. BIT MANIPULATION
# ============================================================

def _gen_bit_count() -> Task:
    """Count set bits (popcount)."""
    tests = []
    for _ in range(4):
        n = random.randint(0, 1023)
        tests.append(TestCase(f"{n}\n", str(bin(n).count('1')), f"popcount({n}) = {bin(n).count('1')}"))

    return Task(
        id=f"gen-bit-count-{random.randint(1000,9999)}",
        title="Bitar: Räkna ettbitar",
        description="Läs ett heltal n (0 ≤ n ≤ 1023). Skriv ut antalet 1-bitar i dess binärrepresentation.",
        difficulty=3, category="bit_manipulation",
        test_cases=tests,
        hints=["Använd bin(n).count('1') eller bitvis AND-loop"],
        tags=["bit", "popcount", "binary"],
    )


def _gen_bit_operations() -> Task:
    """Bitwise operations."""
    ops = [
        ("xor_swap", "XOR-swap: Byt plats på två tal utan temp-variabel",
         lambda a, b: f"{b} {a}",
         lambda: (random.randint(1, 100), random.randint(1, 100))),
        ("power_of_two", "Kolla om talet är en tvåpotens",
         lambda n, _: "yes" if n > 0 and (n & (n - 1)) == 0 else "no",
         lambda: (random.choice([1, 2, 4, 8, 16, 32, 64, 3, 5, 6, 7, 10, 12, 15, 100]), 0)),
        ("toggle_bit", "Toggla bit k i talet n. Skriv ut resultatet.",
         lambda n, k: str(n ^ (1 << k)),
         lambda: (random.randint(0, 255), random.randint(0, 7))),
    ]
    name, desc, fn, gen_args = random.choice(ops)
    
    tests = []
    for _ in range(4):
        a, b = gen_args()
        if name == "toggle_bit":
            tests.append(TestCase(f"{a}\n{b}\n", fn(a, b), f"toggle bit {b} in {a}"))
        elif name == "power_of_two":
            tests.append(TestCase(f"{a}\n", fn(a, b), f"is_power_of_two({a})"))
        else:
            tests.append(TestCase(f"{a}\n{b}\n", fn(a, b), f"{name}({a}, {b})"))

    return Task(
        id=f"gen-bit-{name}-{random.randint(1000,9999)}",
        title=f"Bitar: {desc.split('.')[0]}",
        description=f"Läs input. {desc}.",
        difficulty=4, category="bit_manipulation",
        test_cases=tests,
        hints=["Använd &, |, ^, <<, >> operatorer"],
        tags=["bit", name],
    )


def _gen_bit_encoding() -> Task:
    """Simple bit encoding/decoding."""
    tests = []
    for _ in range(4):
        msg = "".join(random.choices(string.ascii_lowercase, k=random.randint(3, 8)))
        # Simple XOR cipher with key
        key = random.randint(1, 255)
        encrypted = " ".join(str(ord(c) ^ key) for c in msg)
        tests.append(TestCase(f"{encrypted}\n{key}\n", msg, f"XOR decrypt '{msg}' with key={key}"))

    return Task(
        id=f"gen-bit-xor-cipher-{random.randint(1000,9999)}",
        title="Bitar: XOR-dekryptering",
        description=(
            "Läs en rad med mellanrumseparerade heltal (krypterade bytes), "
            "sedan en nyckel (heltal). Dekryptera genom att XOR:a varje byte med nyckeln. "
            "Skriv ut den dekrypterade strängen."
        ),
        difficulty=5, category="bit_manipulation",
        test_cases=tests,
        hints=["chr(byte ^ key) för varje byte"],
        tags=["bit", "xor", "cipher", "encoding"],
    )


# ============================================================
# 5. TEXT PROCESSING — NLP-lite
# ============================================================

def _gen_text_frequency() -> Task:
    """Word frequency analysis."""
    texts = [
        "the cat sat on the mat the cat",
        "hello world hello hello world",
        "one two three one two one",
        "python is great python is fun python",
        "a b c a b a",
    ]
    
    tests = []
    for text in random.sample(texts, 4):
        words = text.lower().split()
        freq = Counter(words)
        # Top 3 most common, sorted by count desc then alphabetically
        top = sorted(freq.items(), key=lambda x: (-x[1], x[0]))[:3]
        expected = " ".join(f"{w}:{c}" for w, c in top)
        tests.append(TestCase(f"{text}\n", expected, f"Freq of: {text[:40]}"))

    return Task(
        id=f"gen-text-freq-{random.randint(1000,9999)}",
        title="Text: Ordfrekvensanalys",
        description=(
            "Läs en rad text. Räkna ordfrekvenser (case-insensitive). "
            "Skriv ut de 3 vanligaste orden i format 'ord:antal', separerade med mellanslag. "
            "Sortera efter antal (störst först), vid lika antal sortera alfabetiskt."
        ),
        difficulty=5, category="text_processing",
        test_cases=tests,
        hints=["Använd collections.Counter och .most_common()"],
        tags=["text", "frequency", "nlp"],
    )


def _gen_text_similarity() -> Task:
    """Compute text similarity (Jaccard)."""
    pairs = [
        ("the cat sat", "the cat ran", "0.50"),
        ("hello world", "hello world", "1.00"),
        ("abc def", "ghi jkl", "0.00"),
        ("python java c", "python ruby c", "0.50"),
        ("a b c d", "a b e f", "0.33"),
    ]
    
    def jaccard(s1, s2):
        w1 = set(s1.lower().split())
        w2 = set(s2.lower().split())
        if not w1 and not w2:
            return "1.00"
        inter = len(w1 & w2)
        union = len(w1 | w2)
        return f"{inter/union:.2f}"
    
    tests = []
    for s1, s2, _ in random.sample(pairs, 4):
        tests.append(TestCase(f"{s1}\n{s2}\n", jaccard(s1, s2), f"Jaccard('{s1}', '{s2}')"))

    return Task(
        id=f"gen-text-jaccard-{random.randint(1000,9999)}",
        title="Text: Jaccard-likhet",
        description=(
            "Läs två rader text. Beräkna Jaccard-likheten mellan ordmängderna "
            "(|intersection| / |union|). Skriv ut resultatet med 2 decimaler."
        ),
        difficulty=6, category="text_processing",
        test_cases=tests,
        hints=["Konvertera till set av ord, beräkna intersection och union"],
        tags=["text", "similarity", "jaccard"],
    )


def _gen_text_caesar() -> Task:
    """Caesar cipher encode/decode."""
    tests = []
    for _ in range(4):
        msg = "".join(random.choices(string.ascii_lowercase, k=random.randint(5, 12)))
        shift = random.randint(1, 25)
        encrypted = "".join(chr((ord(c) - ord('a') + shift) % 26 + ord('a')) for c in msg)
        tests.append(TestCase(f"{encrypted}\n{shift}\n", msg, f"Decrypt '{encrypted}' shift={shift}"))

    return Task(
        id=f"gen-text-caesar-{random.randint(1000,9999)}",
        title="Text: Caesar-dekryptering",
        description=(
            "Läs en krypterad sträng (bara gemener a-z) och ett skiftvärde. "
            "Dekryptera genom att skifta varje tecken bakåt. Skriv ut den dekrypterade strängen."
        ),
        difficulty=4, category="text_processing",
        test_cases=tests,
        hints=["chr((ord(c) - ord('a') - shift) % 26 + ord('a'))"],
        tags=["text", "caesar", "cipher"],
    )


# ============================================================
# 6. MATH ADVANCED — Modular arithmetic, probability
# ============================================================

def _gen_modular_arithmetic() -> Task:
    """Modular exponentiation."""
    tests = []
    for _ in range(4):
        base = random.randint(2, 20)
        exp = random.randint(5, 50)
        mod = random.choice([7, 11, 13, 17, 19, 23, 29, 31, 37])
        result = pow(base, exp, mod)
        tests.append(TestCase(f"{base}\n{exp}\n{mod}\n", str(result), f"{base}^{exp} mod {mod} = {result}"))

    return Task(
        id=f"gen-math-modexp-{random.randint(1000,9999)}",
        title="Matematik: Modulär exponentiering",
        description=(
            "Läs tre heltal: base, exp, mod. "
            "Beräkna (base^exp) mod mod effektivt. Skriv ut resultatet."
        ),
        difficulty=6, category="math_advanced",
        test_cases=tests,
        hints=["Använd pow(base, exp, mod) eller implementera square-and-multiply"],
        tags=["math", "modular", "exponentiation"],
    )


def _gen_matrix_multiply() -> Task:
    """Matrix multiplication."""
    tests = []
    for _ in range(3):
        r1, c1 = random.randint(2, 3), random.randint(2, 3)
        c2 = random.randint(2, 3)
        A = [[random.randint(-5, 5) for _ in range(c1)] for _ in range(r1)]
        B = [[random.randint(-5, 5) for _ in range(c2)] for _ in range(c1)]
        
        # Compute C = A * B
        C = [[sum(A[i][k] * B[k][j] for k in range(c1)) for j in range(c2)] for i in range(r1)]
        
        input_lines = [f"{r1} {c1}"]
        for row in A:
            input_lines.append(" ".join(str(x) for x in row))
        input_lines.append(f"{c1} {c2}")
        for row in B:
            input_lines.append(" ".join(str(x) for x in row))
        
        expected_lines = [" ".join(str(x) for x in row) for row in C]
        
        tests.append(TestCase(
            "\n".join(input_lines) + "\n",
            "\n".join(expected_lines),
            f"Matrix {r1}x{c1} * {c1}x{c2}"
        ))

    return Task(
        id=f"gen-math-matmul-{random.randint(1000,9999)}",
        title="Matematik: Matrismultiplikation",
        description=(
            "Läs matris A (r1 c1, sedan r1 rader med c1 tal) och matris B (c1 c2, sedan c1 rader med c2 tal). "
            "Beräkna C = A * B. Skriv ut C (r1 rader med c2 tal, separerade med mellanslag)."
        ),
        difficulty=7, category="math_advanced",
        test_cases=tests,
        hints=["C[i][j] = sum(A[i][k] * B[k][j] for k in range(c1))"],
        tags=["math", "matrix", "multiplication"],
    )


def _gen_gcd_lcm() -> Task:
    """GCD and LCM of multiple numbers."""
    tests = []
    for _ in range(4):
        n = random.randint(2, 5)
        nums = [random.randint(2, 100) for _ in range(n)]
        
        g = nums[0]
        for x in nums[1:]:
            g = math.gcd(g, x)
        
        l = nums[0]
        for x in nums[1:]:
            l = l * x // math.gcd(l, x)
        
        input_str = f"{n}\n" + "\n".join(str(x) for x in nums) + "\n"
        tests.append(TestCase(input_str, f"{g} {l}", f"GCD/LCM of {nums}"))

    return Task(
        id=f"gen-math-gcdlcm-{random.randint(1000,9999)}",
        title="Matematik: GCD och LCM av N tal",
        description=(
            "Läs N, sedan N heltal. Beräkna GCD (största gemensamma delare) och LCM "
            "(minsta gemensamma multipel) av alla talen. Skriv ut 'GCD LCM'."
        ),
        difficulty=5, category="math_advanced",
        test_cases=tests,
        hints=["Använd math.gcd iterativt. LCM(a,b) = a*b // gcd(a,b)"],
        tags=["math", "gcd", "lcm"],
    )


# ============================================================
# 7. SYSTEM DESIGN — Rate limiters, caches, schedulers
# ============================================================

def _gen_lru_cache() -> Task:
    """Implement LRU cache simulation."""
    tests = []
    for _ in range(3):
        capacity = random.randint(2, 4)
        n_ops = random.randint(6, 10)
        ops = []
        cache = {}
        order = []
        outputs = []
        
        for _ in range(n_ops):
            if random.random() < 0.6 or not cache:
                # PUT
                key = random.choice("ABCDEFGH")
                val = random.randint(1, 99)
                ops.append(f"PUT {key} {val}")
                if key in cache:
                    order.remove(key)
                elif len(cache) >= capacity:
                    evicted = order.pop(0)
                    del cache[evicted]
                cache[key] = val
                order.append(key)
            else:
                # GET
                key = random.choice(list("ABCDEFGH"))
                ops.append(f"GET {key}")
                if key in cache:
                    outputs.append(str(cache[key]))
                    order.remove(key)
                    order.append(key)
                else:
                    outputs.append("-1")
        
        input_str = f"{capacity}\n{n_ops}\n" + "\n".join(ops) + "\n"
        expected = "\n".join(outputs) if outputs else "EMPTY"
        tests.append(TestCase(input_str, expected, f"LRU cap={capacity}, {n_ops} ops"))

    return Task(
        id=f"gen-sys-lru-{random.randint(1000,9999)}",
        title="System: LRU Cache",
        description=(
            "Implementera en LRU (Least Recently Used) cache. "
            "Läs capacity, sedan N operationer:\n"
            "- 'PUT key value': Lägg till/uppdatera. Om full, ta bort minst nyligen använda.\n"
            "- 'GET key': Skriv ut värdet, eller -1 om det inte finns.\n"
            "Skriv ut alla GET-resultat, ett per rad. Om inga GET: skriv 'EMPTY'."
        ),
        difficulty=7, category="system_design",
        test_cases=tests,
        hints=["Använd OrderedDict eller dict + lista för ordning"],
        tags=["system", "cache", "lru"],
    )


def _gen_rate_limiter() -> Task:
    """Simulate a rate limiter."""
    tests = []
    for _ in range(3):
        max_requests = random.randint(2, 5)
        window_size = random.randint(5, 10)
        n_events = random.randint(6, 12)
        
        events = []
        t = 0
        for _ in range(n_events):
            t += random.randint(0, 3)
            user = random.choice(["A", "B", "C"])
            events.append((t, user))
        
        # Simulate
        user_windows = {}
        outputs = []
        for timestamp, user in events:
            if user not in user_windows:
                user_windows[user] = []
            # Remove old requests outside window
            user_windows[user] = [ts for ts in user_windows[user] if ts > timestamp - window_size]
            if len(user_windows[user]) < max_requests:
                user_windows[user].append(timestamp)
                outputs.append("ALLOW")
            else:
                outputs.append("DENY")
        
        input_lines = [f"{max_requests} {window_size}", str(n_events)]
        for t, u in events:
            input_lines.append(f"{t} {u}")
        
        tests.append(TestCase(
            "\n".join(input_lines) + "\n",
            "\n".join(outputs),
            f"Rate limit: {max_requests}/{window_size}s, {n_events} events"
        ))

    return Task(
        id=f"gen-sys-ratelimit-{random.randint(1000,9999)}",
        title="System: Rate Limiter",
        description=(
            "Implementera en sliding window rate limiter. "
            "Läs max_requests och window_size (sekunder), sedan N events (timestamp user). "
            "För varje event: skriv 'ALLOW' om användaren har färre än max_requests inom fönstret, "
            "annars 'DENY'."
        ),
        difficulty=7, category="system_design",
        test_cases=tests,
        hints=["Håll en lista med timestamps per user, filtrera bort gamla"],
        tags=["system", "rate_limiter", "sliding_window"],
    )


def _gen_task_scheduler() -> Task:
    """Simulate a simple task scheduler."""
    tests = []
    for _ in range(3):
        n_tasks = random.randint(3, 6)
        tasks = []
        for i in range(n_tasks):
            name = chr(65 + i)  # A, B, C, ...
            duration = random.randint(1, 5)
            priority = random.randint(1, 10)
            tasks.append((name, duration, priority))
        
        # Schedule by priority (highest first), then by name
        scheduled = sorted(tasks, key=lambda x: (-x[2], x[0]))
        
        time_cursor = 0
        output_lines = []
        for name, duration, priority in scheduled:
            start = time_cursor
            end = start + duration
            output_lines.append(f"{name} {start}-{end}")
            time_cursor = end
        
        input_lines = [str(n_tasks)]
        for name, duration, priority in tasks:
            input_lines.append(f"{name} {duration} {priority}")
        
        tests.append(TestCase(
            "\n".join(input_lines) + "\n",
            "\n".join(output_lines),
            f"Schedule {n_tasks} tasks"
        ))

    return Task(
        id=f"gen-sys-scheduler-{random.randint(1000,9999)}",
        title="System: Uppgiftsschemaläggare",
        description=(
            "Läs N uppgifter (namn duration prioritet). "
            "Schemalägg dem i prioritetsordning (högst först, vid lika → alfabetiskt). "
            "Skriv ut 'namn start-slut' per uppgift, ett per rad."
        ),
        difficulty=6, category="system_design",
        test_cases=tests,
        hints=["Sortera efter (-priority, name), sedan beräkna start/slut sekventiellt"],
        tags=["system", "scheduler", "priority"],
    )


# ============================================================
# 8. CONCURRENCY SIMULATION
# ============================================================

def _gen_deadlock_detection() -> Task:
    """Detect deadlock in resource allocation graph."""
    tests = []
    for _ in range(3):
        n_procs = random.randint(2, 4)
        n_res = random.randint(2, 4)
        
        # Generate allocation and request matrices
        # Randomly decide if deadlock exists
        has_deadlock = random.choice([True, False])
        
        if has_deadlock:
            # Create circular wait: P0 holds R0, wants R1; P1 holds R1, wants R0
            alloc = [[0] * n_res for _ in range(n_procs)]
            request = [[0] * n_res for _ in range(n_procs)]
            for i in range(min(n_procs, n_res)):
                alloc[i][i] = 1
                request[i][(i + 1) % n_res] = 1
        else:
            # No deadlock: at least one process can finish
            alloc = [[0] * n_res for _ in range(n_procs)]
            request = [[0] * n_res for _ in range(n_procs)]
            available = [1] * n_res
            # First process holds nothing, requests something available
            request[0][0] = 1
            for i in range(1, n_procs):
                if random.random() < 0.5:
                    r = random.randint(0, n_res - 1)
                    alloc[i][r] = 1
                    available[r] = max(0, available[r] - 1)
        
        # Detect deadlock using banker's algorithm simplified
        avail = [0] * n_res
        # Available = total - allocated
        total = [sum(alloc[i][j] for i in range(n_procs)) for j in range(n_res)]
        # For simplicity, total resources = allocated + 1 per resource
        total_res = [t + 1 for t in total]
        avail = [total_res[j] - total[j] for j in range(n_res)]
        
        # Run safety check
        finish = [False] * n_procs
        work = avail[:]
        changed = True
        while changed:
            changed = False
            for i in range(n_procs):
                if not finish[i] and all(request[i][j] <= work[j] for j in range(n_res)):
                    finish[i] = True
                    for j in range(n_res):
                        work[j] += alloc[i][j]
                    changed = True
        
        deadlocked = [i for i in range(n_procs) if not finish[i]]
        expected = " ".join(f"P{i}" for i in deadlocked) if deadlocked else "SAFE"
        
        input_lines = [f"{n_procs} {n_res}"]
        input_lines.append(" ".join(str(x) for x in total_res))
        for i in range(n_procs):
            input_lines.append(" ".join(str(x) for x in alloc[i]) + " | " + " ".join(str(x) for x in request[i]))
        
        tests.append(TestCase(
            "\n".join(input_lines) + "\n",
            expected,
            f"Deadlock: {n_procs} procs, {n_res} res"
        ))

    return Task(
        id=f"gen-conc-deadlock-{random.randint(1000,9999)}",
        title="Concurrency: Deadlock-detektion",
        description=(
            "Implementera Banker's safety algorithm. "
            "Läs P (processer) och R (resurser), sedan total resurser per typ, "
            "sedan P rader med 'allokering | request' (R tal vardera). "
            "Available = total - sum(allokering). "
            "Kör safety-check: hitta processer som kan avslutas (request <= available), "
            "frigör deras resurser, upprepa. "
            "Skriv ut deadlockade processer (P0 P1 ...) eller 'SAFE'."
        ),
        difficulty=8, category="concurrency",
        test_cases=tests,
        hints=["Banker's algorithm: iterera tills ingen process kan avslutas"],
        tags=["concurrency", "deadlock", "banker"],
    )


# ============================================================
# 9. DESIGN PATTERNS
# ============================================================

def _gen_observer_pattern() -> Task:
    """Simulate observer pattern."""
    tests = []
    for _ in range(3):
        n_ops = random.randint(5, 10)
        subscribers = {}
        outputs = []
        ops = []
        
        for _ in range(n_ops):
            op_type = random.choice(["SUB", "UNSUB", "PUB", "PUB"])
            if op_type == "SUB":
                name = random.choice(["Alice", "Bob", "Charlie", "Diana"])
                topic = random.choice(["news", "sports", "tech"])
                ops.append(f"SUB {name} {topic}")
                subscribers.setdefault(topic, set()).add(name)
            elif op_type == "UNSUB":
                name = random.choice(["Alice", "Bob", "Charlie", "Diana"])
                topic = random.choice(["news", "sports", "tech"])
                ops.append(f"UNSUB {name} {topic}")
                subscribers.get(topic, set()).discard(name)
            else:
                topic = random.choice(["news", "sports", "tech"])
                msg = f"msg{random.randint(1,99)}"
                ops.append(f"PUB {topic} {msg}")
                subs = sorted(subscribers.get(topic, set()))
                if subs:
                    outputs.append(f"{topic}:{msg}->" + ",".join(subs))
                else:
                    outputs.append(f"{topic}:{msg}->NONE")
        
        input_str = f"{n_ops}\n" + "\n".join(ops) + "\n"
        expected = "\n".join(outputs) if outputs else "NO_EVENTS"
        tests.append(TestCase(input_str, expected, f"Observer {n_ops} ops"))

    return Task(
        id=f"gen-pattern-observer-{random.randint(1000,9999)}",
        title="Pattern: Observer (Pub/Sub)",
        description=(
            "Simulera ett pub/sub-system. Läs N operationer:\n"
            "- 'SUB name topic': Prenumerera name på topic\n"
            "- 'UNSUB name topic': Avprenumerera\n"
            "- 'PUB topic message': Publicera. Skriv ut 'topic:message->namn1,namn2' (sorterade)\n"
            "  Om inga prenumeranter: 'topic:message->NONE'\n"
            "Skriv bara ut rader för PUB-events. Om inga PUB: skriv 'NO_EVENTS'."
        ),
        difficulty=6, category="design_pattern",
        test_cases=tests,
        hints=["Använd dict med set per topic"],
        tags=["pattern", "observer", "pubsub"],
    )


# ============================================================
# 10. ENCODING / COMPRESSION
# ============================================================

def _gen_run_length_encoding() -> Task:
    """Run-length encoding."""
    tests = []
    for _ in range(4):
        chars = random.choices(string.ascii_lowercase[:5], k=random.randint(5, 15))
        # Make runs more likely
        result = []
        for c in chars:
            if result and random.random() < 0.6:
                result.append(result[-1])
            else:
                result.append(c)
        s = "".join(result)
        
        # RLE encode
        encoded = []
        i = 0
        while i < len(s):
            c = s[i]
            count = 1
            while i + count < len(s) and s[i + count] == c:
                count += 1
            encoded.append(f"{c}{count}")
            i += count
        expected = "".join(encoded)
        tests.append(TestCase(f"{s}\n", expected, f"RLE('{s}') = '{expected}'"))

    return Task(
        id=f"gen-encode-rle-{random.randint(1000,9999)}",
        title="Encoding: Run-Length Encoding",
        description=(
            "Läs en sträng. Utför Run-Length Encoding: ersätt varje sekvens av samma tecken "
            "med tecknet följt av antalet. Exempel: 'aaabbc' → 'a3b2c1'. Skriv ut resultatet."
        ),
        difficulty=4, category="encoding",
        test_cases=tests,
        hints=["Iterera och räkna konsekutiva lika tecken"],
        tags=["encoding", "rle", "compression"],
    )


def _gen_base_conversion() -> Task:
    """Number base conversion."""
    tests = []
    for _ in range(4):
        num = random.randint(1, 255)
        from_base = random.choice([2, 8, 10, 16])
        to_base = random.choice([b for b in [2, 8, 10, 16] if b != from_base])
        
        # Convert num to from_base representation
        def to_base_str(n, b):
            if n == 0:
                return "0"
            digits = "0123456789ABCDEF"
            result = ""
            while n > 0:
                result = digits[n % b] + result
                n //= b
            return result
        
        input_repr = to_base_str(num, from_base)
        expected = to_base_str(num, to_base)
        tests.append(TestCase(f"{input_repr}\n{from_base}\n{to_base}\n", expected, 
                             f"{input_repr} (base {from_base}) -> base {to_base}"))

    return Task(
        id=f"gen-encode-base-{random.randint(1000,9999)}",
        title="Encoding: Baskonvertering",
        description=(
            "Läs ett tal (som sträng), dess nuvarande bas, och målbasen. "
            "Konvertera talet till målbasen. Använd versaler för hex (A-F). Skriv ut resultatet."
        ),
        difficulty=5, category="encoding",
        test_cases=tests,
        hints=["Konvertera först till decimal (int(s, base)), sedan till målbasen"],
        tags=["encoding", "base", "conversion"],
    )


# ============================================================
# GENERATOR REGISTRY
# ============================================================

V4_GENERATORS = [
    # Regex (difficulty 5)
    (5, _gen_regex_email_extract),
    (5, _gen_regex_validate),
    (5, _gen_regex_replace),
    # JSON/Data (difficulty 6)
    (6, _gen_json_query),
    (6, _gen_csv_transform),
    # State Machines (difficulty 4-7)
    (4, _gen_state_machine_parser),
    (6, _gen_state_machine_tokenizer),
    (7, _gen_state_machine_protocol),
    # Bit Manipulation (difficulty 3-5)
    (3, _gen_bit_count),
    (4, _gen_bit_operations),
    (5, _gen_bit_encoding),
    # Text Processing (difficulty 4-6)
    (4, _gen_text_caesar),
    (5, _gen_text_frequency),
    (6, _gen_text_similarity),
    # Math Advanced (difficulty 5-7)
    (5, _gen_gcd_lcm),
    (6, _gen_modular_arithmetic),
    (7, _gen_matrix_multiply),
    # System Design (difficulty 6-7)
    (6, _gen_task_scheduler),
    (7, _gen_lru_cache),
    (7, _gen_rate_limiter),
    # Concurrency (difficulty 8)
    (8, _gen_deadlock_detection),
    # Design Patterns (difficulty 6)
    (6, _gen_observer_pattern),
    # Encoding (difficulty 4-5)
    (4, _gen_run_length_encoding),
    (5, _gen_base_conversion),
]


def generate_v4_task(difficulty: int | None = None) -> Task:
    """Generate a v4 task at the given difficulty."""
    if difficulty is not None:
        eligible = [fn for d, fn in V4_GENERATORS if d == difficulty]
        if not eligible:
            eligible = [fn for d, fn in V4_GENERATORS if abs(d - difficulty) <= 1]
    else:
        eligible = [fn for _, fn in V4_GENERATORS]

    if not eligible:
        eligible = [fn for _, fn in V4_GENERATORS]

    return random.choice(eligible)()
