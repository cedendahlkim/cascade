"""
Dynamisk uppgiftsgenerering för 24/7 träning.

Genererar oändligt med nya programmeringsuppgifter genom:
1. Parametriserade mallar (varierar tal, strängar, storlekar)
2. Kombinationer av koncept (loop + dict, rekursion + lista, etc.)
3. LLM-genererade uppgifter för avancerade nivåer
"""

import random
import string
import math
from programming_env import Task, TestCase


# ===== MALLBASERADE GENERATORER =====

def _gen_arithmetic() -> Task:
    """Generera en aritmetisk uppgift med slumpmässiga tal."""
    ops = [
        ("+", "addition", lambda a, b: a + b),
        ("-", "subtraktion", lambda a, b: a - b),
        ("*", "multiplikation", lambda a, b: a * b),
    ]
    op_sym, op_name, op_fn = random.choice(ops)
    a = random.randint(-100, 100)
    b = random.randint(-100, 100)
    if op_sym == "*":
        a = random.randint(-20, 20)
        b = random.randint(-20, 20)

    tests = []
    for _ in range(4):
        x = random.randint(-100, 100) if op_sym != "*" else random.randint(-20, 20)
        y = random.randint(-100, 100) if op_sym != "*" else random.randint(-20, 20)
        tests.append(TestCase(f"{x}\n{y}\n", str(op_fn(x, y)), f"{x} {op_sym} {y}"))

    return Task(
        id=f"gen-arith-{random.randint(1000,9999)}",
        title=f"Beräkna {op_name}",
        description=f"Läs två heltal (ett per rad) och skriv ut deras {op_name} ({op_sym}).",
        difficulty=1, category="arithmetic",
        test_cases=tests,
        hints=[f"Använd int(input()) och operatorn {op_sym}"],
        tags=["math", "input", op_name],
    )


def _gen_string_transform() -> Task:
    """Generera en strängtransformationsuppgift."""
    transforms = [
        ("uppercase", "Konvertera till VERSALER", lambda s: s.upper(), "Använd .upper()"),
        ("lowercase", "Konvertera till gemener", lambda s: s.lower(), "Använd .lower()"),
        ("title", "Konvertera till Title Case", lambda s: s.title(), "Använd .title()"),
        ("length", "Skriv ut strängens längd", lambda s: str(len(s)), "Använd len()"),
        ("first_last", "Skriv ut första och sista tecknet med mellanslag", lambda s: f"{s[0]} {s[-1]}" if s else "", "Indexera med [0] och [-1]"),
        ("no_spaces", "Ta bort alla mellanslag", lambda s: s.replace(" ", ""), "Använd .replace(' ', '')"),
    ]
    name, desc, fn, hint = random.choice(transforms)

    words = ["hello world", "Python Programming", "active inference", "FRANKENSTEIN", "liquid neural", "test string"]
    tests = []
    for w in random.sample(words, min(4, len(words))):
        tests.append(TestCase(f"{w}\n", fn(w), f"'{w}' → '{fn(w)}'"))

    return Task(
        id=f"gen-str-{name}-{random.randint(1000,9999)}",
        title=f"Sträng: {desc}",
        description=f"Läs en sträng och {desc.lower()}.",
        difficulty=2, category="string",
        test_cases=tests,
        hints=[hint],
        tags=["string", name],
    )


def _gen_list_operation() -> Task:
    """Generera en listoperationsuppgift."""
    operations = [
        ("sum", "summan", lambda lst: str(sum(lst))),
        ("average", "medelvärdet (avrundat till heltal)", lambda lst: str(round(sum(lst) / len(lst)))),
        ("count_positive", "antalet positiva tal", lambda lst: str(sum(1 for x in lst if x > 0))),
        ("count_negative", "antalet negativa tal", lambda lst: str(sum(1 for x in lst if x < 0))),
        ("second_largest", "det näst största talet", lambda lst: str(sorted(set(lst))[-2]) if len(set(lst)) >= 2 else str(max(lst))),
        ("range", "skillnaden mellan max och min", lambda lst: str(max(lst) - min(lst))),
    ]
    name, desc, fn = random.choice(operations)

    tests = []
    for _ in range(4):
        n = random.randint(3, 8)
        lst = [random.randint(-50, 50) for _ in range(n)]
        if name == "second_largest" and len(set(lst)) < 2:
            lst.append(lst[0] + 1)
            n += 1
        input_str = f"{n}\n" + "\n".join(str(x) for x in lst) + "\n"
        tests.append(TestCase(input_str, fn(lst), f"Lista: {lst}"))

    return Task(
        id=f"gen-list-{name}-{random.randint(1000,9999)}",
        title=f"Lista: {desc}",
        description=f"Läs N (antal tal), sedan N heltal (ett per rad). Skriv ut {desc}.",
        difficulty=3, category="list",
        test_cases=tests,
        hints=["Läs in alla tal i en lista med en loop"],
        tags=["list", name, "loop"],
    )


def _gen_pattern_print() -> Task:
    """Generera en mönsterutskriftsuppgift."""
    patterns = [
        ("triangle", "Skriv ut en rätvinklig triangel med * (n rader)",
         lambda n: "\n".join("*" * i for i in range(1, n + 1))),
        ("square", "Skriv ut en kvadrat med * (n×n)",
         lambda n: "\n".join("*" * n for _ in range(n))),
        ("countdown", "Skriv ut en nedräkning från n till 1",
         lambda n: "\n".join(str(i) for i in range(n, 0, -1))),
        ("even_numbers", "Skriv ut alla jämna tal från 2 till 2n",
         lambda n: "\n".join(str(i) for i in range(2, 2 * n + 1, 2))),
        ("pyramid", "Skriv ut en centrerad pyramid med * (n rader)",
         lambda n: "\n".join(" " * (n - i) + "*" * (2 * i - 1) for i in range(1, n + 1))),
    ]
    name, desc, fn = random.choice(patterns)

    tests = []
    for n in random.sample(range(3, 8), 3):
        tests.append(TestCase(f"{n}\n", fn(n), f"n={n}"))

    return Task(
        id=f"gen-pattern-{name}-{random.randint(1000,9999)}",
        title=f"Mönster: {desc.split('(')[0].strip()}",
        description=f"Läs ett heltal n. {desc}.",
        difficulty=2, category="pattern",
        test_cases=tests,
        hints=["Använd en for-loop och string-multiplikation"],
        tags=["pattern", "loop", "string"],
    )


def _gen_number_theory() -> Task:
    """Generera en talteoretisk uppgift."""
    problems = [
        ("divisors", "Skriv ut alla delare", lambda n: " ".join(str(d) for d in range(1, n + 1) if n % d == 0)),
        ("digit_sum", "Skriv ut siffersumman", lambda n: str(sum(int(d) for d in str(abs(n))))),
        ("is_perfect_square", "Skriv 'yes' om det är en perfekt kvadrat, annars 'no'",
         lambda n: "yes" if n >= 0 and int(math.isqrt(n)) ** 2 == n else "no"),
        ("reverse_number", "Skriv ut talet baklänges (som heltal)", lambda n: str(int(str(abs(n))[::-1])) if n >= 0 else "-" + str(int(str(abs(n))[::-1]))),
        ("count_digits", "Skriv ut antalet siffror", lambda n: str(len(str(abs(n))))),
    ]
    name, desc, fn = random.choice(problems)

    tests = []
    for _ in range(4):
        if name == "is_perfect_square":
            n = random.choice([1, 4, 9, 16, 25, 36, 49, 7, 10, 15, 20, 30])
        elif name == "divisors":
            n = random.randint(2, 50)
        else:
            n = random.randint(1, 9999)
        tests.append(TestCase(f"{n}\n", fn(n), f"n={n}"))

    return Task(
        id=f"gen-numtheory-{name}-{random.randint(1000,9999)}",
        title=f"Tal: {desc.split(',')[0]}",
        description=f"Läs ett heltal n. {desc}.",
        difficulty=3, category="number_theory",
        test_cases=tests,
        hints=["Tänk på modulo (%) och heltalsdivision (//)"],
        tags=["math", name, "number_theory"],
    )


def _gen_dict_problem() -> Task:
    """Generera en dictionary-uppgift."""
    problems = [
        ("char_count", "Räkna förekomster av varje tecken",
         "Läs en sträng. Skriv ut varje unikt tecken och dess antal, sorterat alfabetiskt. Format: 'tecken antal' (ett per rad). Ignorera mellanslag.",
         lambda s: "\n".join(f"{c} {s.replace(' ', '').count(c)}" for c in sorted(set(s.replace(' ', ''))))),
        ("word_length", "Ordlängder",
         "Läs en rad text. Skriv ut varje unikt ord och dess längd, sorterat alfabetiskt. Format: 'ord längd'.",
         lambda s: "\n".join(f"{w} {len(w)}" for w in sorted(set(s.split())))),
    ]
    name, title, desc, fn = random.choice(problems)

    test_strings = ["hello world", "aabbcc", "python is great", "test test test"]
    tests = []
    for s in random.sample(test_strings, 3):
        tests.append(TestCase(f"{s}\n", fn(s), f"'{s}'"))

    return Task(
        id=f"gen-dict-{name}-{random.randint(1000,9999)}",
        title=title,
        description=desc,
        difficulty=4, category="dict",
        test_cases=tests,
        hints=["Använd ett dictionary eller collections.Counter"],
        tags=["dict", "string", name],
    )


