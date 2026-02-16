# Task: gen-comb-combinations-9182 | Score: 100% | 2026-02-14T12:20:35.314412

from itertools import combinations
n = int(input())
lst = [int(input()) for _ in range(n)]
k = int(input())
for c in sorted(combinations(lst, k)):
    print(' '.join(str(x) for x in c))