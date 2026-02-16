# Task: gen-comb-permutations-2500 | Score: 100% | 2026-02-15T10:51:16.184213

from itertools import permutations
n = int(input())
lst = [int(input()) for _ in range(n)]
for p in sorted(permutations(lst)):
    print(' '.join(str(x) for x in p))