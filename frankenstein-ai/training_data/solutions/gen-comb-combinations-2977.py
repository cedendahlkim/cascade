# Task: gen-comb-combinations-2977 | Score: 100% | 2026-02-15T11:13:16.248534

from itertools import combinations
n = int(input())
lst = [int(input()) for _ in range(n)]
k = int(input())
for c in sorted(combinations(lst, k)):
    print(' '.join(str(x) for x in c))