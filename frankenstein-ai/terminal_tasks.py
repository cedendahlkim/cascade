"""
Terminal Task Generator for Frankenstein AI.

Generates infinite terminal-based tasks across categories:
- File management (create, move, rename, find, grep)
- Text processing (sed, awk, sort, uniq, wc)
- Git operations (init, commit, branch, merge)
- Python environment (venv, pip, scripts)
- System info (processes, disk, permissions)
- Data pipelines (CSV processing, JSON transformation)

Inspired by Terminal-Bench 2.0 but designed for continuous training.
"""

import random
import string
import json
from terminal_env import TerminalTask, TerminalTestCase


def _rand_id() -> str:
    return str(random.randint(1000, 9999))


def _rand_word(length: int = 6) -> str:
    return "".join(random.choices(string.ascii_lowercase, k=length))


def _rand_filename(ext: str = "txt") -> str:
    return f"{_rand_word(5)}.{ext}"


# ============================================================
# LEVEL 1-2: Basic file operations
# ============================================================

def _gen_create_file() -> TerminalTask:
    """Create a file with specific content."""
    filename = _rand_filename()
    content = " ".join(_rand_word(random.randint(3, 8)) for _ in range(random.randint(3, 10)))

    return TerminalTask(
        id=f"term-file-create-{_rand_id()}",
        title="Skapa fil med innehåll",
        description=f"Skapa filen '{filename}' med exakt innehållet nedan.",
        instruction=f"Skapa filen '{filename}' som innehåller exakt:\n{content}",
        difficulty=1,
        category="file_management",
        test_cases=[
            TerminalTestCase("Filen existerar", "file_exists", filename, ""),
            TerminalTestCase("Rätt innehåll", "file_equals", filename, content),
        ],
        hints=["Använd echo eller printf med redirect (>)"],
        tags=["file", "create", "echo"],
        max_steps=5,
    )


def _gen_create_directory_structure() -> TerminalTask:
    """Create a directory structure."""
    dirs = [_rand_word(4) for _ in range(random.randint(2, 4))]
    base = _rand_word(5)
    paths = [f"{base}/{d}" for d in dirs]

    tests = [TerminalTestCase(f"Katalog {p} existerar", "dir_exists", p, "") for p in paths]

    return TerminalTask(
        id=f"term-dir-create-{_rand_id()}",
        title="Skapa katalogstruktur",
        description=f"Skapa katalogen '{base}' med underkatalogerna: {', '.join(dirs)}",
        instruction=f"Skapa följande katalogstruktur:\n" + "\n".join(f"  {p}/" for p in paths),
        difficulty=1,
        category="file_management",
        test_cases=tests,
        hints=["Använd mkdir -p"],
        tags=["directory", "mkdir"],
        max_steps=5,
    )


def _gen_move_rename() -> TerminalTask:
    """Move/rename a file."""
    src = _rand_filename()
    dst = _rand_filename()
    content = _rand_word(20)

    return TerminalTask(
        id=f"term-file-move-{_rand_id()}",
        title="Flytta/döp om fil",
        description=f"Filen '{src}' finns i workspace. Döp om den till '{dst}'.",
        instruction=f"Döp om filen '{src}' till '{dst}'. Originalfilen ska inte finnas kvar.",
        difficulty=1,
        category="file_management",
        test_cases=[
            TerminalTestCase(f"{dst} existerar", "file_exists", dst, ""),
            TerminalTestCase(f"{src} borta", "file_not_exists", src, ""),
            TerminalTestCase("Innehåll bevarat", "file_equals", dst, content),
        ],
        hints=["Använd mv"],
        tags=["file", "move", "rename"],
        max_steps=5,
        setup_commands=[f"printf '%s' '{content}' > '{src}'"],
    )


def _gen_copy_file() -> TerminalTask:
    """Copy a file to a new location."""
    src = _rand_filename()
    dest_dir = _rand_word(4)
    content = " ".join(_rand_word(5) for _ in range(5))

    return TerminalTask(
        id=f"term-file-copy-{_rand_id()}",
        title="Kopiera fil till katalog",
        description=f"Kopiera '{src}' till katalogen '{dest_dir}/'.",
        instruction=f"Skapa katalogen '{dest_dir}' och kopiera filen '{src}' dit.",
        difficulty=1,
        category="file_management",
        test_cases=[
            TerminalTestCase("Katalog existerar", "dir_exists", dest_dir, ""),
            TerminalTestCase("Kopia existerar", "file_exists", f"{dest_dir}/{src}", ""),
            TerminalTestCase("Original kvar", "file_exists", src, ""),
            TerminalTestCase("Rätt innehåll", "file_equals", f"{dest_dir}/{src}", content),
        ],
        hints=["Använd mkdir och cp"],
        tags=["file", "copy", "mkdir"],
        max_steps=5,
        setup_commands=[f"printf '%s' '{content}' > '{src}'"],
    )


