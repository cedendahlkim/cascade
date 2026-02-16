# Task: gen-comb-permutations-2429 | Score: 100% | 2026-02-14T12:08:37.301668

from itertools import permutations
n = int(input())
lst = [int(input()) for _ in range(n)]
for p in sorted(permutations(lst)):
    print(' '.join(str(x) for x in p))