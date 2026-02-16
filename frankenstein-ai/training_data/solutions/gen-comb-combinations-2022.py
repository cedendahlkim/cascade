# Task: gen-comb-combinations-2022 | Score: 100% | 2026-02-13T19:24:33.621063

from itertools import combinations
n = int(input())
lst = [int(input()) for _ in range(n)]
k = int(input())
for c in sorted(combinations(lst, k)):
    print(' '.join(str(x) for x in c))