def _gen_algorithm() -> Task:
    """Generera en algoritmuppgift."""
    problems = [
        ("two_sum", "Two Sum",
         "Läs N tal (ett per rad), sedan ett målvärde. Skriv ut index (0-baserade) för två tal som summerar till målet, separerade med mellanslag. Om det inte finns, skriv -1. Returnera det första paret.",
         4),
        ("remove_duplicates", "Ta bort dubbletter",
         "Läs N, sedan N heltal. Skriv ut de unika talen i den ordning de först förekommer, separerade med mellanslag.",
         3),
        ("running_sum", "Löpande summa",
         "Läs N, sedan N heltal. Skriv ut den löpande summan (prefix sum) separerad med mellanslag.",
         3),
    ]
    name, title, desc, diff = random.choice(problems)

    tests = []
    if name == "two_sum":
        for _ in range(3):
            n = random.randint(4, 6)
            # Generate list where only ONE pair sums to target
            # Use distinct large-spread values to avoid accidental duplicates
            base = random.sample(range(1, 100), n)
            i, j = sorted(random.sample(range(n), 2))
            target = base[i] + base[j]
            # Verify uniqueness: no other pair should sum to target
            retry = 0
            while retry < 20:
                other_pairs = [(a, b) for a in range(n) for b in range(a + 1, n)
                               if (a, b) != (i, j) and base[a] + base[b] == target]
                if not other_pairs:
                    break
                base = random.sample(range(1, 100), n)
                target = base[i] + base[j]
                retry += 1
            input_str = f"{n}\n" + "\n".join(str(x) for x in base) + f"\n{target}\n"
            tests.append(TestCase(input_str, f"{i} {j}", f"Lista: {base}, mål: {target}"))
    elif name == "remove_duplicates":
        for _ in range(3):
            n = random.randint(4, 8)
            lst = [random.randint(1, 5) for _ in range(n)]
            seen = set()
            unique = []
            for x in lst:
                if x not in seen:
                    unique.append(x)
                    seen.add(x)
            input_str = f"{n}\n" + "\n".join(str(x) for x in lst) + "\n"
            tests.append(TestCase(input_str, " ".join(str(x) for x in unique), f"Lista: {lst}"))
    elif name == "running_sum":
        for _ in range(3):
            n = random.randint(3, 6)
            lst = [random.randint(1, 20) for _ in range(n)]
            running = []
            s = 0
            for x in lst:
                s += x
                running.append(s)
            input_str = f"{n}\n" + "\n".join(str(x) for x in lst) + "\n"
            tests.append(TestCase(input_str, " ".join(str(x) for x in running), f"Lista: {lst}"))

    return Task(
        id=f"gen-algo-{name}-{random.randint(1000,9999)}",
        title=title,
        description=desc,
        difficulty=diff, category="algorithm",
        test_cases=tests,
        hints=["Tänk steg för steg: läs input, bearbeta, skriv output"],
        tags=["algorithm", name],
    )


def _gen_recursion() -> Task:
    """Generera en rekursionsuppgift."""
    problems = [
        ("power", "Beräkna x^n",
         "Läs två heltal x och n (n >= 0). Skriv ut x upphöjt till n.",
         lambda x, n: str(x ** n)),
        ("sum_digits", "Rekursiv siffersumma",
         "Läs ett positivt heltal. Skriv ut den rekursiva siffersumman (upprepa tills en siffra kvar).",
         lambda x, _: str(x) if x < 10 else str(sum(int(d) for d in str(x)))),
    ]
    name, title, desc, fn = random.choice(problems)

    tests = []
    if name == "power":
        for _ in range(4):
            x = random.randint(1, 5)
            n = random.randint(0, 6)
            tests.append(TestCase(f"{x}\n{n}\n", fn(x, n), f"{x}^{n}"))
    else:
        for _ in range(4):
            x = random.randint(10, 999)
            # Beräkna rekursiv siffersumma
            val = x
            while val >= 10:
                val = sum(int(d) for d in str(val))
            tests.append(TestCase(f"{x}\n", str(val), f"digital root of {x}"))

    return Task(
        id=f"gen-rec-{name}-{random.randint(1000,9999)}",
        title=title,
        description=desc,
        difficulty=4, category="recursion",
        test_cases=tests,
        hints=["Tänk rekursivt: basfall + rekursivt steg"],
        tags=["recursion", name],
    )


def _gen_matrix() -> Task:
    """Generera en matrisuppgift."""
    problems = [
        ("row_sum", "Radsummor",
         "Läs R och C, sedan en R×C matris. Skriv ut summan av varje rad, en per rad.",
         lambda mat: "\n".join(str(sum(row)) for row in mat)),
        ("col_sum", "Kolumnsummor",
         "Läs R och C, sedan en R×C matris. Skriv ut summan av varje kolumn, separerade med mellanslag.",
         lambda mat: " ".join(str(sum(mat[r][c] for r in range(len(mat)))) for c in range(len(mat[0])))),
        ("diagonal", "Diagonalsumma",
         "Läs N, sedan en N×N matris. Skriv ut summan av huvuddiagonalen.",
         lambda mat: str(sum(mat[i][i] for i in range(len(mat))))),
    ]
    name, title, desc, fn = random.choice(problems)

    tests = []
    for _ in range(3):
        if name == "diagonal":
            n = random.randint(2, 4)
            r, c = n, n
        else:
            r = random.randint(2, 4)
            c = random.randint(2, 4)
        mat = [[random.randint(1, 9) for _ in range(c)] for _ in range(r)]
        if name == "diagonal":
            input_str = f"{n}\n"
        else:
            input_str = f"{r} {c}\n"
        input_str += "\n".join(" ".join(str(x) for x in row) for row in mat) + "\n"
        tests.append(TestCase(input_str, fn(mat), f"Matris {r}x{c}"))

    return Task(
        id=f"gen-matrix-{name}-{random.randint(1000,9999)}",
        title=f"Matris: {title}",
        description=f"Läs dimensioner och en matris med heltal. {desc.split('.')[1].strip() if '.' in desc else desc}.",
        difficulty=4, category="matrix",
        test_cases=tests,
        hints=["Läs matrisen rad för rad med split()"],
        tags=["matrix", name, "2d"],
    )


# ===== NIVÅ 5: AVANCERADE ALGORITMER =====

def _gen_sorting_algorithm() -> Task:
    """Generera en sorteringsuppgift med specifik algoritm."""
    algos = [
        ("bubble_sort", "Bubble Sort",
         "Implementera bubble sort. Läs N, sedan N heltal. Skriv ut den sorterade listan separerad med mellanslag."),
        ("insertion_sort", "Insertion Sort",
         "Implementera insertion sort. Läs N, sedan N heltal. Skriv ut den sorterade listan separerad med mellanslag."),
        ("merge_sorted", "Merga två sorterade listor",
         "Läs N1, sedan N1 sorterade heltal, sedan N2, sedan N2 sorterade heltal. Skriv ut den mergade sorterade listan separerad med mellanslag."),
    ]
    name, title, desc = random.choice(algos)

    tests = []
    for _ in range(3):
        if name == "merge_sorted":
            n1 = random.randint(2, 5)
            n2 = random.randint(2, 5)
            lst1 = sorted(random.randint(1, 30) for _ in range(n1))
            lst2 = sorted(random.randint(1, 30) for _ in range(n2))
            input_str = f"{n1}\n" + "\n".join(str(x) for x in lst1) + f"\n{n2}\n" + "\n".join(str(x) for x in lst2) + "\n"
            expected = " ".join(str(x) for x in sorted(lst1 + lst2))
            tests.append(TestCase(input_str, expected, f"Merge {lst1} + {lst2}"))
        else:
            n = random.randint(4, 8)
            lst = [random.randint(-20, 50) for _ in range(n)]
            input_str = f"{n}\n" + "\n".join(str(x) for x in lst) + "\n"
            tests.append(TestCase(input_str, " ".join(str(x) for x in sorted(lst)), f"Sort {lst}"))

    return Task(
        id=f"gen-sort-{name}-{random.randint(1000,9999)}",
        title=title, description=desc,
        difficulty=5, category="sorting",
        test_cases=tests,
        hints=["Implementera algoritmen steg för steg, jämför och byt element"],
        tags=["algorithm", "sorting", name],
    )


def _gen_string_advanced() -> Task:
    """Generera avancerade stränguppgifter."""
    problems = [
        ("anagram", "Kontrollera anagram",
         "Läs två strängar (en per rad). Skriv 'yes' om de är anagram (samma bokstäver), annars 'no'. Ignorera mellanslag och versaler.",
         lambda a, b: "yes" if sorted(a.lower().replace(" ", "")) == sorted(b.lower().replace(" ", "")) else "no"),
        ("compress", "Komprimera sträng (RLE)",
         "Läs en sträng. Skriv ut run-length encoding. T.ex. 'aaabbc' → 'a3b2c1'.",
         lambda s, _: "".join(c + str(len(list(g))) for c, g in __import__('itertools').groupby(s))),
        ("longest_word", "Längsta ordet",
         "Läs en rad text. Skriv ut det längsta ordet. Vid lika, skriv det första.",
         lambda s, _: max(s.split(), key=len) if s.split() else ""),
        ("caesar", "Caesar-chiffer",
         "Läs en sträng och ett heltal N. Skifta varje bokstav N steg framåt i alfabetet (wrapping). Behåll icke-bokstäver.",
         None),  # Special handling
    ]
    name, title, desc, fn = random.choice(problems)

    tests = []
    if name == "anagram":
        pairs = [("listen", "silent", "yes"), ("hello", "world", "no"), ("Astronomer", "Moon starer", "yes"), ("abc", "cba", "yes")]
        for a, b, exp in random.sample(pairs, 3):
            tests.append(TestCase(f"{a}\n{b}\n", exp, f"'{a}' vs '{b}'"))
    elif name == "compress":
        strings = ["aaabbc", "aabbcc", "abcabc", "aaaa", "abcd"]
        for s in random.sample(strings, 3):
            from itertools import groupby
            expected = "".join(c + str(len(list(g))) for c, g in groupby(s))
            tests.append(TestCase(f"{s}\n", expected, f"RLE('{s}')"))
    elif name == "longest_word":
        sentences = ["the quick brown fox", "I am a programmer", "hello beautiful world today", "short long longest"]
        for s in random.sample(sentences, 3):
            expected = max(s.split(), key=len)
            tests.append(TestCase(f"{s}\n", expected, f"Longest in '{s}'"))
    elif name == "caesar":
        def caesar_shift(text, n):
            result = []
            for c in text:
                if c.isalpha():
                    base = ord('a') if c.islower() else ord('A')
                    result.append(chr((ord(c) - base + n) % 26 + base))
                else:
                    result.append(c)
            return "".join(result)
        for _ in range(3):
            n = random.randint(1, 10)
            word = random.choice(["hello", "world", "python", "caesar", "attack"])
            tests.append(TestCase(f"{word}\n{n}\n", caesar_shift(word, n), f"Caesar('{word}', {n})"))

    return Task(
        id=f"gen-strv-{name}-{random.randint(1000,9999)}",
        title=title, description=desc,
        difficulty=5, category="string_advanced",
        test_cases=tests,
        hints=["Tänk på edge cases och strängmanipulation"],
        tags=["string", "advanced", name],
    )