# ============================================================
# LEVEL 3-4: Text processing
# ============================================================

def _gen_count_lines() -> TerminalTask:
    """Count lines in a file and write result."""
    src = _rand_filename()
    n_lines = random.randint(5, 50)
    lines = [_rand_word(random.randint(3, 15)) for _ in range(n_lines)]
    content = "\n".join(lines)

    return TerminalTask(
        id=f"term-text-count-{_rand_id()}",
        title="Räkna rader i fil",
        description=f"Räkna antalet rader i '{src}' och skriv resultatet till 'result.txt'.",
        instruction=f"Räkna antalet rader i filen '{src}' och skriv BARA antalet (som ett tal) till filen 'result.txt'.",
        difficulty=3,
        category="text_processing",
        test_cases=[
            TerminalTestCase("result.txt existerar", "file_exists", "result.txt", ""),
            TerminalTestCase("Rätt antal rader", "file_equals", "result.txt", str(n_lines)),
        ],
        hints=["Använd wc -l"],
        tags=["text", "wc", "count"],
        max_steps=5,
        setup_commands=[f"cat > '{src}' << 'SETUPEOF'\n{content}\nSETUPEOF"],
    )


def _gen_sort_file() -> TerminalTask:
    """Sort lines in a file."""
    src = _rand_filename()
    words = [_rand_word(random.randint(3, 10)) for _ in range(random.randint(8, 20))]
    content = "\n".join(words)
    sorted_content = "\n".join(sorted(words))

    return TerminalTask(
        id=f"term-text-sort-{_rand_id()}",
        title="Sortera rader i fil",
        description=f"Sortera raderna i '{src}' alfabetiskt och spara resultatet i 'sorted.txt'.",
        instruction=f"Sortera raderna i '{src}' i alfabetisk ordning och skriv resultatet till 'sorted.txt'.",
        difficulty=3,
        category="text_processing",
        test_cases=[
            TerminalTestCase("sorted.txt existerar", "file_exists", "sorted.txt", ""),
            TerminalTestCase("Rätt sorterad", "file_equals", "sorted.txt", sorted_content),
        ],
        hints=["Använd sort"],
        tags=["text", "sort"],
        max_steps=5,
        setup_commands=[f"cat > '{src}' << 'SETUPEOF'\n{content}\nSETUPEOF"],
    )


def _gen_grep_extract() -> TerminalTask:
    """Find lines matching a pattern."""
    src = _rand_filename()
    keyword = _rand_word(4)
    n_lines = random.randint(15, 30)
    lines = []
    matching = []
    for _ in range(n_lines):
        word = _rand_word(random.randint(5, 15))
        if random.random() < 0.3:
            word = f"{word}_{keyword}_{_rand_word(3)}"
            matching.append(word)
        lines.append(word)
    content = "\n".join(lines)
    expected = "\n".join(matching)

    return TerminalTask(
        id=f"term-text-grep-{_rand_id()}",
        title="Filtrera rader med mönster",
        description=f"Hitta alla rader i '{src}' som innehåller '{keyword}' och spara i 'matches.txt'.",
        instruction=f"Använd grep för att hitta alla rader i '{src}' som innehåller strängen '{keyword}' och skriv dem till 'matches.txt'.",
        difficulty=3,
        category="text_processing",
        test_cases=[
            TerminalTestCase("matches.txt existerar", "file_exists", "matches.txt", ""),
            TerminalTestCase("Rätt matchningar", "file_equals", "matches.txt", expected),
        ],
        hints=["Använd grep med redirect"],
        tags=["text", "grep", "filter"],
        max_steps=5,
        setup_commands=[f"cat > '{src}' << 'SETUPEOF'\n{content}\nSETUPEOF"],
    )


