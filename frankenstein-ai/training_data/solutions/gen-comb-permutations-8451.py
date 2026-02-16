# Task: gen-comb-permutations-8451 | Score: 100% | 2026-02-13T20:02:22.448206

from itertools import permutations
n = int(input())
lst = [int(input()) for _ in range(n)]
for p in sorted(permutations(lst)):
    print(' '.join(str(x) for x in p))