# Task: gen-comb-permutations-4474 | Score: 100% | 2026-02-15T11:37:49.146851

from itertools import permutations
n = int(input())
lst = [int(input()) for _ in range(n)]
for p in sorted(permutations(lst)):
    print(' '.join(str(x) for x in p))