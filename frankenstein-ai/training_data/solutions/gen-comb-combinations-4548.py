# Task: gen-comb-combinations-4548 | Score: 100% | 2026-02-13T10:56:34.727320

from itertools import combinations
n = int(input())
lst = [int(input()) for _ in range(n)]
k = int(input())
for c in sorted(combinations(lst, k)):
    print(' '.join(str(x) for x in c))