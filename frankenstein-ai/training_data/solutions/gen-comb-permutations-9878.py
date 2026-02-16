# Task: gen-comb-permutations-9878 | Score: 100% | 2026-02-13T18:24:21.737501

from itertools import permutations
n = int(input())
lst = [int(input()) for _ in range(n)]
for p in sorted(permutations(lst)):
    print(' '.join(str(x) for x in p))