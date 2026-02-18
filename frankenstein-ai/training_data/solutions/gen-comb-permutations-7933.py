# Task: gen-comb-permutations-7933 | Score: 100% | 2026-02-17T20:00:21.694624

from itertools import permutations
n = int(input())
lst = [int(input()) for _ in range(n)]
for p in sorted(permutations(lst)):
    print(' '.join(str(x) for x in p))