# ===== NIVÅ 6: DATASTRUKTURER =====

def _gen_stack_queue() -> Task:
    """Generera stack/kö-uppgifter."""
    problems = [
        ("balanced_brackets", "Balanserade parenteser",
         "Läs en sträng med parenteser ()[]{}. Skriv 'yes' om de är balanserade, annars 'no'.",
         lambda s: _check_brackets(s)),
        ("reverse_with_stack", "Omvänd med stack",
         "Läs N, sedan N heltal. Använd en stack (lista) för att vända ordningen. Skriv ut resultatet separerat med mellanslag.",
         None),
        ("min_stack", "Min-stack",
         "Implementera en stack som stödjer push, pop och getMin i O(1). Läs N operationer (push X / pop / min). Skriv ut resultatet av varje min-operation, en per rad.",
         None),
    ]
    name, title, desc, fn = random.choice(problems)

    tests = []
    if name == "balanced_brackets":
        cases = [("(())", "yes"), ("([{}])", "yes"), ("(()", "no"), ("([)]", "no"), ("{}", "yes"), ("", "yes"), ("([]{})", "yes")]
        for s, exp in random.sample(cases, min(4, len(cases))):
            tests.append(TestCase(f"{s}\n", exp, f"'{s}'"))
    elif name == "reverse_with_stack":
        for _ in range(3):
            n = random.randint(3, 7)
            lst = [random.randint(1, 50) for _ in range(n)]
            input_str = f"{n}\n" + "\n".join(str(x) for x in lst) + "\n"
            tests.append(TestCase(input_str, " ".join(str(x) for x in reversed(lst)), f"Reverse {lst}"))
    elif name == "min_stack":
        for _ in range(3):
            ops = []
            stack = []
            expected_lines = []
            for _ in range(random.randint(4, 8)):
                if not stack or random.random() < 0.5:
                    val = random.randint(1, 100)
                    ops.append(f"push {val}")
                    stack.append(val)
                elif random.random() < 0.5 and stack:
                    ops.append("min")
                    expected_lines.append(str(min(stack)))
                elif stack:
                    ops.append("pop")
                    stack.pop()
            if not expected_lines:
                ops.append("min")
                if stack:
                    expected_lines.append(str(min(stack)))
                else:
                    continue
            input_str = f"{len(ops)}\n" + "\n".join(ops) + "\n"
            tests.append(TestCase(input_str, "\n".join(expected_lines), f"MinStack ops={len(ops)}"))

    return Task(
        id=f"gen-ds-{name}-{random.randint(1000,9999)}",
        title=title, description=desc,
        difficulty=6, category="data_structure",
        test_cases=tests,
        hints=["Använd en lista som stack (append/pop)"],
        tags=["data_structure", "stack", name],
    )


def _check_brackets(s: str) -> str:
    stack = []
    pairs = {')': '(', ']': '[', '}': '{'}
    for c in s:
        if c in '([{':
            stack.append(c)
        elif c in ')]}':
            if not stack or stack[-1] != pairs[c]:
                return "no"
            stack.pop()
    return "yes" if not stack else "no"


def _gen_linked_list_sim() -> Task:
    """Simulera länkad lista med arrays."""
    problems = [
        ("reverse_list", "Omvänd länkad lista",
         "Läs N, sedan N heltal som representerar en länkad lista. Skriv ut listan omvänd, separerad med mellanslag.",
         lambda lst: " ".join(str(x) for x in reversed(lst))),
        ("remove_nth", "Ta bort N:te elementet",
         "Läs N (antal element), sedan N heltal, sedan ett index K (0-baserat). Skriv ut listan utan element K, separerad med mellanslag.",
         None),
        ("detect_cycle_sim", "Hitta dubbletter (cykel-simulering)",
         "Läs N, sedan N heltal (1 till N-1). Minst ett tal förekommer mer än en gång. Skriv ut det första duplicerade talet.",
         None),
    ]
    name, title, desc, fn = random.choice(problems)

    tests = []
    if name == "reverse_list":
        for _ in range(3):
            n = random.randint(3, 7)
            lst = [random.randint(1, 50) for _ in range(n)]
            input_str = f"{n}\n" + "\n".join(str(x) for x in lst) + "\n"
            tests.append(TestCase(input_str, fn(lst), f"Reverse {lst}"))
    elif name == "remove_nth":
        for _ in range(3):
            n = random.randint(3, 7)
            lst = [random.randint(1, 50) for _ in range(n)]
            k = random.randint(0, n - 1)
            result = lst[:k] + lst[k+1:]
            input_str = f"{n}\n" + "\n".join(str(x) for x in lst) + f"\n{k}\n"
            tests.append(TestCase(input_str, " ".join(str(x) for x in result), f"Remove idx {k} from {lst}"))
    elif name == "detect_cycle_sim":
        for _ in range(3):
            n = random.randint(4, 8)
            dup_val = random.randint(1, n - 1)
            lst = list(range(1, n))
            lst.append(dup_val)
            random.shuffle(lst)
            # Find first duplicate
            seen = set()
            first_dup = None
            for x in lst:
                if x in seen:
                    first_dup = x
                    break
                seen.add(x)
            input_str = f"{len(lst)}\n" + "\n".join(str(x) for x in lst) + "\n"
            tests.append(TestCase(input_str, str(first_dup), f"First dup in {lst}"))

    return Task(
        id=f"gen-ll-{name}-{random.randint(1000,9999)}",
        title=title, description=desc,
        difficulty=6, category="linked_list",
        test_cases=tests,
        hints=["Simulera med en Python-lista"],
        tags=["data_structure", "linked_list", name],
    )


# ===== NIVÅ 7: FUNKTIONELL PROGRAMMERING & AVANCERAT =====

def _gen_functional() -> Task:
    """Generera funktionella programmeringsuppgifter."""
    problems = [
        ("map_filter", "Map och Filter",
         "Läs N, sedan N heltal. Skriv ut alla jämna tal multiplicerade med 3, separerade med mellanslag. Om inga jämna tal finns, skriv 'none'.",
         lambda lst: " ".join(str(x * 3) for x in lst if x % 2 == 0) or "none"),
        ("reduce_product", "Reduce: Produkt",
         "Läs N, sedan N heltal. Skriv ut produkten av alla tal.",
         lambda lst: str(eval("*".join(str(x) for x in lst)) if lst else 0)),
        ("flatten", "Platta ut nästlad lista",
         "Läs en rad med nästlade listor i Python-format (t.ex. [1,[2,3],[4,[5]]]). Skriv ut alla element plattade, separerade med mellanslag.",
         None),
        ("zip_lists", "Zippa två listor",
         "Läs N, sedan N heltal (lista A), sedan N heltal (lista B). Skriv ut paren som 'a,b' separerade med mellanslag.",
         lambda a, b: " ".join(f"{x},{y}" for x, y in zip(a, b))),
    ]
    name, title, desc, fn = random.choice(problems)

    tests = []
    if name == "map_filter":
        for _ in range(3):
            n = random.randint(4, 8)
            lst = [random.randint(-20, 20) for _ in range(n)]
            result = [x * 3 for x in lst if x % 2 == 0]
            expected = " ".join(str(x) for x in result) if result else "none"
            input_str = f"{n}\n" + "\n".join(str(x) for x in lst) + "\n"
            tests.append(TestCase(input_str, expected, f"MapFilter {lst}"))
    elif name == "reduce_product":
        for _ in range(3):
            n = random.randint(2, 5)
            lst = [random.randint(1, 10) for _ in range(n)]
            product = 1
            for x in lst:
                product *= x
            input_str = f"{n}\n" + "\n".join(str(x) for x in lst) + "\n"
            tests.append(TestCase(input_str, str(product), f"Product {lst}"))
    elif name == "flatten":
        cases = [
            ("[1,2,[3,4],5]", "1 2 3 4 5"),
            ("[1,[2,[3]],4]", "1 2 3 4"),
            ("[[1,2],[3,4]]", "1 2 3 4"),
        ]
        for inp, exp in cases:
            tests.append(TestCase(f"{inp}\n", exp, f"Flatten {inp}"))
    elif name == "zip_lists":
        for _ in range(3):
            n = random.randint(3, 5)
            a = [random.randint(1, 20) for _ in range(n)]
            b = [random.randint(1, 20) for _ in range(n)]
            expected = " ".join(f"{x},{y}" for x, y in zip(a, b))
            input_str = f"{n}\n" + "\n".join(str(x) for x in a) + "\n" + "\n".join(str(x) for x in b) + "\n"
            tests.append(TestCase(input_str, expected, f"Zip {a} + {b}"))

    return Task(
        id=f"gen-func-{name}-{random.randint(1000,9999)}",
        title=title, description=desc,
        difficulty=7, category="functional",
        test_cases=tests,
        hints=["Tänk funktionellt: map(), filter(), reduce()"],
        tags=["functional", name],
    )


