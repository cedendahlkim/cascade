# Task: gen-comb-permutations-5327 | Score: 100% | 2026-02-15T09:17:40.018616

from itertools import permutations
n = int(input())
lst = [int(input()) for _ in range(n)]
for p in sorted(permutations(lst)):
    print(' '.join(str(x) for x in p))