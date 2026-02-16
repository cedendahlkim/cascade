# Task: gen-comb-permutations-1476 | Score: 100% | 2026-02-13T13:38:45.849842

from itertools import permutations
n = int(input())
lst = [int(input()) for _ in range(n)]
for p in sorted(permutations(lst)):
    print(' '.join(str(x) for x in p))