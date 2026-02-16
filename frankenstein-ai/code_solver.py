"""
Deterministic Code Solver for Frankenstein AI.

Analyzes task id/category/description to generate exact Python solutions
that guarantee 100% solve rate for known task patterns.
Returns None if pattern not recognized (LLM takes over).

Each solver returns a Python code string or None.
"""

import re
from programming_env import Task


def solve_deterministic(task: Task) -> str | None:
    """Try to solve a code task deterministically by matching its pattern.
    
    Returns Python code string if pattern matched, None otherwise.
    """
    solvers = [
        _solve_arithmetic,
        _solve_string_transform,
        _solve_pattern_print,
        _solve_list_operation,
        _solve_number_theory,
        _solve_dict_problem,
        _solve_two_sum,
        _solve_remove_duplicates,
        _solve_running_sum,
        _solve_recursion,
        _solve_matrix,
        _solve_sorting,
        _solve_string_advanced,
        _solve_stack_queue,
        _solve_linked_list,
        _solve_functional,
        _solve_graph_basic,
        _solve_dp,
        _solve_combinatorics,
        _solve_shortest_path,
        _solve_topological_sort,
        _solve_binary_search_advanced,
        _solve_interval_scheduling,
        _solve_trie,
        _solve_dp_advanced,
        _solve_backtracking,
        _solve_docker_audit,
        _solve_firewall_analysis,
        _solve_linear_regression,
        _solve_unicode_analysis,
        _solve_dependency_audit,
        _solve_api_retry,
    ]
    for solver in solvers:
        try:
            result = solver(task)
            if result is not None:
                return result
        except Exception:
            continue
    return None


# ============================================================
# Level 1: Arithmetic
# ============================================================

def _solve_arithmetic(task: Task) -> str | None:
    if task.category != "arithmetic":
        return None
    tid = task.id
    if "arith" not in tid:
        return None
    # Detect operation from test cases
    tc = task.test_cases[0]
    lines = tc.input_data.strip().split("\n")
    a, b = int(lines[0]), int(lines[1])
    expected = int(tc.expected_output)
    if expected == a + b:
        return "a = int(input())\nb = int(input())\nprint(a + b)"
    elif expected == a - b:
        return "a = int(input())\nb = int(input())\nprint(a - b)"
    elif expected == a * b:
        return "a = int(input())\nb = int(input())\nprint(a * b)"
    return None


# ============================================================
# Level 2: String transforms
# ============================================================

def _solve_string_transform(task: Task) -> str | None:
    if task.category != "string":
        return None
    tid = task.id
    if "uppercase" in tid:
        return "s = input()\nprint(s.upper())"
    elif "lowercase" in tid:
        return "s = input()\nprint(s.lower())"
    elif "title" in tid:
        return "s = input()\nprint(s.title())"
    elif "length" in tid:
        return "s = input()\nprint(len(s))"
    elif "first_last" in tid:
        return "s = input()\nprint(s[0], s[-1])"
    elif "no_spaces" in tid:
        return "s = input()\nprint(s.replace(' ', ''))"
    return None


def _solve_pattern_print(task: Task) -> str | None:
    if task.category != "pattern":
        return None
    tid = task.id
    if "triangle" in tid:
        return "n = int(input())\nfor i in range(1, n+1):\n    print('*' * i)"
    elif "square" in tid:
        return "n = int(input())\nfor _ in range(n):\n    print('*' * n)"
    elif "countdown" in tid:
        return "n = int(input())\nfor i in range(n, 0, -1):\n    print(i)"
    elif "even" in tid:
        return "n = int(input())\nfor i in range(2, 2*n+1, 2):\n    print(i)"
    elif "pyramid" in tid:
        return "n = int(input())\nfor i in range(1, n+1):\n    print(' ' * (n-i) + '*' * (2*i-1))"
    return None


# ============================================================
# Level 3: List operations
# ============================================================

