# Task: gen-comb-permutations-1277 | Score: 100% | 2026-02-15T07:49:17.466617

from itertools import permutations
n = int(input())
lst = [int(input()) for _ in range(n)]
for p in sorted(permutations(lst)):
    print(' '.join(str(x) for x in p))