def _gen_unique_words() -> TerminalTask:
    """Count unique words in a file."""
    src = _rand_filename()
    vocab = [_rand_word(random.randint(3, 8)) for _ in range(random.randint(5, 15))]
    words = [random.choice(vocab) for _ in range(random.randint(20, 50))]
    content = "\n".join(words)
    unique_count = len(set(words))

    return TerminalTask(
        id=f"term-text-uniq-{_rand_id()}",
        title="Räkna unika ord",
        description=f"Räkna antalet unika rader i '{src}' och skriv resultatet till 'result.txt'.",
        instruction=f"Räkna antalet unika rader i filen '{src}' och skriv BARA antalet till 'result.txt'.",
        difficulty=4,
        category="text_processing",
        test_cases=[
            TerminalTestCase("result.txt existerar", "file_exists", "result.txt", ""),
            TerminalTestCase("Rätt antal unika", "file_equals", "result.txt", str(unique_count)),
        ],
        hints=["Använd sort | uniq | wc -l"],
        tags=["text", "uniq", "sort", "count"],
        max_steps=5,
        setup_commands=[f"cat > '{src}' << 'SETUPEOF'\n{content}\nSETUPEOF"],
    )


# ============================================================
# LEVEL 4-5: Find & search
# ============================================================

def _gen_find_files() -> TerminalTask:
    """Find files matching a pattern in a directory tree."""
    ext = random.choice(["py", "txt", "log", "csv"])
    base = _rand_word(4)
    n_dirs = random.randint(2, 4)
    dirs = [_rand_word(3) for _ in range(n_dirs)]

    setup = [f"mkdir -p {base}/{d}" for d in dirs]
    target_files = []
    decoy_files = []

    for d in dirs:
        # Target files
        for _ in range(random.randint(1, 3)):
            fname = f"{_rand_word(4)}.{ext}"
            setup.append(f"touch {base}/{d}/{fname}")
            target_files.append(f"{base}/{d}/{fname}")
        # Decoy files
        other_ext = random.choice([e for e in ["py", "txt", "log", "csv", "md"] if e != ext])
        for _ in range(random.randint(1, 2)):
            fname = f"{_rand_word(4)}.{other_ext}"
            setup.append(f"touch {base}/{d}/{fname}")
            decoy_files.append(f"{base}/{d}/{fname}")

    return TerminalTask(
        id=f"term-find-ext-{_rand_id()}",
        title=f"Hitta alla .{ext}-filer",
        description=f"Hitta alla .{ext}-filer under '{base}/' och skriv antalet till 'count.txt'.",
        instruction=f"Hitta alla filer med ändelsen .{ext} under katalogen '{base}/' (rekursivt) och skriv antalet filer till 'count.txt'.",
        difficulty=4,
        category="file_search",
        test_cases=[
            TerminalTestCase("count.txt existerar", "file_exists", "count.txt", ""),
            TerminalTestCase("Rätt antal", "file_equals", "count.txt", str(len(target_files))),
        ],
        hints=[f"Använd find {base} -name '*.{ext}' | wc -l"],
        tags=["find", "search", "count"],
        max_steps=5,
        setup_commands=setup,
    )


# ============================================================
# LEVEL 5-6: Script writing
# ============================================================

def _gen_write_python_script() -> TerminalTask:
    """Write a Python script that processes data."""
    n = random.randint(5, 20)
    numbers = [random.randint(1, 100) for _ in range(n)]
    total = sum(numbers)
    data_file = "numbers.txt"
    content = "\n".join(str(x) for x in numbers)

    return TerminalTask(
        id=f"term-script-sum-{_rand_id()}",
        title="Skriv Python-skript som summerar",
        description="Skriv ett Python-skript som läser tal från en fil och beräknar summan.",
        instruction=(
            f"Skapa ett Python-skript 'sum.py' som:\n"
            f"1. Läser alla tal från '{data_file}' (ett tal per rad)\n"
            f"2. Beräknar summan\n"
            f"3. Skriver summan till 'result.txt'\n"
            f"Kör sedan skriptet."
        ),
        difficulty=5,
        category="scripting",
        test_cases=[
            TerminalTestCase("sum.py existerar", "file_exists", "sum.py", ""),
            TerminalTestCase("result.txt existerar", "file_exists", "result.txt", ""),
            TerminalTestCase("Rätt summa", "file_equals", "result.txt", str(total)),
        ],
        hints=["Skapa filen med cat > sum.py << 'EOF' ... EOF, kör med python sum.py"],
        tags=["python", "script", "file_io"],
        max_steps=10,
        setup_commands=[f"cat > '{data_file}' << 'SETUPEOF'\n{content}\nSETUPEOF"],
    )