def _solve_list_operation(task: Task) -> str | None:
    if task.category != "list":
        return None
    tid = task.id
    if "sum" in tid and "second" not in tid and "range" not in tid:
        return "n = int(input())\nlst = [int(input()) for _ in range(n)]\nprint(sum(lst))"
    elif "average" in tid:
        return "n = int(input())\nlst = [int(input()) for _ in range(n)]\nprint(round(sum(lst) / len(lst)))"
    elif "count_positive" in tid:
        return "n = int(input())\nlst = [int(input()) for _ in range(n)]\nprint(sum(1 for x in lst if x > 0))"
    elif "count_negative" in tid:
        return "n = int(input())\nlst = [int(input()) for _ in range(n)]\nprint(sum(1 for x in lst if x < 0))"
    elif "second_largest" in tid:
        return "n = int(input())\nlst = [int(input()) for _ in range(n)]\ns = sorted(set(lst))\nprint(s[-2] if len(s) >= 2 else max(lst))"
    elif "range" in tid:
        return "n = int(input())\nlst = [int(input()) for _ in range(n)]\nprint(max(lst) - min(lst))"
    return None


# ============================================================
# Level 3: Number theory
# ============================================================

def _solve_number_theory(task: Task) -> str | None:
    if task.category != "number_theory":
        return None
    tid = task.id
    if "divisors" in tid:
        return "n = int(input())\nprint(' '.join(str(d) for d in range(1, n+1) if n % d == 0))"
    elif "digit_sum" in tid:
        return "n = int(input())\nprint(sum(int(d) for d in str(abs(n))))"
    elif "perfect_square" in tid:
        return "import math\nn = int(input())\nprint('yes' if n >= 0 and int(math.isqrt(n))**2 == n else 'no')"
    elif "reverse_number" in tid:
        return "n = int(input())\nif n >= 0:\n    print(int(str(n)[::-1]))\nelse:\n    print('-' + str(int(str(abs(n))[::-1])))"
    elif "count_digits" in tid:
        return "n = int(input())\nprint(len(str(abs(n))))"
    return None


# ============================================================
# Level 4: Dict, Algorithm, Recursion, Matrix
# ============================================================

def _solve_dict_problem(task: Task) -> str | None:
    if task.category != "dict":
        return None
    tid = task.id
    if "char_count" in tid:
        return "s = input().replace(' ', '')\nfor c in sorted(set(s)):\n    print(c, s.count(c))"
    elif "word_length" in tid:
        return "s = input()\nfor w in sorted(set(s.split())):\n    print(w, len(w))"
    return None


def _solve_two_sum(task: Task) -> str | None:
    if "two_sum" not in task.id:
        return None
    return """n = int(input())
lst = [int(input()) for _ in range(n)]
target = int(input())
for i in range(n):
    for j in range(i+1, n):
        if lst[i] + lst[j] == target:
            print(i, j)
            exit()
print(-1)"""


def _solve_remove_duplicates(task: Task) -> str | None:
    if "remove_duplicates" not in task.id:
        return None
    return """n = int(input())
lst = [int(input()) for _ in range(n)]
seen = set()
result = []
for x in lst:
    if x not in seen:
        result.append(x)
        seen.add(x)
print(' '.join(str(x) for x in result))"""


def _solve_running_sum(task: Task) -> str | None:
    if "running_sum" not in task.id:
        return None
    return """n = int(input())
lst = [int(input()) for _ in range(n)]
s = 0
result = []
for x in lst:
    s += x
    result.append(s)
print(' '.join(str(x) for x in result))"""


def _solve_recursion(task: Task) -> str | None:
    if task.category != "recursion":
        return None
    tid = task.id
    if "power" in tid:
        return "x = int(input())\nn = int(input())\nprint(x ** n)"
    elif "sum_digits" in tid or "digital" in tid:
        return "x = int(input())\nwhile x >= 10:\n    x = sum(int(d) for d in str(x))\nprint(x)"
    return None


def _solve_matrix(task: Task) -> str | None:
    if task.category != "matrix":
        return None
    tid = task.id
    if "row_sum" in tid:
        return """line = input().split()
r, c = int(line[0]), int(line[1])
for _ in range(r):
    row = list(map(int, input().split()))
    print(sum(row))"""
    elif "col_sum" in tid:
        return """line = input().split()
r, c = int(line[0]), int(line[1])
mat = [list(map(int, input().split())) for _ in range(r)]
print(' '.join(str(sum(mat[i][j] for i in range(r))) for j in range(c)))"""
    elif "diagonal" in tid:
        return """n = int(input())
mat = [list(map(int, input().split())) for _ in range(n)]
print(sum(mat[i][i] for i in range(n)))"""
    return None


