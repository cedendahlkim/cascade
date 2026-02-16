# Task: gen-comb-permutations-4760 | Score: 100% | 2026-02-13T11:10:33.620545

from itertools import permutations
n = int(input())
lst = [int(input()) for _ in range(n)]
for p in sorted(permutations(lst)):
    print(' '.join(str(x) for x in p))