def _gen_csv_processing() -> TerminalTask:
    """Process a CSV file."""
    n_rows = random.randint(8, 25)
    names = [_rand_word(5).capitalize() for _ in range(n_rows)]
    ages = [random.randint(18, 80) for _ in range(n_rows)]
    csv_lines = ["name,age"] + [f"{n},{a}" for n, a in zip(names, ages)]
    content = "\n".join(csv_lines)

    avg_age = sum(ages) / len(ages)
    oldest_idx = ages.index(max(ages))
    oldest_name = names[oldest_idx]

    return TerminalTask(
        id=f"term-csv-process-{_rand_id()}",
        title="Bearbeta CSV-data",
        description="Analysera en CSV-fil och extrahera statistik.",
        instruction=(
            "Filen 'data.csv' innehåller namn och ålder.\n"
            "Skapa filen 'stats.txt' med följande (en per rad):\n"
            f"1. Antal rader (exkl. header): skriv bara talet\n"
            f"2. Äldsta personens namn\n"
            f"3. Medelålder avrundad till heltal"
        ),
        difficulty=6,
        category="data_processing",
        test_cases=[
            TerminalTestCase("stats.txt existerar", "file_exists", "stats.txt", ""),
            TerminalTestCase(
                "Rätt innehåll",
                "file_equals",
                "stats.txt",
                f"{n_rows}\n{oldest_name}\n{round(avg_age)}",
            ),
        ],
        hints=["Använd awk eller Python för CSV-bearbetning"],
        tags=["csv", "data", "awk", "python"],
        max_steps=10,
        setup_commands=[f"cat > data.csv << 'SETUPEOF'\n{content}\nSETUPEOF"],
    )


# ============================================================
# LEVEL 6-7: Git operations
# ============================================================

def _gen_git_init_commit() -> TerminalTask:
    """Initialize a git repo and make a commit."""
    filename = _rand_filename("py")
    content = f"print('{_rand_word(8)}')"
    commit_msg = f"Add {filename}"

    return TerminalTask(
        id=f"term-git-init-{_rand_id()}",
        title="Initiera git-repo och committa",
        description="Skapa ett git-repo, lägg till en fil och gör en commit.",
        instruction=(
            f"1. Initiera ett git-repo i 'myproject/'\n"
            f"2. Skapa filen 'myproject/{filename}' med innehållet: {content}\n"
            f"3. Lägg till filen och gör en commit med meddelandet: '{commit_msg}'\n"
            f"4. Konfigurera git user.name='Frank' och user.email='frank@ai.se' om det behövs"
        ),
        difficulty=6,
        category="git",
        test_cases=[
            TerminalTestCase("Git-repo existerar", "dir_exists", "myproject/.git", ""),
            TerminalTestCase("Filen existerar", "file_exists", f"myproject/{filename}", ""),
            TerminalTestCase("Rätt innehåll", "file_equals", f"myproject/{filename}", content),
            TerminalTestCase(
                "Commit finns",
                "command_output",
                "cd myproject && git log --oneline -1 --format='%s'",
                commit_msg,
            ),
        ],
        hints=["git init, git add, git commit -m"],
        tags=["git", "init", "commit"],
        max_steps=10,
    )


def _gen_git_branch_merge() -> TerminalTask:
    """Create a branch, make changes, and merge."""
    branch_name = f"feature-{_rand_word(4)}"
    filename = _rand_filename("txt")
    content = _rand_word(15)

    return TerminalTask(
        id=f"term-git-branch-{_rand_id()}",
        title="Git branch och merge",
        description="Skapa en branch, gör ändringar och merga tillbaka.",
        instruction=(
            f"I det befintliga git-repot 'repo/':\n"
            f"1. Skapa en ny branch '{branch_name}'\n"
            f"2. På den branchen, skapa filen '{filename}' med innehållet: {content}\n"
            f"3. Committa med meddelandet 'Add {filename}'\n"
            f"4. Byt tillbaka till main och merga '{branch_name}'"
        ),
        difficulty=7,
        category="git",
        test_cases=[
            TerminalTestCase("Filen finns på main", "file_exists", f"repo/{filename}", ""),
            TerminalTestCase("Rätt innehåll", "file_equals", f"repo/{filename}", content),
            TerminalTestCase(
                "Branch existerar",
                "command_output",
                f"cd repo && git branch --list '{branch_name}' | tr -d ' '",
                branch_name,
            ),
            TerminalTestCase(
                "På main branch",
                "command_output",
                "cd repo && git branch --show-current",
                "main",
            ),
        ],
        hints=["git checkout -b, git merge"],
        tags=["git", "branch", "merge"],
        max_steps=12,
        setup_commands=[
            "mkdir repo && cd repo && git init -b main",
            "cd repo && git config user.name 'Frank' && git config user.email 'frank@ai.se'",
            "cd repo && echo 'initial' > README.md && git add . && git commit -m 'Initial commit'",
        ],
    )


