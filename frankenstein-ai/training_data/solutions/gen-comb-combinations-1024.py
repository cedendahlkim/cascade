# Task: gen-comb-combinations-1024 | Score: 100% | 2026-02-15T09:34:07.000227

from itertools import combinations
n = int(input())
lst = [int(input()) for _ in range(n)]
k = int(input())
for c in sorted(combinations(lst, k)):
    print(' '.join(str(x) for x in c))