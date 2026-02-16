# Task: gen-comb-permutations-5591 | Score: 100% | 2026-02-13T15:11:23.980002

from itertools import permutations
n = int(input())
lst = [int(input()) for _ in range(n)]
for p in sorted(permutations(lst)):
    print(' '.join(str(x) for x in p))