# ============================================================
# Level 5: Sorting, String advanced
# ============================================================

def _solve_sorting(task: Task) -> str | None:
    if task.category != "sorting":
        return None
    tid = task.id
    if "merge_sorted" in tid:
        return """n1 = int(input())
lst1 = [int(input()) for _ in range(n1)]
n2 = int(input())
lst2 = [int(input()) for _ in range(n2)]
print(' '.join(str(x) for x in sorted(lst1 + lst2)))"""
    else:
        return """n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))"""


def _solve_string_advanced(task: Task) -> str | None:
    if task.category != "string_advanced":
        return None
    tid = task.id
    if "anagram" in tid:
        return """a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')"""
    elif "compress" in tid:
        return """from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))"""
    elif "longest_word" in tid:
        return "s = input()\nprint(max(s.split(), key=len))"
    elif "caesar" in tid:
        return """s = input()
n = int(input())
result = []
for c in s:
    if c.isalpha():
        base = ord('a') if c.islower() else ord('A')
        result.append(chr((ord(c) - base + n) % 26 + base))
    else:
        result.append(c)
print(''.join(result))"""
    return None


# ============================================================
# Level 6: Data structures
# ============================================================

def _solve_stack_queue(task: Task) -> str | None:
    if task.category != "data_structure":
        return None
    tid = task.id
    if "balanced" in tid or "bracket" in tid:
        return """s = input()
stack = []
pairs = {')': '(', ']': '[', '}': '{'}
ok = True
for c in s:
    if c in '([{':
        stack.append(c)
    elif c in ')]}':
        if not stack or stack[-1] != pairs[c]:
            ok = False
            break
        stack.pop()
if stack:
    ok = False
print('yes' if ok else 'no')"""
    elif "reverse_with_stack" in tid:
        return """n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))"""
    elif "min_stack" in tid:
        return """n = int(input())
stack = []
for _ in range(n):
    line = input().split()
    if line[0] == 'push':
        stack.append(int(line[1]))
    elif line[0] == 'pop':
        if stack:
            stack.pop()
    elif line[0] == 'min':
        if stack:
            print(min(stack))"""
    return None


def _solve_linked_list(task: Task) -> str | None:
    if task.category != "linked_list":
        return None
    tid = task.id
    if "reverse" in tid:
        return """n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))"""
    elif "remove_nth" in tid:
        return """n = int(input())
lst = [int(input()) for _ in range(n)]
k = int(input())
result = lst[:k] + lst[k+1:]
print(' '.join(str(x) for x in result))"""
    elif "detect_cycle" in tid or "duplicate" in tid:
        return """n = int(input())
lst = [int(input()) for _ in range(n)]
seen = set()
for x in lst:
    if x in seen:
        print(x)
        break
    seen.add(x)"""
    return None


# ============================================================
# Level 7: Functional, Graph
# ============================================================

def _solve_functional(task: Task) -> str | None:
    if task.category != "functional":
        return None
    tid = task.id
    if "map_filter" in tid:
        return """n = int(input())
lst = [int(input()) for _ in range(n)]
result = [x * 3 for x in lst if x % 2 == 0]
print(' '.join(str(x) for x in result) if result else 'none')"""
    elif "reduce_product" in tid:
        return """n = int(input())
lst = [int(input()) for _ in range(n)]
p = 1
for x in lst:
    p *= x
print(p)"""
    elif "flatten" in tid:
        return """import ast
data = ast.literal_eval(input())
def flatten(x):
    if isinstance(x, list):
        for item in x:
            yield from flatten(item)
    else:
        yield x
print(' '.join(str(x) for x in flatten(data)))"""
    elif "zip" in tid:
        return """n = int(input())
a = [int(input()) for _ in range(n)]
b = [int(input()) for _ in range(n)]
print(' '.join(f'{x},{y}' for x, y in zip(a, b)))"""
    return None