def _gen_graph_basic() -> Task:
    """Generera grundläggande grafuppgifter."""
    problems = [
        ("adjacency", "Bygg adjacenslista",
         "Läs N (noder) och M (kanter), sedan M rader med 'u v' (0-baserade). Skriv ut adjacenslistan: för varje nod, skriv nodens grannar sorterade, separerade med mellanslag. En nod per rad."),
        ("path_exists", "Finns väg?",
         "Läs N (noder), M (kanter), sedan M rader 'u v', sedan start och mål. Skriv 'yes' om det finns en väg från start till mål, annars 'no'."),
        ("count_components", "Räkna sammanhängande komponenter",
         "Läs N (noder) och M (kanter), sedan M rader 'u v'. Skriv ut antalet sammanhängande komponenter."),
    ]
    name, title, desc = random.choice(problems)

    tests = []
    if name == "adjacency":
        for _ in range(3):
            n = random.randint(3, 5)
            edges = set()
            m = random.randint(n - 1, min(n * 2, n * (n - 1) // 2))
            while len(edges) < m:
                u, v = random.sample(range(n), 2)
                edges.add((min(u, v), max(u, v)))
            adj = [[] for _ in range(n)]
            for u, v in edges:
                adj[u].append(v)
                adj[v].append(u)
            input_str = f"{n} {m}\n" + "\n".join(f"{u} {v}" for u, v in edges) + "\n"
            expected = "\n".join(" ".join(str(x) for x in sorted(adj[i])) if adj[i] else "" for i in range(n))
            tests.append(TestCase(input_str, expected, f"Graph N={n} M={m}"))
    elif name == "path_exists":
        for _ in range(3):
            n = random.randint(4, 6)
            edges = set()
            # Ensure at least a path 0->1->...->n-1
            for i in range(n - 1):
                if random.random() < 0.7:
                    edges.add((i, i + 1))
            m_extra = random.randint(0, 3)
            for _ in range(m_extra):
                u, v = random.sample(range(n), 2)
                edges.add((min(u, v), max(u, v)))
            # BFS to check
            adj = [[] for _ in range(n)]
            for u, v in edges:
                adj[u].append(v)
                adj[v].append(u)
            start, goal = 0, n - 1
            visited = set()
            queue = [start]
            visited.add(start)
            while queue:
                curr = queue.pop(0)
                for nb in adj[curr]:
                    if nb not in visited:
                        visited.add(nb)
                        queue.append(nb)
            expected = "yes" if goal in visited else "no"
            input_str = f"{n} {len(edges)}\n" + "\n".join(f"{u} {v}" for u, v in edges) + f"\n{start} {goal}\n"
            tests.append(TestCase(input_str, expected, f"Path {start}->{goal}"))
    elif name == "count_components":
        for _ in range(3):
            n = random.randint(4, 7)
            edges = set()
            m = random.randint(1, n - 1)
            while len(edges) < m:
                u, v = random.sample(range(n), 2)
                edges.add((min(u, v), max(u, v)))
            # Union-Find
            parent = list(range(n))
            def find(x):
                while parent[x] != x:
                    parent[x] = parent[parent[x]]
                    x = parent[x]
                return x
            for u, v in edges:
                pu, pv = find(u), find(v)
                if pu != pv:
                    parent[pu] = pv
            components = len(set(find(i) for i in range(n)))
            input_str = f"{n} {len(edges)}\n" + "\n".join(f"{u} {v}" for u, v in edges) + "\n"
            tests.append(TestCase(input_str, str(components), f"Components N={n}"))

    return Task(
        id=f"gen-graph-{name}-{random.randint(1000,9999)}",
        title=title, description=desc,
        difficulty=7, category="graph",
        test_cases=tests,
        hints=["Använd adjacenslista och BFS/DFS"],
        tags=["graph", name],
    )


# ===== NIVÅ 8: DYNAMISK PROGRAMMERING & KOMBINATORIK =====

def _gen_dp() -> Task:
    """Generera dynamisk programmering-uppgifter."""
    problems = [
        ("climb_stairs", "Trappklättring",
         "Läs N. Du kan ta 1 eller 2 steg i taget. Skriv ut antalet unika sätt att nå steg N.",
         lambda n: _fib_ways(n)),
        ("coin_change", "Minsta antal mynt",
         "Läs ett belopp och antal mynttyper, sedan myntvärden. Skriv ut minsta antal mynt för att nå beloppet, eller -1 om omöjligt.",
         None),
        ("max_subarray", "Största delsumman (Kadane)",
         "Läs N, sedan N heltal. Skriv ut den största möjliga summan av en sammanhängande delarray.",
         lambda lst: _kadane(lst)),
        ("longest_increasing", "Längsta ökande delföljd (LIS)",
         "Läs N, sedan N heltal. Skriv ut längden på den längsta strikt ökande delföljden.",
         lambda lst: _lis_length(lst)),
    ]
    name, title, desc, fn = random.choice(problems)

    tests = []
    if name == "climb_stairs":
        for n in random.sample(range(1, 12), 3):
            tests.append(TestCase(f"{n}\n", str(fn(n)), f"N={n}"))
    elif name == "coin_change":
        cases = [
            (11, [1, 5, 6], 2),    # 5+6
            (3, [2], -1),           # impossible
            (0, [1], 0),            # zero
            (7, [1, 3, 4], 2),      # 3+4
        ]
        for amount, coins, expected in random.sample(cases, 3):
            input_str = f"{amount}\n{len(coins)}\n" + "\n".join(str(c) for c in coins) + "\n"
            tests.append(TestCase(input_str, str(expected), f"Amount={amount} Coins={coins}"))
    elif name == "max_subarray":
        for _ in range(3):
            n = random.randint(3, 8)
            lst = [random.randint(-10, 10) for _ in range(n)]
            input_str = f"{n}\n" + "\n".join(str(x) for x in lst) + "\n"
            tests.append(TestCase(input_str, str(fn(lst)), f"Kadane {lst}"))
    elif name == "longest_increasing":
        for _ in range(3):
            n = random.randint(4, 8)
            lst = [random.randint(1, 20) for _ in range(n)]
            input_str = f"{n}\n" + "\n".join(str(x) for x in lst) + "\n"
            tests.append(TestCase(input_str, str(fn(lst)), f"LIS {lst}"))

    return Task(
        id=f"gen-dp-{name}-{random.randint(1000,9999)}",
        title=title, description=desc,
        difficulty=8, category="dp",
        test_cases=tests,
        hints=["Tänk dynamisk programmering: dela upp i delproblem, memoisera"],
        tags=["dp", "algorithm", name],
    )


def _fib_ways(n: int) -> int:
    if n <= 1:
        return 1
    a, b = 1, 1
    for _ in range(2, n + 1):
        a, b = b, a + b
    return b


def _kadane(lst: list[int]) -> int:
    max_sum = curr = lst[0]
    for x in lst[1:]:
        curr = max(x, curr + x)
        max_sum = max(max_sum, curr)
    return max_sum


def _lis_length(lst: list[int]) -> int:
    if not lst:
        return 0
    dp = [1] * len(lst)
    for i in range(1, len(lst)):
        for j in range(i):
            if lst[j] < lst[i]:
                dp[i] = max(dp[i], dp[j] + 1)
    return max(dp)


def _gen_combinatorics() -> Task:
    """Generera kombinatorikuppgifter."""
    problems = [
        ("permutations", "Generera permutationer",
         "Läs N, sedan N unika heltal. Skriv ut alla permutationer i lexikografisk ordning, en per rad, element separerade med mellanslag."),
        ("subsets", "Generera alla delmängder",
         "Läs N, sedan N unika heltal (sorterade). Skriv ut alla delmängder i ordning (tom mängd först), en per rad, element separerade med mellanslag. Tom mängd = tom rad."),
        ("combinations", "Kombinationer av K element",
         "Läs N, sedan N unika sorterade heltal, sedan K. Skriv ut alla kombinationer av K element, en per rad, element separerade med mellanslag."),
    ]
    name, title, desc = random.choice(problems)

    tests = []
    if name == "permutations":
        for _ in range(2):
            n = random.randint(2, 4)
            lst = sorted(random.sample(range(1, 10), n))
            from itertools import permutations
            perms = sorted(permutations(lst))
            expected = "\n".join(" ".join(str(x) for x in p) for p in perms)
            input_str = f"{n}\n" + "\n".join(str(x) for x in lst) + "\n"
            tests.append(TestCase(input_str, expected, f"Perms of {lst}"))
    elif name == "subsets":
        for _ in range(2):
            n = random.randint(2, 4)
            lst = sorted(random.sample(range(1, 10), n))
            from itertools import combinations
            subs = [[]]
            for r in range(1, n + 1):
                subs.extend(sorted(combinations(lst, r)))
            expected = "\n".join(" ".join(str(x) for x in s) if s else "" for s in subs)
            input_str = f"{n}\n" + "\n".join(str(x) for x in lst) + "\n"
            tests.append(TestCase(input_str, expected, f"Subsets of {lst}"))
    elif name == "combinations":
        for _ in range(2):
            n = random.randint(3, 5)
            k = random.randint(2, n - 1)
            lst = sorted(random.sample(range(1, 10), n))
            from itertools import combinations
            combs = sorted(combinations(lst, k))
            expected = "\n".join(" ".join(str(x) for x in c) for c in combs)
            input_str = f"{n}\n" + "\n".join(str(x) for x in lst) + f"\n{k}\n"
            tests.append(TestCase(input_str, expected, f"C({lst},{k})"))

    return Task(
        id=f"gen-comb-{name}-{random.randint(1000,9999)}",
        title=title, description=desc,
        difficulty=8, category="combinatorics",
        test_cases=tests,
        hints=["Använd rekursion eller itertools för att generera kombinationer"],
        tags=["combinatorics", "recursion", name],
    )


# ===== NIVÅ 9: AVANCERADE GRAFALGORITMER & SÖKNING =====

def _gen_shortest_path() -> Task:
    """Generera kortaste väg-uppgifter (Dijkstra-liknande på liten graf)."""
    problems = [
        ("shortest_unweighted", "Kortaste väg (BFS)",
         "Läs N (noder) och M (kanter). Sedan M rader med 'u v' (0-indexerade). "
         "Sedan start och mål. Skriv ut kortaste avståndet (antal kanter), eller -1 om ingen väg finns."),
        ("shortest_weighted", "Kortaste väg (viktad graf)",
         "Läs N (noder) och M (kanter). Sedan M rader med 'u v w' (nod, nod, vikt). "
         "Sedan start och mål. Skriv ut kortaste totala vikten, eller -1 om ingen väg finns."),
    ]
    name, title, desc = random.choice(problems)
    tests = []

    if name == "shortest_unweighted":
        cases = [
            # Enkel kedja: 0-1-2-3
            (4, [(0,1),(1,2),(2,3)], 0, 3, 3),
            # Genväg: 0-1-2, 0-2
            (3, [(0,1),(1,2),(0,2)], 0, 2, 1),
            # Ingen väg
            (4, [(0,1),(2,3)], 0, 3, -1),
            # Samma nod
            (3, [(0,1),(1,2)], 1, 1, 0),
        ]
        for n, edges, s, t, expected in random.sample(cases, 3):
            m = len(edges)
            lines = [f"{n} {m}"]
            for u, v in edges:
                lines.append(f"{u} {v}")
            lines.append(f"{s} {t}")
            tests.append(TestCase("\n".join(lines) + "\n", str(expected), f"BFS {s}->{t}"))
    else:
        cases = [
            # Enkel: 0->1(2), 1->2(3), 0->2(10)
            (3, [(0,1,2),(1,2,3),(0,2,10)], 0, 2, 5),
            # Direkt billigare
            (3, [(0,1,1),(0,2,2),(1,2,5)], 0, 2, 2),
            # Ingen väg
            (3, [(0,1,1)], 0, 2, -1),
            # Triangel
            (3, [(0,1,4),(1,2,4),(0,2,7)], 0, 2, 7),
        ]
        for n, edges, s, t, expected in random.sample(cases, 3):
            m = len(edges)
            lines = [f"{n} {m}"]
            for u, v, w in edges:
                lines.append(f"{u} {v} {w}")
            lines.append(f"{s} {t}")
            tests.append(TestCase("\n".join(lines) + "\n", str(expected), f"Dijkstra {s}->{t}"))

    return Task(
        id=f"gen-graph-{name}-{random.randint(1000,9999)}",
        title=title, description=desc,
        difficulty=9, category="graph_advanced",
        test_cases=tests,
        hints=["Använd BFS för oviktad graf, Dijkstra (heapq) för viktad"],
        tags=["graph", "shortest_path", "bfs", name],
    )


def _gen_topological_sort() -> Task:
    """Generera topologisk sortering-uppgifter."""
    desc = (
        "Läs N (noder, 0-indexerade) och M (riktade kanter). "
        "Sedan M rader med 'u v' (kant från u till v). "
        "Skriv ut en giltig topologisk ordning, noder separerade med mellanslag. "
        "Om det finns en cykel, skriv 'CYCLE'."
    )
    tests = []
    cases = [
        # DAG: 0->1, 0->2, 1->3, 2->3
        (4, [(0,1),(0,2),(1,3),(2,3)], False),
        # Enkel kedja
        (3, [(0,1),(1,2)], False),
        # Cykel: 0->1->2->0
        (3, [(0,1),(1,2),(2,0)], True),
        # Isolerad nod
        (4, [(0,1),(2,3)], False),
    ]
    for n, edges, has_cycle in random.sample(cases, 3):
        m = len(edges)
        lines = [f"{n} {m}"]
        for u, v in edges:
            lines.append(f"{u} {v}")
        input_str = "\n".join(lines) + "\n"
        if has_cycle:
            tests.append(TestCase(input_str, "CYCLE", f"Cykel n={n}"))
        else:
            # Beräkna en giltig topologisk ordning (Kahn's)
            from collections import deque
            adj = [[] for _ in range(n)]
            indeg = [0] * n
            for u, v in edges:
                adj[u].append(v)
                indeg[v] += 1
            q = deque(i for i in range(n) if indeg[i] == 0)
            order = []
            while q:
                node = q.popleft()
                order.append(node)
                for nb in adj[node]:
                    indeg[nb] -= 1
                    if indeg[nb] == 0:
                        q.append(nb)
            expected = " ".join(str(x) for x in order)
            tests.append(TestCase(input_str, expected, f"Topo n={n}"))

    return Task(
        id=f"gen-graph-topo-{random.randint(1000,9999)}",
        title="Topologisk sortering", description=desc,
        difficulty=9, category="graph_advanced",
        test_cases=tests,
        hints=["Använd Kahn's algoritm (BFS med in-degree) eller DFS med besökt-markering"],
        tags=["graph", "topological_sort", "dag"],
    )


def _gen_binary_search_advanced() -> Task:
    """Generera avancerade binärsökningsuppgifter."""
    problems = [
        ("search_rotated", "Sök i roterad sorterad array",
         "Läs N, sedan N heltal (en roterad sorterad array), sedan ett målvärde. "
         "Skriv ut indexet där målet finns, eller -1 om det inte finns."),
        ("kth_smallest_matrix", "K:te minsta i sorterad matris",
         "Läs N (NxN matris där varje rad och kolumn är sorterad). "
         "Sedan N rader med N tal. Sedan K. Skriv ut det K:te minsta elementet."),
    ]
    name, title, desc = random.choice(problems)
    tests = []

    if name == "search_rotated":
        cases = [
            ([4,5,6,7,0,1,2], 0, 4),
            ([4,5,6,7,0,1,2], 3, -1),
            ([1], 1, 0),
            ([3,1,2], 3, 0),
            ([6,7,1,2,3,4,5], 4, 5),
        ]
        for arr, target, expected in random.sample(cases, 3):
            n = len(arr)
            input_str = f"{n}\n" + " ".join(str(x) for x in arr) + f"\n{target}\n"
            tests.append(TestCase(input_str, str(expected), f"Rotated search {target} in {arr}"))
    else:
        # Generate sorted matrices dynamically with correct expected values
        for _ in range(3):
            n = random.choice([2, 3, 4])
            # Build a matrix where each row and column is sorted
            base = sorted(random.sample(range(1, n * n * 3), n * n))
            matrix = [base[i * n:(i + 1) * n] for i in range(n)]
            flat_sorted = sorted(x for row in matrix for x in row)
            k = random.randint(1, n * n)
            expected = flat_sorted[k - 1]
            lines = [str(n)]
            for row in matrix:
                lines.append(" ".join(str(x) for x in row))
            lines.append(str(k))
            tests.append(TestCase("\n".join(lines) + "\n", str(expected), f"Kth={k} in {n}x{n}"))

    return Task(
        id=f"gen-search-{name}-{random.randint(1000,9999)}",
        title=title, description=desc,
        difficulty=9, category="binary_search",
        test_cases=tests,
        hints=["Tänk binärsökning med modifierade villkor"],
        tags=["binary_search", "algorithm", name],
    )


# ===== NIVÅ 10: EXPERT — AVANCERAD DP, INTERVALL, TRIE =====

def _gen_interval_scheduling() -> Task:
    """Generera intervallschemaläggning-uppgifter."""
    problems = [
        ("max_non_overlapping", "Max antal icke-överlappande intervall",
         "Läs N. Sedan N rader med 'start slut'. "
         "Skriv ut maximalt antal intervall som kan väljas utan överlapp."),
        ("min_remove_overlap", "Minsta antal borttagningar för icke-överlapp",
         "Läs N. Sedan N rader med 'start slut'. "
         "Skriv ut minsta antal intervall som måste tas bort för att inga ska överlappa."),
    ]
    name, title, desc = random.choice(problems)
    tests = []

    def max_non_overlap(intervals):
        intervals.sort(key=lambda x: x[1])
        count = 0
        end = float('-inf')
        for s, e in intervals:
            if s >= end:
                count += 1
                end = e
        return count

    if name == "max_non_overlapping":
        cases = [
            [(1,3),(2,4),(3,5),(0,6)],
            [(1,2),(2,3),(3,4),(1,3)],
            [(1,4),(2,3),(3,5),(7,8)],
            [(0,1),(1,2),(2,3)],
        ]
        for intervals in random.sample(cases, 3):
            n = len(intervals)
            lines = [str(n)]
            for s, e in intervals:
                lines.append(f"{s} {e}")
            expected = max_non_overlap(intervals)
            tests.append(TestCase("\n".join(lines) + "\n", str(expected), f"MaxNonOverlap n={n}"))
    else:
        cases = [
            [(1,2),(2,3),(3,4),(1,3)],
            [(1,2),(1,2),(1,2)],
            [(1,100),(11,22),(1,11),(2,12)],
        ]
        for intervals in cases:
            n = len(intervals)
            lines = [str(n)]
            for s, e in intervals:
                lines.append(f"{s} {e}")
            expected = n - max_non_overlap(intervals)
            tests.append(TestCase("\n".join(lines) + "\n", str(expected), f"MinRemove n={n}"))

    return Task(
        id=f"gen-interval-{name}-{random.randint(1000,9999)}",
        title=title, description=desc,
        difficulty=10, category="interval",
        test_cases=tests,
        hints=["Sortera efter sluttid, greedy-val av icke-överlappande"],
        tags=["greedy", "interval", "sorting", name],
    )


def _gen_trie_operations() -> Task:
    """Generera trie-uppgifter (prefix-träd)."""
    desc = (
        "Implementera ett prefix-träd (trie). "
        "Läs N operationer. Varje rad är 'INSERT ord', 'SEARCH ord' eller 'PREFIX prefix'. "
        "För SEARCH: skriv ut 'true' eller 'false'. "
        "För PREFIX: skriv ut antal ord som börjar med prefixet. "
        "INSERT ger ingen output."
    )
    tests = []
    cases = [
        [
            ("INSERT", "apple"), ("INSERT", "app"), ("INSERT", "apricot"),
            ("SEARCH", "app"), ("SEARCH", "ap"), ("PREFIX", "ap"),
        ],
        [
            ("INSERT", "hello"), ("INSERT", "help"), ("INSERT", "world"),
            ("SEARCH", "hello"), ("SEARCH", "hel"), ("PREFIX", "hel"),
            ("PREFIX", "wor"),
        ],
        [
            ("INSERT", "cat"), ("INSERT", "car"), ("INSERT", "card"),
            ("SEARCH", "car"), ("SEARCH", "care"), ("PREFIX", "car"),
            ("PREFIX", "c"),
        ],
    ]

    for ops in cases:
        # Simulera trie
        trie: dict = {}
        outputs = []
        for op, word in ops:
            if op == "INSERT":
                node = trie
                for ch in word:
                    node = node.setdefault(ch, {})
                node["$"] = True
            elif op == "SEARCH":
                node = trie
                found = True
                for ch in word:
                    if ch not in node:
                        found = False
                        break
                    node = node[ch]
                if found and "$" in node:
                    outputs.append("true")
                else:
                    outputs.append("false")
            elif op == "PREFIX":
                node = trie
                valid = True
                for ch in word:
                    if ch not in node:
                        valid = False
                        break
                    node = node[ch]
                if not valid:
                    outputs.append("0")
                else:
                    # Räkna alla ord under denna nod
                    def count_words(n):
                        c = 1 if "$" in n else 0
                        for k, v in n.items():
                            if k != "$":
                                c += count_words(v)
                        return c
                    outputs.append(str(count_words(node)))

        n = len(ops)
        lines = [str(n)]
        for op, word in ops:
            lines.append(f"{op} {word}")
        expected = "\n".join(outputs)
        tests.append(TestCase("\n".join(lines) + "\n", expected, f"Trie ops n={n}"))

    return Task(
        id=f"gen-trie-ops-{random.randint(1000,9999)}",
        title="Trie-operationer (prefix-träd)", description=desc,
        difficulty=10, category="trie",
        test_cases=tests,
        hints=["Bygg trie med nested dicts, markera ordslut med speciell nyckel"],
        tags=["trie", "data_structure", "string"],
    )


def _gen_dp_advanced() -> Task:
    """Generera avancerade DP-uppgifter (2D, knapsack, edit distance)."""
    problems = [
        ("edit_distance", "Edit Distance (Levenshtein)",
         "Läs två strängar (en per rad). Skriv ut minsta antal operationer "
         "(insert, delete, replace) för att omvandla första till andra."),
        ("knapsack_01", "0/1 Knapsack",
         "Läs kapacitet W och antal föremål N. "
         "Sedan N rader med 'vikt värde'. Skriv ut maximalt värde som ryms."),
        ("longest_common_subseq", "Längsta gemensamma delföljd (LCS)",
         "Läs två strängar (en per rad). Skriv ut längden på den längsta gemensamma delföljden."),
    ]
    name, title, desc = random.choice(problems)
    tests = []

    if name == "edit_distance":
        cases = [
            ("kitten", "sitting", 3),
            ("horse", "ros", 3),
            ("", "abc", 3),
            ("abc", "abc", 0),
            ("intention", "execution", 5),
        ]
        for s1, s2, expected in random.sample(cases, 3):
            tests.append(TestCase(f"{s1}\n{s2}\n", str(expected), f"ED({s1},{s2})"))
    elif name == "knapsack_01":
        raw_cases = [
            (10, [(5,10),(4,40),(6,30),(3,50)]),
            (7, [(1,1),(3,4),(4,5),(5,7)]),
            (0, [(1,1)]),
            (15, [(1,2),(5,10),(10,20),(7,15)]),
        ]
        for W, items in random.sample(raw_cases, 3):
            # Compute correct answer with DP
            n_items = len(items)
            dp = [[0] * (W + 1) for _ in range(n_items + 1)]
            for i in range(1, n_items + 1):
                wi, vi = items[i - 1]
                for c in range(W + 1):
                    dp[i][c] = dp[i - 1][c]
                    if wi <= c:
                        dp[i][c] = max(dp[i][c], dp[i - 1][c - wi] + vi)
            expected = dp[n_items][W]
            lines = [f"{W} {n_items}"]
            for w, v in items:
                lines.append(f"{w} {v}")
            tests.append(TestCase("\n".join(lines) + "\n", str(expected), f"Knapsack W={W}"))
    else:  # LCS
        cases = [
            ("abcde", "ace", 3),
            ("abc", "def", 0),
            ("abcbdab", "bdcab", 4),
            ("AGGTAB", "GXTXAYB", 4),
        ]
        for s1, s2, expected in random.sample(cases, 3):
            tests.append(TestCase(f"{s1}\n{s2}\n", str(expected), f"LCS({s1},{s2})"))

    return Task(
        id=f"gen-dp2-{name}-{random.randint(1000,9999)}",
        title=title, description=desc,
        difficulty=10, category="dp_advanced",
        test_cases=tests,
        hints=["Bygg en 2D DP-tabell, fyll i rad för rad"],
        tags=["dp", "advanced", name],
    )


def _gen_backtracking() -> Task:
    """Generera backtracking-uppgifter."""
    problems = [
        ("n_queens_count", "N-Queens (antal lösningar)",
         "Läs N. Skriv ut antalet sätt att placera N damer på ett NxN schackbräde "
         "så att inga två damer hotar varandra."),
        ("sudoku_valid", "Validera Sudoku-rad",
         "Läs 9 rader med 9 siffror (0 = tom). "
         "Skriv ut 'valid' om alla ifyllda siffror (icke-noll) följer Sudoku-reglerna "
         "(unika per rad, kolumn och 3x3-ruta), annars 'invalid'."),
    ]
    name, title, desc = random.choice(problems)
    tests = []

    if name == "n_queens_count":
        # Kända svar för N-Queens
        answers = {1: 1, 2: 0, 3: 0, 4: 2, 5: 10, 6: 4, 7: 40, 8: 92}
        for n in random.sample([4, 5, 6, 7, 8], 3):
            tests.append(TestCase(f"{n}\n", str(answers[n]), f"N-Queens n={n}"))
    else:
        valid_board = [
            "5 3 0 0 7 0 0 0 0",
            "6 0 0 1 9 5 0 0 0",
            "0 9 8 0 0 0 0 6 0",
            "8 0 0 0 6 0 0 0 3",
            "4 0 0 8 0 3 0 0 1",
            "7 0 0 0 2 0 0 0 6",
            "0 6 0 0 0 0 2 8 0",
            "0 0 0 4 1 9 0 0 5",
            "0 0 0 0 8 0 0 7 9",
        ]
        invalid_board = [
            "5 3 0 0 7 0 0 0 0",
            "6 0 0 1 9 5 0 0 0",
            "0 9 8 0 0 0 0 6 0",
            "8 0 0 0 6 0 0 0 3",
            "4 0 0 8 0 3 0 0 1",
            "7 0 0 0 2 0 0 0 6",
            "0 6 0 0 0 0 2 8 0",
            "0 0 0 4 1 9 0 0 5",
            "0 0 0 0 8 0 0 7 5",  # Dubbel 5 i kolumn 9
        ]
        tests.append(TestCase("\n".join(valid_board) + "\n", "valid", "Valid Sudoku"))
        tests.append(TestCase("\n".join(invalid_board) + "\n", "invalid", "Invalid Sudoku"))
        # Helt tom = valid
        empty = "\n".join(["0 0 0 0 0 0 0 0 0"] * 9)
        tests.append(TestCase(empty + "\n", "valid", "Empty Sudoku"))

    return Task(
        id=f"gen-bt-{name}-{random.randint(1000,9999)}",
        title=title, description=desc,
        difficulty=10, category="backtracking",
        test_cases=tests,
        hints=["Använd backtracking med pruning för att utforska alla möjligheter"],
        tags=["backtracking", "recursion", name],
    )


# ===== NIVÅ 7-10: NYA UTMANANDE UPPGIFTER (kräver resonemang) =====

def _gen_simulation() -> Task:
    """Generera simuleringsuppgifter — kräver att följa komplexa regler steg för steg."""
    problems = [
        ("bank_transactions", "Banktransaktioner",
         "Läs saldo S (heltal). Sedan N transaktioner, en per rad: 'D belopp' (insättning) "
         "eller 'W belopp' (uttag). Uttag som överstiger saldo ignoreras. "
         "Skriv ut slutsaldo och antal avvisade uttag, separerade med mellanslag."),
        ("robot_walk", "Robotpromenad",
         "Läs N kommandon, ett per rad: 'U', 'D', 'L', 'R' (upp/ner/vänster/höger). "
         "Roboten startar på (0,0). Skriv ut slutposition som 'x y' och Manhattan-avstånd "
         "från origo, separerade med nyrad."),
        ("game_of_life_step", "Game of Life (ett steg)",
         "Läs N och M (rader, kolumner). Sedan N rader med M tecken ('.' = död, '#' = levande). "
         "Beräkna ETT steg av Conways Game of Life. Skriv ut det nya rutnätet."),
    ]
    name, title, desc = random.choice(problems)
    tests = []

    if name == "bank_transactions":
        for _ in range(3):
            balance = random.randint(100, 10000)
            n = random.randint(3, 8)
            txns = []
            rejected = 0
            cur = balance
            for _ in range(n):
                if random.random() < 0.5:
                    amt = random.randint(1, 500)
                    txns.append(f"D {amt}")
                    cur += amt
                else:
                    amt = random.randint(1, cur + 200)
                    txns.append(f"W {amt}")
                    if amt > cur:
                        rejected += 1
                    else:
                        cur -= amt
            inp = f"{balance}\n{n}\n" + "\n".join(txns) + "\n"
            tests.append(TestCase(inp, f"{cur} {rejected}", f"Balance={balance}, {n} txns"))
    elif name == "robot_walk":
        for _ in range(3):
            n = random.randint(3, 10)
            dirs = random.choices(["U", "D", "L", "R"], k=n)
            x, y = 0, 0
            for d in dirs:
                if d == "U": y += 1
                elif d == "D": y -= 1
                elif d == "R": x += 1
                elif d == "L": x -= 1
            manhattan = abs(x) + abs(y)
            inp = f"{n}\n" + "\n".join(dirs) + "\n"
            tests.append(TestCase(inp, f"{x} {y}\n{manhattan}", f"{n} moves"))
    else:  # game_of_life_step
        for _ in range(3):
            n, m = random.randint(3, 5), random.randint(3, 5)
            grid = [["#" if random.random() < 0.35 else "." for _ in range(m)] for _ in range(n)]
            new_grid = [row[:] for row in grid]
            for r in range(n):
                for c in range(m):
                    neighbors = 0
                    for dr in [-1, 0, 1]:
                        for dc in [-1, 0, 1]:
                            if dr == 0 and dc == 0:
                                continue
                            nr, nc = r + dr, c + dc
                            if 0 <= nr < n and 0 <= nc < m and grid[nr][nc] == "#":
                                neighbors += 1
                    if grid[r][c] == "#":
                        new_grid[r][c] = "#" if neighbors in (2, 3) else "."
                    else:
                        new_grid[r][c] = "#" if neighbors == 3 else "."
            inp = f"{n} {m}\n" + "\n".join("".join(row) for row in grid) + "\n"
            out = "\n".join("".join(row) for row in new_grid)
            tests.append(TestCase(inp, out, f"{n}x{m} grid"))

    return Task(
        id=f"gen-sim-{name}-{random.randint(1000,9999)}",
        title=title, description=desc,
        difficulty=7, category="simulation",
        test_cases=tests,
        hints=["Simulera processen steg för steg, håll koll på tillståndet"],
        tags=["simulation", "state_machine", name],
    )


def _gen_string_parsing() -> Task:
    """Generera strängparsning — kräver att tolka och bearbeta komplex input."""
    problems = [
        ("eval_rpn", "Evaluera Reverse Polish Notation",
         "Läs N tokens (ett per rad). Tokens är heltal eller operatorer (+, -, *, /). "
         "Evaluera uttrycket i RPN. Division är heltalsdivision (trunkerad mot noll). "
         "Skriv ut resultatet."),
        ("csv_aggregate", "CSV-aggregering",
         "Läs N rader med CSV-data: 'namn,kategori,värde' (värde är heltal). "
         "Skriv ut summan per kategori, sorterad alfabetiskt, en per rad som 'kategori:summa'."),
        ("bracket_depth", "Max parentesdjup",
         "Läs en sträng med parenteser (), [], {}. "
         "Skriv ut maximalt nästlingsdjup. Om parenteserna är obalanserade, skriv -1."),
    ]
    name, title, desc = random.choice(problems)
    tests = []

    if name == "eval_rpn":
        cases = [
            (["2", "1", "+", "3", "*"], 9),
            (["4", "13", "5", "/", "+"], 6),
            (["10", "6", "9", "3", "+", "-11", "*", "/", "*", "17", "+", "5", "+"], 22),
        ]
        for tokens, expected in cases:
            inp = f"{len(tokens)}\n" + "\n".join(tokens) + "\n"
            tests.append(TestCase(inp, str(expected), f"RPN: {' '.join(tokens)}"))
    elif name == "csv_aggregate":
        for _ in range(3):
            categories = random.sample(["food", "tech", "books", "travel", "health"], 3)
            names = ["alice", "bob", "carol", "dave", "eve"]
            rows = []
            sums = {}
            n = random.randint(4, 8)
            for _ in range(n):
                nm = random.choice(names)
                cat = random.choice(categories)
                val = random.randint(10, 500)
                rows.append(f"{nm},{cat},{val}")
                sums[cat] = sums.get(cat, 0) + val
            inp = f"{n}\n" + "\n".join(rows) + "\n"
            out = "\n".join(f"{k}:{v}" for k, v in sorted(sums.items()))
            tests.append(TestCase(inp, out, f"{n} CSV rows"))
    else:  # bracket_depth
        for _ in range(3):
            # Generate balanced brackets with known depth
            depth = random.randint(1, 5)
            s = ""
            pairs = [("(", ")"), ("[", "]"), ("{", "}")]
            for d in range(depth):
                o, c = random.choice(pairs)
                s = o + s + c
            # Add some flat brackets
            for _ in range(random.randint(0, 3)):
                o, c = random.choice(pairs)
                if random.random() < 0.5:
                    s = o + c + s
                else:
                    s = s + o + c
            tests.append(TestCase(s + "\n", str(depth), f"Depth of '{s}'"))
        # Add an unbalanced case
        tests.append(TestCase("([)]\n", str(-1), "Unbalanced"))

    return Task(
        id=f"gen-parse-{name}-{random.randint(1000,9999)}",
        title=title, description=desc,
        difficulty=8, category="parsing",
        test_cases=tests,
        hints=["Använd en stack för att hålla koll på tillståndet"],
        tags=["parsing", "string", "stack", name],
    )


def _gen_graph_advanced() -> Task:
    """Generera avancerade grafuppgifter — kräver BFS/DFS med tillståndshantering."""
    problems = [
        ("bipartite", "Bipartit graf?",
         "Läs N (noder) och M (kanter). Sedan M rader med 'u v'. "
         "Skriv 'yes' om grafen är bipartit, annars 'no'."),
        ("count_components", "Räkna sammanhängande komponenter",
         "Läs N (noder, 0-indexerade) och M (kanter). Sedan M rader med 'u v' (oriktade). "
         "Skriv ut antalet sammanhängande komponenter."),
        ("cycle_detect", "Cykeldetektering",
         "Läs N (noder) och M (riktade kanter). Sedan M rader med 'u v'. "
         "Skriv 'yes' om grafen innehåller en cykel, annars 'no'."),
    ]
    name, title, desc = random.choice(problems)
    tests = []

    if name == "bipartite":
        # Bipartite graph (even cycle)
        for _ in range(2):
            n = random.randint(4, 8)
            edges = []
            # Build bipartite: two sets
            set_a = list(range(n // 2))
            set_b = list(range(n // 2, n))
            for a in set_a:
                b = random.choice(set_b)
                edges.append((a, b))
            random.shuffle(edges)
            inp = f"{n} {len(edges)}\n" + "\n".join(f"{u} {v}" for u, v in edges) + "\n"
            tests.append(TestCase(inp, "yes", f"Bipartite {n} nodes"))
        # Non-bipartite (odd cycle)
        edges_odd = [(0, 1), (1, 2), (2, 0)]
        inp = f"3 3\n" + "\n".join(f"{u} {v}" for u, v in edges_odd) + "\n"
        tests.append(TestCase(inp, "no", "Triangle = not bipartite"))

    elif name == "count_components":
        for _ in range(3):
            n = random.randint(4, 8)
            # Build random components
            parent = list(range(n))
            def find(x):
                while parent[x] != x:
                    parent[x] = parent[parent[x]]
                    x = parent[x]
                return x
            def union(a, b):
                pa, pb = find(a), find(b)
                if pa != pb:
                    parent[pa] = pb
            edges = []
            num_edges = random.randint(1, n)
            for _ in range(num_edges):
                u, v = random.randint(0, n-1), random.randint(0, n-1)
                if u != v:
                    edges.append((u, v))
                    union(u, v)
            components = len(set(find(i) for i in range(n)))
            inp = f"{n} {len(edges)}\n" + "\n".join(f"{u} {v}" for u, v in edges) + "\n"
            tests.append(TestCase(inp, str(components), f"{n} nodes, {len(edges)} edges"))

    else:  # cycle_detect
        # Graph with cycle
        edges_cycle = [(0, 1), (1, 2), (2, 0)]
        inp = f"3 3\n" + "\n".join(f"{u} {v}" for u, v in edges_cycle) + "\n"
        tests.append(TestCase(inp, "yes", "3-node cycle"))
        # DAG (no cycle)
        edges_dag = [(0, 1), (0, 2), (1, 3), (2, 3)]
        inp = f"4 4\n" + "\n".join(f"{u} {v}" for u, v in edges_dag) + "\n"
        tests.append(TestCase(inp, "no", "DAG"))
        # Larger with cycle
        edges_big = [(0, 1), (1, 2), (2, 3), (3, 1)]
        inp = f"4 4\n" + "\n".join(f"{u} {v}" for u, v in edges_big) + "\n"
        tests.append(TestCase(inp, "yes", "4-node with back edge"))

    return Task(
        id=f"gen-graph2-{name}-{random.randint(1000,9999)}",
        title=title, description=desc,
        difficulty=9, category="graph_advanced",
        test_cases=tests,
        hints=["Använd BFS/DFS med färgmarkering för att lösa detta"],
        tags=["graph", "bfs", "dfs", name],
    )


def _gen_math_challenge() -> Task:
    """Generera matematiska utmaningar — kräver modular aritmetik, primtal, etc."""
    problems = [
        ("sieve_primes", "Primtal med Sieve of Eratosthenes",
         "Läs N. Skriv ut alla primtal <= N, separerade med mellanslag."),
        ("gcd_lcm", "GCD och LCM",
         "Läs N heltal (på en rad, mellanrumsseparerade). "
         "Skriv ut GCD och LCM av alla tal, separerade med mellanslag."),
        ("modular_exp", "Modulär exponentiering",
         "Läs tre heltal: bas, exponent, modulus. "
         "Beräkna (bas^exponent) mod modulus. Skriv ut resultatet."),
    ]
    name, title, desc = random.choice(problems)
    tests = []

    if name == "sieve_primes":
        for _ in range(3):
            n = random.randint(10, 100)
            primes = []
            sieve = [True] * (n + 1)
            sieve[0] = sieve[1] = False
            for i in range(2, n + 1):
                if sieve[i]:
                    primes.append(i)
                    for j in range(i * i, n + 1, i):
                        sieve[j] = False
            tests.append(TestCase(f"{n}\n", " ".join(map(str, primes)), f"Primes <= {n}"))
    elif name == "gcd_lcm":
        for _ in range(3):
            k = random.randint(2, 5)
            nums = [random.randint(2, 200) for _ in range(k)]
            g = nums[0]
            for x in nums[1:]:
                g = math.gcd(g, x)
            l = nums[0]
            for x in nums[1:]:
                l = l * x // math.gcd(l, x)
            inp = " ".join(map(str, nums)) + "\n"
            tests.append(TestCase(inp, f"{g} {l}", f"GCD/LCM of {nums}"))
    else:  # modular_exp
        for _ in range(3):
            base = random.randint(2, 50)
            exp = random.randint(5, 100)
            mod = random.randint(7, 1000)
            result = pow(base, exp, mod)
            tests.append(TestCase(f"{base} {exp} {mod}\n", str(result), f"{base}^{exp} mod {mod}"))

    return Task(
        id=f"gen-math-{name}-{random.randint(1000,9999)}",
        title=title, description=desc,
        difficulty=8, category="math_challenge",
        test_cases=tests,
        hints=["Tänk på effektiva algoritmer — brute force fungerar inte för stora tal"],
        tags=["math", "number_theory", name],
    )


def _gen_greedy() -> Task:
    """Generera greedy-algoritm-uppgifter."""
    problems = [
        ("activity_selection", "Aktivitetsval",
         "Läs N aktiviteter, en per rad som 'start slut'. "
         "Skriv ut maximalt antal aktiviteter som kan genomföras utan överlapp."),
        ("coin_greedy", "Minsta antal mynt (greedy)",
         "Läs ett belopp och sedan N myntvalörer (sorterade fallande). "
         "Skriv ut minsta antal mynt för att nå beloppet. Om omöjligt, skriv -1."),
        ("jump_game", "Jump Game",
         "Läs N heltal (max hopp från varje position). "
         "Skriv 'yes' om du kan nå sista positionen från index 0, annars 'no'."),
    ]
    name, title, desc = random.choice(problems)
    tests = []

    if name == "activity_selection":
        for _ in range(3):
            n = random.randint(3, 8)
            activities = []
            for _ in range(n):
                s = random.randint(0, 20)
                e = s + random.randint(1, 5)
                activities.append((s, e))
            # Greedy: sort by end time
            sorted_acts = sorted(activities, key=lambda x: x[1])
            count = 0
            end = -1
            for s, e in sorted_acts:
                if s >= end:
                    count += 1
                    end = e
            inp = f"{n}\n" + "\n".join(f"{s} {e}" for s, e in activities) + "\n"
            tests.append(TestCase(inp, str(count), f"{n} activities"))
    elif name == "coin_greedy":
        for _ in range(3):
            coins = sorted(random.sample([1, 2, 5, 10, 20, 25, 50, 100], random.randint(3, 5)), reverse=True)
            amount = random.randint(1, 200)
            # Greedy coin change (works when coins include 1)
            if 1 not in coins:
                coins.append(1)
                coins.sort(reverse=True)
            remaining = amount
            count = 0
            for c in coins:
                count += remaining // c
                remaining %= c
            inp = f"{amount}\n" + " ".join(map(str, coins)) + "\n"
            tests.append(TestCase(inp, str(count), f"Amount={amount}, coins={coins}"))
    else:  # jump_game
        # Reachable
        for _ in range(2):
            n = random.randint(3, 7)
            nums = [random.randint(1, 3) for _ in range(n - 1)] + [0]
            tests.append(TestCase(" ".join(map(str, nums)) + "\n", "yes", f"Reachable: {nums}"))
        # Unreachable
        nums = [3, 2, 1, 0, 4]
        tests.append(TestCase(" ".join(map(str, nums)) + "\n", "no", "Stuck at index 3"))

    return Task(
        id=f"gen-greedy-{name}-{random.randint(1000,9999)}",
        title=title, description=desc,
        difficulty=9, category="greedy",
        test_cases=tests,
        hints=["Greedy: gör det lokalt bästa valet i varje steg"],
        tags=["greedy", "algorithm", name],
    )


def _gen_tree_problem() -> Task:
    """Generera träduppgifter — kräver rekursiv traversering."""
    problems = [
        ("tree_height", "Trädets höjd",
         "Läs N noder. Sedan N-1 rader med 'förälder barn' (0-indexerat, rot=0). "
         "Skriv ut trädets höjd (antal kanter i längsta vägen från rot till löv)."),
        ("tree_sum_levels", "Summor per nivå",
         "Läs N. Sedan N rader med 'nod_id värde förälder_id' (rot har förälder -1). "
         "Skriv ut summan av värden per nivå, en per rad, från rot-nivån."),
    ]
    name, title, desc = random.choice(problems)
    tests = []

    if name == "tree_height":
        for _ in range(3):
            n = random.randint(3, 8)
            # Build random tree
            edges = []
            for i in range(1, n):
                parent = random.randint(0, i - 1)
                edges.append((parent, i))
            # BFS to find height
            children = {i: [] for i in range(n)}
            for p, c in edges:
                children[p].append(c)
            height = 0
            queue = [(0, 0)]
            while queue:
                node, depth = queue.pop(0)
                height = max(height, depth)
                for child in children[node]:
                    queue.append((child, depth + 1))
            inp = f"{n}\n" + "\n".join(f"{p} {c}" for p, c in edges) + "\n"
            tests.append(TestCase(inp, str(height), f"Tree with {n} nodes"))
    else:  # tree_sum_levels
        for _ in range(3):
            n = random.randint(3, 7)
            values = [random.randint(1, 50) for _ in range(n)]
            parents = [-1] + [random.randint(0, max(0, i - 1)) for i in range(1, n)]
            # BFS to get levels
            children = {i: [] for i in range(n)}
            for i in range(1, n):
                children[parents[i]].append(i)
            level_sums = []
            queue = [0]
            while queue:
                level_sums.append(sum(values[node] for node in queue))
                next_q = []
                for node in queue:
                    next_q.extend(children[node])
                queue = next_q
            inp = f"{n}\n" + "\n".join(f"{i} {values[i]} {parents[i]}" for i in range(n)) + "\n"
            out = "\n".join(map(str, level_sums))
            tests.append(TestCase(inp, out, f"Tree {n} nodes"))

    return Task(
        id=f"gen-tree-{name}-{random.randint(1000,9999)}",
        title=title, description=desc,
        difficulty=8, category="tree",
        test_cases=tests,
        hints=["Bygg ett träd från input och traversera med BFS eller DFS"],
        tags=["tree", "bfs", "dfs", "recursion", name],
    )


def _gen_sliding_window() -> Task:
    """Generera sliding window-uppgifter."""
    problems = [
        ("max_sum_k", "Max summa av K konsekutiva element",
         "Läs N och K. Sedan N heltal. Skriv ut den maximala summan av K konsekutiva element."),
        ("longest_unique_substr", "Längsta delsträng utan upprepning",
         "Läs en sträng. Skriv ut längden på den längsta delsträngen utan upprepade tecken."),
    ]
    name, title, desc = random.choice(problems)
    tests = []

    if name == "max_sum_k":
        for _ in range(3):
            n = random.randint(5, 12)
            k = random.randint(2, min(4, n))
            arr = [random.randint(-10, 50) for _ in range(n)]
            # Sliding window
            best = cur = sum(arr[:k])
            for i in range(k, n):
                cur += arr[i] - arr[i - k]
                best = max(best, cur)
            inp = f"{n} {k}\n" + " ".join(map(str, arr)) + "\n"
            tests.append(TestCase(inp, str(best), f"K={k}, arr={arr}"))
    else:  # longest_unique_substr
        for _ in range(3):
            length = random.randint(5, 15)
            s = "".join(random.choices(string.ascii_lowercase[:8], k=length))
            # Sliding window
            best = 0
            seen = {}
            left = 0
            for right, ch in enumerate(s):
                if ch in seen and seen[ch] >= left:
                    left = seen[ch] + 1
                seen[ch] = right
                best = max(best, right - left + 1)
            tests.append(TestCase(s + "\n", str(best), f"'{s}'"))

    return Task(
        id=f"gen-sw-{name}-{random.randint(1000,9999)}",
        title=title, description=desc,
        difficulty=8, category="sliding_window",
        test_cases=tests,
        hints=["Använd sliding window-teknik: flytta vänster/höger pekare"],
        tags=["sliding_window", "array", name],
    )


def _gen_heap_problem() -> Task:
    """Generera heap/priority queue-uppgifter."""
    problems = [
        ("kth_largest", "K:te största elementet",
         "Läs N heltal (på en rad) och sedan K. Skriv ut det K:te största elementet."),
        ("merge_sorted_lists", "Sammanfoga sorterade listor",
         "Läs K (antal listor). Sedan K rader, varje rad börjar med längden N "
         "följt av N sorterade heltal. Skriv ut alla element sammanfogade i sorterad ordning."),
    ]
    name, title, desc = random.choice(problems)
    tests = []

    if name == "kth_largest":
        for _ in range(3):
            n = random.randint(5, 15)
            arr = [random.randint(-100, 100) for _ in range(n)]
            k = random.randint(1, n)
            result = sorted(arr, reverse=True)[k - 1]
            inp = " ".join(map(str, arr)) + f"\n{k}\n"
            tests.append(TestCase(inp, str(result), f"K={k} of {arr}"))
    else:  # merge_sorted_lists
        for _ in range(3):
            k = random.randint(2, 4)
            lists = []
            all_vals = []
            lines = [str(k)]
            for _ in range(k):
                n = random.randint(2, 5)
                lst = sorted(random.randint(1, 100) for _ in range(n))
                lists.append(lst)
                all_vals.extend(lst)
                lines.append(f"{n} " + " ".join(map(str, lst)))
            all_vals.sort()
            inp = "\n".join(lines) + "\n"
            tests.append(TestCase(inp, " ".join(map(str, all_vals)), f"{k} lists"))

    return Task(
        id=f"gen-heap-{name}-{random.randint(1000,9999)}",
        title=title, description=desc,
        difficulty=9, category="heap",
        test_cases=tests,
        hints=["Använd en heap (priority queue) eller sortering"],
        tags=["heap", "sorting", "priority_queue", name],
    )


# ===== GENERATOR REGISTRY =====

GENERATORS = [
    (1, _gen_arithmetic),
    (2, _gen_string_transform),
    (2, _gen_pattern_print),
    (3, _gen_list_operation),
    (3, _gen_number_theory),
    (4, _gen_dict_problem),
    (4, _gen_algorithm),
    (4, _gen_recursion),
    (4, _gen_matrix),
    (5, _gen_sorting_algorithm),
    (5, _gen_string_advanced),
    (6, _gen_stack_queue),
    (6, _gen_linked_list_sim),
    (7, _gen_functional),
    (7, _gen_graph_basic),
    (8, _gen_dp),
    (8, _gen_combinatorics),
    (9, _gen_shortest_path),
    (9, _gen_topological_sort),
    (9, _gen_binary_search_advanced),
    (10, _gen_interval_scheduling),
    (10, _gen_trie_operations),
    (10, _gen_dp_advanced),
    (10, _gen_backtracking),
    # Nya utmanande uppgifter (kräver resonemang, ej S0-lösbart)
    (7, _gen_simulation),
    (8, _gen_string_parsing),
    (8, _gen_math_challenge),
    (8, _gen_tree_problem),
    (8, _gen_sliding_window),
    (9, _gen_graph_advanced),
    (9, _gen_greedy),
    (9, _gen_heap_problem),
]


def generate_task(difficulty: int | None = None) -> Task:
    """Generera en slumpmässig uppgift.
    
    Args:
        difficulty: Önskad svårighetsgrad (1-10), eller None för slumpmässig
    """
    if difficulty is not None:
        eligible = [fn for d, fn in GENERATORS if d == difficulty]
        if not eligible:
            eligible = [fn for d, fn in GENERATORS if abs(d - difficulty) <= 1]
    else:
        eligible = [fn for _, fn in GENERATORS]

    if not eligible:
        eligible = [fn for _, fn in GENERATORS]

    gen_fn = random.choice(eligible)
    return gen_fn()


def generate_batch(n: int = 10, difficulty: int | None = None) -> list[Task]:
    """Generera en batch med uppgifter."""
    return [generate_task(difficulty) for _ in range(n)]
