# Task: gen-comb-permutations-2290 | Score: 100% | 2026-02-13T10:54:40.796482

from itertools import permutations
n = int(input())
lst = [int(input()) for _ in range(n)]
for p in sorted(permutations(lst)):
    print(' '.join(str(x) for x in p))