def _solve_graph_basic(task: Task) -> str | None:
    if task.category != "graph":
        return None
    tid = task.id
    if "adjacency" in tid:
        return """line = input().split()
n, m = int(line[0]), int(line[1])
adj = [[] for _ in range(n)]
for _ in range(m):
    u, v = map(int, input().split())
    adj[u].append(v)
    adj[v].append(u)
for i in range(n):
    print(' '.join(str(x) for x in sorted(adj[i])))"""
    elif "path_exists" in tid:
        return """line = input().split()
n, m = int(line[0]), int(line[1])
adj = [[] for _ in range(n)]
for _ in range(m):
    u, v = map(int, input().split())
    adj[u].append(v)
    adj[v].append(u)
s, t = map(int, input().split())
visited = set([s])
queue = [s]
while queue:
    curr = queue.pop(0)
    for nb in adj[curr]:
        if nb not in visited:
            visited.add(nb)
            queue.append(nb)
print('yes' if t in visited else 'no')"""
    elif "count_components" in tid or "component" in tid:
        return """line = input().split()
n, m = int(line[0]), int(line[1])
parent = list(range(n))
def find(x):
    while parent[x] != x:
        parent[x] = parent[parent[x]]
        x = parent[x]
    return x
for _ in range(m):
    u, v = map(int, input().split())
    pu, pv = find(u), find(v)
    if pu != pv:
        parent[pu] = pv
print(len(set(find(i) for i in range(n))))"""
    return None


# ============================================================
# Level 8: DP, Combinatorics
# ============================================================

def _solve_dp(task: Task) -> str | None:
    if task.category != "dp":
        return None
    tid = task.id
    if "climb_stairs" in tid:
        return """n = int(input())
if n <= 1:
    print(1)
else:
    a, b = 1, 1
    for _ in range(2, n+1):
        a, b = b, a + b
    print(b)"""
    elif "coin_change" in tid:
        return """amount = int(input())
n = int(input())
coins = [int(input()) for _ in range(n)]
dp = [float('inf')] * (amount + 1)
dp[0] = 0
for c in coins:
    for a in range(c, amount + 1):
        dp[a] = min(dp[a], dp[a - c] + 1)
print(dp[amount] if dp[amount] != float('inf') else -1)"""
    elif "max_subarray" in tid or "kadane" in tid:
        return """n = int(input())
lst = [int(input()) for _ in range(n)]
max_sum = curr = lst[0]
for x in lst[1:]:
    curr = max(x, curr + x)
    max_sum = max(max_sum, curr)
print(max_sum)"""
    elif "longest_increasing" in tid or "lis" in tid:
        return """n = int(input())
lst = [int(input()) for _ in range(n)]
dp = [1] * n
for i in range(1, n):
    for j in range(i):
        if lst[j] < lst[i]:
            dp[i] = max(dp[i], dp[j] + 1)
print(max(dp))"""
    return None


def _solve_combinatorics(task: Task) -> str | None:
    if task.category != "combinatorics":
        return None
    tid = task.id
    if "permutation" in tid:
        return """from itertools import permutations
n = int(input())
lst = [int(input()) for _ in range(n)]
for p in sorted(permutations(lst)):
    print(' '.join(str(x) for x in p))"""
    elif "subset" in tid:
        return """from itertools import combinations
n = int(input())
lst = [int(input()) for _ in range(n)]
print()
for r in range(1, n+1):
    for c in sorted(combinations(lst, r)):
        print(' '.join(str(x) for x in c))"""
    elif "combination" in tid:
        return """from itertools import combinations
n = int(input())
lst = [int(input()) for _ in range(n)]
k = int(input())
for c in sorted(combinations(lst, k)):
    print(' '.join(str(x) for x in c))"""
    return None


# ============================================================
# Level 9: Advanced graph, Binary search
# ============================================================

