# Task: gen-comb-permutations-4203 | Score: 100% | 2026-02-13T12:17:44.243340

from itertools import permutations
n = int(input())
lst = [int(input()) for _ in range(n)]
for p in sorted(permutations(lst)):
    print(' '.join(str(x) for x in p))