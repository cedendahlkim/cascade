# Task: gen-comb-permutations-4013 | Score: 100% | 2026-02-13T20:02:03.482292

from itertools import permutations
n = int(input())
lst = [int(input()) for _ in range(n)]
for p in sorted(permutations(lst)):
    print(' '.join(str(x) for x in p))