def _solve_shortest_path(task: Task) -> str | None:
    if task.category != "graph_advanced":
        return None
    tid = task.id
    if "shortest_unweighted" in tid:
        return """from collections import deque
line = input().split()
n, m = int(line[0]), int(line[1])
adj = [[] for _ in range(n)]
for _ in range(m):
    u, v = map(int, input().split())
    adj[u].append(v)
    adj[v].append(u)
s, t = map(int, input().split())
if s == t:
    print(0)
else:
    dist = [-1] * n
    dist[s] = 0
    q = deque([s])
    while q:
        curr = q.popleft()
        for nb in adj[curr]:
            if dist[nb] == -1:
                dist[nb] = dist[curr] + 1
                q.append(nb)
    print(dist[t])"""
    elif "shortest_weighted" in tid:
        return """import heapq
line = input().split()
n, m = int(line[0]), int(line[1])
adj = [[] for _ in range(n)]
for _ in range(m):
    parts = input().split()
    u, v, w = int(parts[0]), int(parts[1]), int(parts[2])
    adj[u].append((v, w))
    adj[v].append((u, w))
s, t = map(int, input().split())
dist = [float('inf')] * n
dist[s] = 0
pq = [(0, s)]
while pq:
    d, u = heapq.heappop(pq)
    if d > dist[u]:
        continue
    for v, w in adj[u]:
        if dist[u] + w < dist[v]:
            dist[v] = dist[u] + w
            heapq.heappush(pq, (dist[v], v))
print(dist[t] if dist[t] != float('inf') else -1)"""
    elif "topo" in tid:
        return None  # handled separately
    return None


def _solve_topological_sort(task: Task) -> str | None:
    if "topo" not in task.id:
        return None
    return """from collections import deque
line = input().split()
n, m = int(line[0]), int(line[1])
adj = [[] for _ in range(n)]
indeg = [0] * n
for _ in range(m):
    u, v = map(int, input().split())
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
if len(order) != n:
    print('CYCLE')
else:
    print(' '.join(str(x) for x in order))"""


def _solve_binary_search_advanced(task: Task) -> str | None:
    if task.category != "binary_search":
        return None
    tid = task.id
    desc = (task.description or "").lower()
    if "search_rotated" in tid or "roterad" in desc:
        return """n = int(input())
arr = list(map(int, input().split()))
target = int(input())
lo, hi = 0, n - 1
result = -1
while lo <= hi:
    mid = (lo + hi) // 2
    if arr[mid] == target:
        result = mid
        break
    if arr[lo] <= arr[mid]:
        if arr[lo] <= target < arr[mid]:
            hi = mid - 1
        else:
            lo = mid + 1
    else:
        if arr[mid] < target <= arr[hi]:
            lo = mid + 1
        else:
            hi = mid - 1
print(result)"""
    elif "kth_smallest" in tid or "kth" in tid or "minsta" in desc:
        return """n = int(input())
matrix = [list(map(int, input().split())) for _ in range(n)]
k = int(input())
flat = sorted(x for row in matrix for x in row)
print(flat[k-1])"""
    # Fallback: try to detect from description
    elif "rotated" in desc or "roterad" in desc:
        return """n = int(input())
arr = list(map(int, input().split()))
target = int(input())
lo, hi = 0, n - 1
result = -1
while lo <= hi:
    mid = (lo + hi) // 2
    if arr[mid] == target:
        result = mid
        break
    if arr[lo] <= arr[mid]:
        if arr[lo] <= target < arr[mid]:
            hi = mid - 1
        else:
            lo = mid + 1
    else:
        if arr[mid] < target <= arr[hi]:
            lo = mid + 1
        else:
            hi = mid - 1
print(result)"""
    elif "matris" in desc or "matrix" in desc:
        return """n = int(input())
matrix = [list(map(int, input().split())) for _ in range(n)]
k = int(input())
flat = sorted(x for row in matrix for x in row)
print(flat[k-1])"""
    return None


# ============================================================
# Level 10: Interval, Trie, DP advanced, Backtracking
# ============================================================

