"""
Progressiv läroplan för Frankenstein AI.

5 nivåer × ~6 uppgifter = 30 uppgifter totalt:
  Nivå 1: Grundläggande (print, variabler, input)
  Nivå 2: Kontrollflöde (if/else, loopar)
  Nivå 3: Funktioner & listor
  Nivå 4: Strängar & algoritmer
  Nivå 5: Avancerat (rekursion, dictionaries, klasser)
"""

from programming_env import Task, TestCase


def get_curriculum() -> list[Task]:
    """Returnera hela läroplanen sorterad efter svårighet."""
    tasks = []

    # ===== NIVÅ 1: GRUNDLÄGGANDE =====

    tasks.append(Task(
        id="1.1", title="Hello World",
        description="Skriv ett program som skriver ut exakt: Hello, World!",
        difficulty=1, category="basics",
        test_cases=[
            TestCase("", "Hello, World!", "Ska skriva ut Hello, World!"),
        ],
        hints=["Använd print()"],
        tags=["print"],
    ))

    tasks.append(Task(
        id="1.2", title="Läs och eka",
        description="Läs en rad från input och skriv ut den igen.",
        difficulty=1, category="basics",
        test_cases=[
            TestCase("hej\n", "hej", "Eka tillbaka input"),
            TestCase("Python\n", "Python", "Eka Python"),
            TestCase("123\n", "123", "Eka siffror"),
        ],
        hints=["Använd input() och print()"],
        tags=["input", "print"],
    ))

    tasks.append(Task(
        id="1.3", title="Summa av två tal",
        description="Läs två heltal (ett per rad) och skriv ut deras summa.",
        difficulty=1, category="basics",
        test_cases=[
            TestCase("3\n5\n", "8", "3 + 5 = 8"),
            TestCase("0\n0\n", "0", "0 + 0 = 0"),
            TestCase("-1\n1\n", "0", "-1 + 1 = 0"),
            TestCase("100\n200\n", "300", "100 + 200 = 300"),
        ],
        hints=["Använd int(input()) för att läsa heltal"],
        tags=["input", "int", "addition"],
    ))

    tasks.append(Task(
        id="1.4", title="Rektangelns area",
        description="Läs bredd och höjd (heltal, ett per rad) och skriv ut arean.",
        difficulty=1, category="basics",
        test_cases=[
            TestCase("5\n3\n", "15", "5 * 3 = 15"),
            TestCase("1\n1\n", "1", "1 * 1 = 1"),
            TestCase("10\n20\n", "200", "10 * 20 = 200"),
        ],
        hints=["Area = bredd * höjd"],
        tags=["input", "multiplication"],
    ))

    tasks.append(Task(
        id="1.5", title="Temperaturkonvertering",
        description="Läs en temperatur i Celsius (heltal) och skriv ut den i Fahrenheit (heltal, avrundat nedåt).\nFormel: F = C * 9 // 5 + 32",
        difficulty=1, category="basics",
        test_cases=[
            TestCase("0\n", "32", "0°C = 32°F"),
            TestCase("100\n", "212", "100°C = 212°F"),
            TestCase("-40\n", "-40", "-40°C = -40°F"),
            TestCase("37\n", "98", "37°C = 98°F"),
        ],
        hints=["F = C * 9 // 5 + 32"],
        tags=["math", "conversion"],
    ))

    # ===== NIVÅ 2: KONTROLLFLÖDE =====

    tasks.append(Task(
        id="2.1", title="Jämnt eller udda",
        description="Läs ett heltal och skriv ut 'even' om det är jämnt, annars 'odd'.",
        difficulty=2, category="control",
        test_cases=[
            TestCase("4\n", "even", "4 är jämnt"),
            TestCase("7\n", "odd", "7 är udda"),
            TestCase("0\n", "even", "0 är jämnt"),
            TestCase("-3\n", "odd", "-3 är udda"),
        ],
        hints=["Använd % (modulo) operatorn"],
        tags=["if", "modulo"],
    ))

    tasks.append(Task(
        id="2.2", title="Största av tre",
        description="Läs tre heltal (ett per rad) och skriv ut det största.",
        difficulty=2, category="control",
        test_cases=[
            TestCase("1\n2\n3\n", "3", "Max av 1,2,3"),
            TestCase("5\n5\n5\n", "5", "Alla lika"),
            TestCase("-1\n-2\n-3\n", "-1", "Negativa tal"),
            TestCase("100\n1\n50\n", "100", "Första är störst"),
        ],
        hints=["Använd max() eller if/elif/else"],
        tags=["if", "comparison"],
    ))

    tasks.append(Task(
        id="2.3", title="FizzBuzz (ett tal)",
        description="Läs ett heltal n. Om det är delbart med 3 och 5: skriv 'FizzBuzz'. Om bara 3: 'Fizz'. Om bara 5: 'Buzz'. Annars: skriv talet.",
        difficulty=2, category="control",
        test_cases=[
            TestCase("15\n", "FizzBuzz", "15 delbart med 3 och 5"),
            TestCase("9\n", "Fizz", "9 delbart med 3"),
            TestCase("10\n", "Buzz", "10 delbart med 5"),
            TestCase("7\n", "7", "7 inte delbart"),
            TestCase("30\n", "FizzBuzz", "30 delbart med 3 och 5"),
        ],
        hints=["Kontrollera 15 (3*5) först, sedan 3, sedan 5"],
        tags=["if", "modulo", "fizzbuzz"],
    ))

    tasks.append(Task(
        id="2.4", title="Räkna till N",
        description="Läs ett heltal n och skriv ut talen 1 till n, ett per rad.",
        difficulty=2, category="control",
        test_cases=[
            TestCase("5\n", "1\n2\n3\n4\n5", "Räkna 1-5"),
            TestCase("1\n", "1", "Bara 1"),
            TestCase("3\n", "1\n2\n3", "Räkna 1-3"),
        ],
        hints=["Använd for i in range(1, n+1)"],
        tags=["for", "range"],
    ))

    tasks.append(Task(
        id="2.5", title="Summa 1 till N",
        description="Läs ett heltal n och skriv ut summan av alla tal från 1 till n.",
        difficulty=2, category="control",
        test_cases=[
            TestCase("5\n", "15", "1+2+3+4+5 = 15"),
            TestCase("1\n", "1", "Summa av 1"),
            TestCase("10\n", "55", "1+...+10 = 55"),
            TestCase("100\n", "5050", "Gauss: 100*101/2"),
        ],
        hints=["Använd en loop eller formeln n*(n+1)//2"],
        tags=["for", "sum"],
    ))

    tasks.append(Task(
        id="2.6", title="Multiplikationstabell",
        description="Läs ett heltal n och skriv ut multiplikationstabellen för n (1*n till 10*n), ett resultat per rad.",
        difficulty=2, category="control",
        test_cases=[
            TestCase("3\n", "3\n6\n9\n12\n15\n18\n21\n24\n27\n30", "3:ans tabell"),
            TestCase("1\n", "1\n2\n3\n4\n5\n6\n7\n8\n9\n10", "1:ans tabell"),
            TestCase("5\n", "5\n10\n15\n20\n25\n30\n35\n40\n45\n50", "5:ans tabell"),
        ],
        hints=["for i in range(1, 11): print(i * n)"],
        tags=["for", "multiplication"],
    ))

    # ===== NIVÅ 3: FUNKTIONER & LISTOR =====

    tasks.append(Task(
        id="3.1", title="Omvänd sträng",
        description="Läs en sträng och skriv ut den baklänges.",
        difficulty=3, category="strings",
        test_cases=[
            TestCase("hello\n", "olleh", "hello baklänges"),
            TestCase("Python\n", "nohtyP", "Python baklänges"),
            TestCase("a\n", "a", "Ett tecken"),
            TestCase("12345\n", "54321", "Siffror baklänges"),
        ],
        hints=["Använd slicing: s[::-1]"],
        tags=["string", "slicing"],
    ))

    tasks.append(Task(
        id="3.2", title="Räkna vokaler",
        description="Läs en sträng och skriv ut antalet vokaler (a, e, i, o, u, case-insensitive).",
        difficulty=3, category="strings",
        test_cases=[
            TestCase("hello\n", "2", "e och o"),
            TestCase("AEIOU\n", "5", "Alla vokaler"),
            TestCase("xyz\n", "0", "Inga vokaler"),
            TestCase("Programming\n", "3", "o, a, i"),
        ],
        hints=["Konvertera till lowercase och räkna tecken i 'aeiou'"],
        tags=["string", "counting"],
    ))

    tasks.append(Task(
        id="3.3", title="Lista: Min och Max",
        description="Läs N (antal tal), sedan N heltal (ett per rad). Skriv ut min och max separerade med mellanslag.",
        difficulty=3, category="lists",
        test_cases=[
            TestCase("5\n3\n1\n4\n1\n5\n", "1 5", "Min=1, Max=5"),
            TestCase("1\n42\n", "42 42", "Ett tal"),
            TestCase("3\n-5\n0\n5\n", "-5 5", "Negativa tal"),
        ],
        hints=["Läs in alla tal i en lista, använd min() och max()"],
        tags=["list", "min", "max"],
    ))

    tasks.append(Task(
        id="3.4", title="Fakultet",
        description="Läs ett heltal n (0 <= n <= 20) och skriv ut n! (n fakultet).",
        difficulty=3, category="functions",
        test_cases=[
            TestCase("0\n", "1", "0! = 1"),
            TestCase("1\n", "1", "1! = 1"),
            TestCase("5\n", "120", "5! = 120"),
            TestCase("10\n", "3628800", "10!"),
            TestCase("20\n", "2432902008176640000", "20!"),
        ],
        hints=["Använd en loop eller rekursion: n! = n * (n-1)!"],
        tags=["math", "factorial", "loop"],
    ))

    tasks.append(Task(
        id="3.5", title="Fibonacci",
        description="Läs ett heltal n och skriv ut de första n Fibonacci-talen separerade med mellanslag. F(1)=0, F(2)=1, F(k)=F(k-1)+F(k-2).",
        difficulty=3, category="functions",
        test_cases=[
            TestCase("1\n", "0", "Första talet"),
            TestCase("2\n", "0 1", "Två första"),
            TestCase("5\n", "0 1 1 2 3", "Fem första"),
            TestCase("8\n", "0 1 1 2 3 5 8 13", "Åtta första"),
        ],
        hints=["Bygg en lista: fib = [0, 1], sedan fib.append(fib[-1] + fib[-2])"],
        tags=["fibonacci", "loop", "list"],
    ))

    tasks.append(Task(
        id="3.6", title="Palindrom",
        description="Läs en sträng och skriv ut 'yes' om den är ett palindrom (samma framifrån och bakifrån, case-insensitive), annars 'no'.",
        difficulty=3, category="strings",
        test_cases=[
            TestCase("racecar\n", "yes", "racecar är palindrom"),
            TestCase("hello\n", "no", "hello är inte palindrom"),
            TestCase("Madam\n", "yes", "Madam case-insensitive"),
            TestCase("a\n", "yes", "Ett tecken"),
            TestCase("ab\n", "no", "ab inte palindrom"),
        ],
        hints=["s.lower() == s.lower()[::-1]"],
        tags=["string", "palindrome"],
    ))

    # ===== NIVÅ 4: ALGORITMER =====

    tasks.append(Task(
        id="4.1", title="Primtal",
        description="Läs ett heltal n och skriv ut 'prime' om det är ett primtal, annars 'not prime'. (n >= 2)",
        difficulty=4, category="algorithms",
        test_cases=[
            TestCase("2\n", "prime", "2 är primtal"),
            TestCase("7\n", "prime", "7 är primtal"),
            TestCase("4\n", "not prime", "4 = 2*2"),
            TestCase("1000000007\n", "prime", "Stort primtal"),
            TestCase("100\n", "not prime", "100 = 4*25"),
        ],
        hints=["Testa delbarhet upp till sqrt(n)"],
        tags=["prime", "math", "algorithm"],
    ))

    tasks.append(Task(
        id="4.2", title="Sortera lista",
        description="Läs N, sedan N heltal. Skriv ut dem sorterade i stigande ordning, separerade med mellanslag.",
        difficulty=4, category="algorithms",
        test_cases=[
            TestCase("5\n3\n1\n4\n1\n5\n", "1 1 3 4 5", "Sortera 5 tal"),
            TestCase("1\n42\n", "42", "Ett tal"),
            TestCase("4\n-3\n0\n-1\n2\n", "-3 -1 0 2", "Negativa tal"),
        ],
        hints=["Läs in i lista, använd sorted() eller .sort()"],
        tags=["sorting", "list"],
    ))

    tasks.append(Task(
        id="4.3", title="Binärsökning",
        description="Läs N, sedan N sorterade heltal, sedan ett söktal. Skriv ut index (0-baserat) om det finns, annars -1.",
        difficulty=4, category="algorithms",
        test_cases=[
            TestCase("5\n1\n3\n5\n7\n9\n5\n", "2", "5 finns på index 2"),
            TestCase("5\n1\n3\n5\n7\n9\n4\n", "-1", "4 finns inte"),
            TestCase("1\n42\n42\n", "0", "Ett element, hittat"),
            TestCase("3\n10\n20\n30\n10\n", "0", "Första elementet"),
        ],
        hints=["Använd binärsökning: lo, hi, mid = 0, n-1, (lo+hi)//2"],
        tags=["binary_search", "algorithm"],
    ))

    tasks.append(Task(
        id="4.4", title="Ordfrekvens",
        description="Läs en rad text. Skriv ut varje unikt ord och dess frekvens, ett per rad, sorterat alfabetiskt. Format: 'ord antal'",
        difficulty=4, category="algorithms",
        test_cases=[
            TestCase("the cat sat on the mat\n", "cat 1\nmat 1\non 1\nsat 1\nthe 2", "Ordfrekvens"),
            TestCase("a a a\n", "a 3", "Samma ord"),
            TestCase("hello world\n", "hello 1\nworld 1", "Två unika ord"),
        ],
        hints=["Använd dict eller collections.Counter, sortera med sorted()"],
        tags=["dict", "counting", "sorting"],
    ))

    tasks.append(Task(
        id="4.5", title="GCD (Största gemensamma delare)",
        description="Läs två heltal a och b och skriv ut deras största gemensamma delare (GCD).",
        difficulty=4, category="algorithms",
        test_cases=[
            TestCase("12\n8\n", "4", "GCD(12,8) = 4"),
            TestCase("7\n13\n", "1", "Primtal, GCD = 1"),
            TestCase("100\n75\n", "25", "GCD(100,75) = 25"),
            TestCase("0\n5\n", "5", "GCD(0,5) = 5"),
        ],
        hints=["Euklides algoritm: gcd(a,b) = gcd(b, a%b), basfall: gcd(a,0) = a"],
        tags=["gcd", "recursion", "algorithm"],
    ))

    # ===== NIVÅ 5: AVANCERAT =====

    tasks.append(Task(
        id="5.1", title="Matristransponering",
        description="Läs R och C (rader, kolumner), sedan R rader med C heltal separerade med mellanslag. Skriv ut den transponerade matrisen.",
        difficulty=5, category="advanced",
        test_cases=[
            TestCase("2 3\n1 2 3\n4 5 6\n", "1 4\n2 5\n3 6", "2x3 → 3x2"),
            TestCase("1 3\n1 2 3\n", "1\n2\n3", "1x3 → 3x1"),
            TestCase("3 1\n1\n2\n3\n", "1 2 3", "3x1 → 1x3"),
        ],
        hints=["Använd zip(*matrix) eller nested loops"],
        tags=["matrix", "transpose", "2d"],
    ))

    tasks.append(Task(
        id="5.2", title="Bracket Matching",
        description="Läs en sträng med parenteser ()[]{}. Skriv ut 'valid' om de är korrekt matchade, annars 'invalid'.",
        difficulty=5, category="advanced",
        test_cases=[
            TestCase("([]{})\n", "valid", "Korrekt nästlade"),
            TestCase("([)]\n", "invalid", "Fel ordning"),
            TestCase("(((\n", "invalid", "Obalanserade"),
            TestCase("\n", "valid", "Tom sträng"),
            TestCase("{[()]}\n", "valid", "Djupt nästlade"),
        ],
        hints=["Använd en stack: push vid öppning, pop och matcha vid stängning"],
        tags=["stack", "matching", "algorithm"],
    ))

    tasks.append(Task(
        id="5.3", title="Caesar-chiffer",
        description="Läs en sträng och ett heltal k (shift). Kryptera med Caesar-chiffer (bara a-z och A-Z, behåll andra tecken). Skriv ut resultatet.",
        difficulty=5, category="advanced",
        test_cases=[
            TestCase("abc\n1\n", "bcd", "Shift 1"),
            TestCase("xyz\n3\n", "abc", "Wrap around"),
            TestCase("Hello, World!\n13\n", "Uryyb, Jbeyq!", "ROT13"),
            TestCase("abc\n0\n", "abc", "Ingen shift"),
        ],
        hints=["Använd ord() och chr(), modulo 26 för wrap-around"],
        tags=["cipher", "string", "modulo"],
    ))

    tasks.append(Task(
        id="5.4", title="Flatten nested list",
        description="Läs en rad med en Python-lista (kan vara nästlad). Skriv ut alla element platta, separerade med mellanslag.",
        difficulty=5, category="advanced",
        test_cases=[
            TestCase("[1, [2, 3], [4, [5, 6]]]\n", "1 2 3 4 5 6", "Nästlad lista"),
            TestCase("[1, 2, 3]\n", "1 2 3", "Platt lista"),
            TestCase("[[[[1]]]]\n", "1", "Djupt nästlad"),
        ],
        hints=["Rekursiv funktion: om element är lista, flatten den, annars yield"],
        tags=["recursion", "list", "flatten"],
    ))

    tasks.append(Task(
        id="5.5", title="Enkel RPN-kalkylator",
        description="Läs ett uttryck i Reverse Polish Notation (RPN). Operatorer: + - * /. Skriv ut resultatet som heltal (trunkerat mot noll).",
        difficulty=5, category="advanced",
        test_cases=[
            TestCase("3 4 +\n", "7", "3 + 4 = 7"),
            TestCase("5 1 2 + 4 * + 3 -\n", "14", "Komplext uttryck"),
            TestCase("10 2 /\n", "5", "10 / 2 = 5"),
            TestCase("7 2 -\n", "5", "7 - 2 = 5"),
        ],
        hints=["Använd en stack: push tal, vid operator pop två och beräkna"],
        tags=["stack", "calculator", "rpn"],
    ))

    return tasks


def get_tasks_by_level(level: int) -> list[Task]:
    """Hämta alla uppgifter för en viss nivå."""
    return [t for t in get_curriculum() if t.difficulty == level]


def get_task_by_id(task_id: str) -> Task | None:
    """Hämta en specifik uppgift."""
    for t in get_curriculum():
        if t.id == task_id:
            return t
    return None