# ============================================================
# LEVEL 7-8: Multi-step pipelines
# ============================================================

def _gen_log_analysis() -> TerminalTask:
    """Analyze a log file and extract statistics."""
    levels = ["INFO", "WARNING", "ERROR", "DEBUG"]
    n_lines = random.randint(50, 150)
    log_lines = []
    counts = {lvl: 0 for lvl in levels}

    for i in range(n_lines):
        lvl = random.choices(levels, weights=[50, 20, 10, 20], k=1)[0]
        counts[lvl] += 1
        msg = f"2024-01-{random.randint(1,28):02d} {random.randint(0,23):02d}:{random.randint(0,59):02d}:{random.randint(0,59):02d} [{lvl}] {_rand_word(10)}: {_rand_word(20)}"
        log_lines.append(msg)

    content = "\n".join(log_lines)

    return TerminalTask(
        id=f"term-log-analysis-{_rand_id()}",
        title="Analysera loggfil",
        description="Analysera en loggfil och extrahera statistik per nivå.",
        instruction=(
            "Filen 'app.log' innehåller loggmeddelanden.\n"
            "Skapa filen 'report.txt' med antalet meddelanden per nivå, en per rad:\n"
            "Format: LEVEL: COUNT\n"
            "Ordning: DEBUG, ERROR, INFO, WARNING (alfabetisk)\n"
            "Exempel: DEBUG: 15"
        ),
        difficulty=7,
        category="data_processing",
        test_cases=[
            TerminalTestCase("report.txt existerar", "file_exists", "report.txt", ""),
            TerminalTestCase(
                "Rätt statistik",
                "file_equals",
                "report.txt",
                "\n".join(f"{lvl}: {counts[lvl]}" for lvl in sorted(levels)),
            ),
        ],
        hints=["Använd grep -c eller awk"],
        tags=["log", "analysis", "grep", "awk"],
        max_steps=10,
        setup_commands=[f"cat > app.log << 'SETUPEOF'\n{content}\nSETUPEOF"],
    )


def _gen_json_transform() -> TerminalTask:
    """Transform JSON data."""
    n_items = random.randint(5, 15)
    items = []
    for _ in range(n_items):
        items.append({
            "name": _rand_word(6).capitalize(),
            "score": random.randint(10, 100),
            "active": random.choice([True, False]),
        })

    active_items = [i for i in items if i["active"]]
    active_names = sorted([i["name"] for i in active_items])

    json_content = json.dumps(items, indent=2)

    return TerminalTask(
        id=f"term-json-transform-{_rand_id()}",
        title="Transformera JSON-data",
        description="Filtrera och transformera JSON-data.",
        instruction=(
            "Filen 'data.json' innehåller en lista med objekt (name, score, active).\n"
            "Skapa filen 'active.txt' med namnen på alla aktiva objekt (active=true),\n"
            "sorterade alfabetiskt, ett namn per rad."
        ),
        difficulty=7,
        category="data_processing",
        test_cases=[
            TerminalTestCase("active.txt existerar", "file_exists", "active.txt", ""),
            TerminalTestCase(
                "Rätt aktiva namn",
                "file_equals",
                "active.txt",
                "\n".join(active_names),
            ),
        ],
        hints=["Använd python -c eller jq"],
        tags=["json", "filter", "python", "jq"],
        max_steps=10,
        setup_commands=[f"cat > data.json << 'JSONEOF'\n{json_content}\nJSONEOF"],
    )


# ============================================================
# LEVEL 8-10: Complex multi-step tasks
# ============================================================