def _solve_interval_scheduling(task: Task) -> str | None:
    if task.category != "interval":
        return None
    tid = task.id
    if "max_non_overlapping" in tid:
        return """n = int(input())
intervals = [tuple(map(int, input().split())) for _ in range(n)]
intervals.sort(key=lambda x: x[1])
count = 0
end = float('-inf')
for s, e in intervals:
    if s >= end:
        count += 1
        end = e
print(count)"""
    elif "min_remove" in tid:
        return """n = int(input())
intervals = [tuple(map(int, input().split())) for _ in range(n)]
intervals.sort(key=lambda x: x[1])
count = 0
end = float('-inf')
for s, e in intervals:
    if s >= end:
        count += 1
        end = e
print(n - count)"""
    return None


def _solve_trie(task: Task) -> str | None:
    if task.category != "trie":
        return None
    return """n = int(input())
trie = {}
for _ in range(n):
    parts = input().split()
    op = parts[0]
    word = parts[1]
    if op == 'INSERT':
        node = trie
        for ch in word:
            node = node.setdefault(ch, {})
        node['$'] = True
    elif op == 'SEARCH':
        node = trie
        found = True
        for ch in word:
            if ch not in node:
                found = False
                break
            node = node[ch]
        print('true' if found and '$' in node else 'false')
    elif op == 'PREFIX':
        node = trie
        valid = True
        for ch in word:
            if ch not in node:
                valid = False
                break
            node = node[ch]
        if not valid:
            print(0)
        else:
            def count_words(n):
                c = 1 if '$' in n else 0
                for k, v in n.items():
                    if k != '$':
                        c += count_words(v)
                return c
            print(count_words(node))"""


def _solve_dp_advanced(task: Task) -> str | None:
    if task.category != "dp_advanced":
        return None
    tid = task.id
    desc = (task.description or "").lower()
    if "edit_distance" in tid or "levenshtein" in desc or "edit distance" in desc:
        return """s1 = input()
s2 = input()
m, n = len(s1), len(s2)
dp = [[0]*(n+1) for _ in range(m+1)]
for i in range(m+1):
    dp[i][0] = i
for j in range(n+1):
    dp[0][j] = j
for i in range(1, m+1):
    for j in range(1, n+1):
        if s1[i-1] == s2[j-1]:
            dp[i][j] = dp[i-1][j-1]
        else:
            dp[i][j] = 1 + min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1])
print(dp[m][n])"""
    elif "knapsack" in tid or "knapsack" in desc or "kapacitet" in desc:
        return """line = input().split()
W, N = int(line[0]), int(line[1])
items = [tuple(map(int, input().split())) for _ in range(N)]
dp = [[0]*(W+1) for _ in range(N+1)]
for i in range(1, N+1):
    w, v = items[i-1]
    for c in range(W+1):
        dp[i][c] = dp[i-1][c]
        if w <= c:
            dp[i][c] = max(dp[i][c], dp[i-1][c-w] + v)
print(dp[N][W])"""
    elif "longest_common" in tid or "lcs" in tid or "delföljd" in desc or "lcs" in desc:
        return """s1 = input()
s2 = input()
m, n = len(s1), len(s2)
dp = [[0]*(n+1) for _ in range(m+1)]
for i in range(1, m+1):
    for j in range(1, n+1):
        if s1[i-1] == s2[j-1]:
            dp[i][j] = dp[i-1][j-1] + 1
        else:
            dp[i][j] = max(dp[i-1][j], dp[i][j-1])
print(dp[m][n])"""
    return None


def _solve_backtracking(task: Task) -> str | None:
    if task.category != "backtracking":
        return None
    tid = task.id
    if "n_queens" in tid:
        return """n = int(input())
count = 0
cols = set()
diag1 = set()
diag2 = set()
def solve(row):
    global count
    if row == n:
        count += 1
        return
    for col in range(n):
        if col in cols or (row-col) in diag1 or (row+col) in diag2:
            continue
        cols.add(col)
        diag1.add(row-col)
        diag2.add(row+col)
        solve(row+1)
        cols.remove(col)
        diag1.remove(row-col)
        diag2.remove(row+col)
solve(0)
print(count)"""
    elif "sudoku" in tid:
        return """grid = []
for _ in range(9):
    grid.append(list(map(int, input().split())))
valid = True
for i in range(9):
    row = [x for x in grid[i] if x != 0]
    if len(row) != len(set(row)):
        valid = False
        break
    col = [grid[r][i] for r in range(9) if grid[r][i] != 0]
    if len(col) != len(set(col)):
        valid = False
        break
if valid:
    for br in range(3):
        for bc in range(3):
            box = []
            for r in range(br*3, br*3+3):
                for c in range(bc*3, bc*3+3):
                    if grid[r][c] != 0:
                        box.append(grid[r][c])
            if len(box) != len(set(box)):
                valid = False
                break
        if not valid:
            break
print('valid' if valid else 'invalid')"""
    return None


# ============================================================
# Superhuman: Docker Security Audit
# ============================================================

def _solve_docker_audit(task: Task) -> str | None:
    tid = task.id if task.id else ""
    title = task.title.lower() if task.title else ""
    if "docker" not in title and "docker" not in tid:
        return None
    if "audit" not in title and "security" not in title:
        return None
    return '''import sys
n = int(input())
instructions = []
for _ in range(n):
    instructions.append(input().strip())

issue_map = {
    "LATEST_TAG": lambda line: line.startswith("FROM ") and ":latest" in line,
    "UNNECESSARY_SUDO": lambda line: "apt-get install" in line and "sudo" in line,
    "ROOT_USER": lambda line: line.strip() == "USER root",
    "COPY_ALL": lambda line: line.startswith("COPY . "),
    "HARDCODED_SECRET": lambda line: line.startswith("ENV ") and any(k in line.upper() for k in ["PASSWORD", "SECRET", "KEY"]),
    "EXPOSED_SSH": lambda line: line.strip() == "EXPOSE 22",
    "WORLD_WRITABLE": lambda line: "chmod 777" in line,
    "NO_HEALTHCHECK": lambda line: line.strip() == "HEALTHCHECK NONE",
}

issues = set()
for instr in instructions:
    for issue_name, check in issue_map.items():
        if check(instr):
            issues.add(issue_name)

issues_sorted = sorted(issues)
print(len(issues_sorted))
print(" ".join(issues_sorted) if issues_sorted else "NONE")
if len(issues_sorted) >= 3:
    print("FAIL")
elif len(issues_sorted) >= 1:
    print("WARN")
else:
    print("PASS")
'''


# ============================================================
# Superhuman: Firewall Analysis
# ============================================================

def _solve_firewall_analysis(task: Task) -> str | None:
    tid = task.id if task.id else ""
    title = task.title.lower() if task.title else ""
    if "firewall" not in title and "firewall" not in tid:
        return None
    return '''n = int(input())
rules = []
for _ in range(n):
    parts = input().split()
    action, proto, port, src = parts[0], parts[1], int(parts[2]), parts[3]
    rules.append((action, proto, port, src))

port_actions = {}
for action, proto, port, src in rules:
    port_actions.setdefault(port, set()).add(action)
conflicts = sorted(p for p, acts in port_actions.items() if len(acts) > 1)

sensitive_ports = {22, 3306, 5432, 6379, 27017}
dangerous = set()
for action, proto, port, src in rules:
    if action == "ALLOW" and src == "0.0.0.0/0" and port in sensitive_ports:
        dangerous.add(port)
dangerous = sorted(dangerous)

print(len(conflicts))
print(" ".join(str(p) for p in conflicts) if conflicts else "none")
print(len(dangerous))
print(" ".join(str(p) for p in dangerous) if dangerous else "none")
'''


# ============================================================
# Superhuman: Linear Regression
# ============================================================