def _gen_build_project() -> TerminalTask:
    """Set up a Python project with structure."""
    project_name = _rand_word(6)
    module_name = _rand_word(5)
    func_name = f"compute_{_rand_word(4)}"
    a, b = random.randint(1, 50), random.randint(1, 50)
    expected_result = str(a + b)

    return TerminalTask(
        id=f"term-project-build-{_rand_id()}",
        title="Bygg Python-projekt",
        description="Skapa ett komplett Python-projekt med modul, test och körbar main.",
        instruction=(
            f"Skapa ett Python-projekt '{project_name}/' med:\n"
            f"1. '{project_name}/{module_name}.py' — en modul med funktionen {func_name}(a, b) som returnerar a + b\n"
            f"2. '{project_name}/main.py' — importerar {module_name}.{func_name}, beräknar {func_name}({a}, {b}) och skriver resultatet till '../result.txt'\n"
            f"3. '{project_name}/__init__.py' — tom fil\n"
            f"4. Kör main.py så att result.txt skapas i workspace-roten"
        ),
        difficulty=8,
        category="project_setup",
        test_cases=[
            TerminalTestCase("Modul existerar", "file_exists", f"{project_name}/{module_name}.py", ""),
            TerminalTestCase("Main existerar", "file_exists", f"{project_name}/main.py", ""),
            TerminalTestCase("__init__.py existerar", "file_exists", f"{project_name}/__init__.py", ""),
            TerminalTestCase("Funktionen finns", "file_contains", f"{project_name}/{module_name}.py", f"def {func_name}"),
            TerminalTestCase("Rätt resultat", "file_equals", "result.txt", expected_result),
        ],
        hints=["Använd mkdir, cat med heredoc, python"],
        tags=["python", "project", "module", "import"],
        max_steps=15,
    )


def _gen_data_pipeline() -> TerminalTask:
    """Build a multi-step data pipeline."""
    n_rows = random.randint(20, 50)
    categories = ["alpha", "beta", "gamma"]
    rows = []
    cat_totals = {c: 0 for c in categories}

    for _ in range(n_rows):
        cat = random.choice(categories)
        value = random.randint(1, 100)
        cat_totals[cat] += value
        rows.append(f"{cat},{value}")

    csv_content = "category,value\n" + "\n".join(rows)
    expected_lines = [f"{c}: {cat_totals[c]}" for c in sorted(categories)]

    return TerminalTask(
        id=f"term-pipeline-{_rand_id()}",
        title="Bygg datapipeline",
        description="Bearbeta CSV-data genom en pipeline och aggregera per kategori.",
        instruction=(
            "Filen 'input.csv' har kolumnerna category och value.\n"
            "Bygg en pipeline (bash eller Python) som:\n"
            "1. Läser input.csv\n"
            "2. Summerar value per category\n"
            "3. Skriver resultatet till 'output.txt' i formatet 'category: total'\n"
            "   sorterat alfabetiskt, en rad per kategori"
        ),
        difficulty=9,
        category="data_processing",
        test_cases=[
            TerminalTestCase("output.txt existerar", "file_exists", "output.txt", ""),
            TerminalTestCase(
                "Rätt aggregering",
                "file_equals",
                "output.txt",
                "\n".join(expected_lines),
            ),
        ],
        hints=["Använd awk eller Python med csv-modul"],
        tags=["pipeline", "csv", "aggregation", "awk"],
        max_steps=12,
        setup_commands=[f"cat > input.csv << 'SETUPEOF'\n{csv_content}\nSETUPEOF"],
    )


# ============================================================
# Generator registry
# ============================================================

TERMINAL_GENERATORS = {
    1: [_gen_create_file, _gen_create_directory_structure],
    2: [_gen_move_rename, _gen_copy_file],
    3: [_gen_count_lines, _gen_sort_file, _gen_grep_extract],
    4: [_gen_unique_words, _gen_find_files],
    5: [_gen_write_python_script],
    6: [_gen_csv_processing, _gen_git_init_commit],
    7: [_gen_git_branch_merge, _gen_log_analysis, _gen_json_transform],
    8: [_gen_build_project],
    9: [_gen_data_pipeline],
    10: [_gen_data_pipeline],  # Reuse hardest for level 10
}


def generate_terminal_task(difficulty: int) -> TerminalTask:
    """Generate a random terminal task at the given difficulty level.
    
    Args:
        difficulty: 1-10
        
    Returns:
        A TerminalTask instance
    """
    difficulty = max(1, min(10, difficulty))
    generators = TERMINAL_GENERATORS.get(difficulty, TERMINAL_GENERATORS[1])
    gen = random.choice(generators)
    return gen()