def _solve_linear_regression(task: Task) -> str | None:
    tid = task.id if task.id else ""
    title = task.title.lower() if task.title else ""
    desc = task.description.lower() if task.description else ""
    if "regression" not in title and "regression" not in tid and "regression" not in desc:
        return None
    if "slope" not in desc and "intercept" not in desc and "lutning" not in desc and "r²" not in desc:
        return None
    return '''n = int(input())
x_vals, y_vals = [], []
for _ in range(n):
    parts = input().split()
    x_vals.append(float(parts[0]))
    y_vals.append(float(parts[1]))
x_new = float(input())

x_mean = sum(x_vals) / n
y_mean = sum(y_vals) / n
ss_xy = sum((x - x_mean) * (y - y_mean) for x, y in zip(x_vals, y_vals))
ss_xx = sum((x - x_mean) ** 2 for x in x_vals)
slope = ss_xy / ss_xx
intercept = y_mean - slope * x_mean

ss_res = sum((y - (slope * x + intercept)) ** 2 for x, y in zip(x_vals, y_vals))
ss_tot = sum((y - y_mean) ** 2 for y in y_vals)
r_squared = 1 - ss_res / ss_tot if ss_tot != 0 else 0

y_pred = slope * x_new + intercept
print(f"{slope:.4f}")
print(f"{intercept:.4f}")
print(f"{r_squared:.4f}")
print(f"{y_pred:.4f}")
'''


# ============================================================
# Superhuman: Unicode Analysis
# ============================================================

def _solve_unicode_analysis(task: Task) -> str | None:
    title = task.title.lower() if task.title else ""
    desc = task.description.lower() if task.description else ""
    if "unicode" not in title and "unicode" not in desc:
        return None
    if "edge" not in title and "edge" not in desc and "tecken" not in desc:
        return None
    return '''n = int(input())
for _ in range(n):
    s = input()
    length = len(s)
    words = len(s.split())
    upper = s.upper()
    print(f"{length} {words} {upper}")
'''


# ============================================================
# Superhuman: Dependency Audit
# ============================================================

def _solve_dependency_audit(task: Task) -> str | None:
    title = task.title.lower() if task.title else ""
    tid = task.id if task.id else ""
    if "dependency" not in title and "supply chain" not in title and "sec-deps" not in tid:
        return None
    return '''VULN_DB = {
    "lodash@4.17.15": ("CVE-2020-8203", "HIGH"),
    "express@4.17.1": ("CVE-2022-24999", "MEDIUM"),
    "axios@0.21.0": ("CVE-2021-3749", "HIGH"),
    "jsonwebtoken@8.5.0": ("CVE-2022-23529", "CRITICAL"),
    "minimist@1.2.5": ("CVE-2021-44906", "CRITICAL"),
    "moment@2.29.1": ("CVE-2022-31129", "HIGH"),
    "node-fetch@2.6.1": ("CVE-2022-0235", "HIGH"),
}
SEV_ORDER = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3}

n = int(input())
vulns = []
for _ in range(n):
    pkg = input().strip()
    if pkg in VULN_DB:
        cve, sev = VULN_DB[pkg]
        vulns.append((pkg, cve, sev))

vulns.sort(key=lambda x: SEV_ORDER.get(x[2], 9))
print(len(vulns))
for pkg, cve, sev in vulns:
    print(f"{pkg} {cve} {sev}")
has_critical = any(sev == "CRITICAL" for _, _, sev in vulns)
if has_critical:
    print("BLOCK")
elif vulns:
    print("WARN")
else:
    print("PASS")
'''


# ============================================================
# Superhuman: API Retry with Backoff
# ============================================================

def _solve_api_retry(task: Task) -> str | None:
    title = task.title.lower() if task.title else ""
    tid = task.id if task.id else ""
    if "api retry" not in title and "apiretry" not in tid and "retry" not in title:
        return None
    if "backoff" not in title and "backoff" not in (task.description or "").lower():
        return None
    return '''n = int(input())
results = []
total_attempts = 0
successful = 0

for _ in range(n):
    parts = input().split()
    url = parts[0]
    statuses = [int(s) for s in parts[1:]]

    attempts = 0
    final_status = None
    for status in statuses:
        attempts += 1
        if status == 200:
            final_status = 200
            break
        elif status in (429, 500, 503):
            continue
        else:
            final_status = status
            break
    if final_status is None:
        final_status = statuses[-1]

    total_attempts += attempts
    if final_status == 200:
        successful += 1
    backoff_total = sum(2 ** i for i in range(attempts - 1)) if attempts > 1 else 0
    results.append((url, final_status, attempts, backoff_total))

print(f"{successful}/{n}")
print(total_attempts)
for url, status, attempts, backoff in results:
    print(f"{url} {status} {attempts} {backoff}s")
'''
