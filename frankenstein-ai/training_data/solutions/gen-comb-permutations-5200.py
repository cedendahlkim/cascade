# Task: gen-comb-permutations-5200 | Score: 100% | 2026-02-13T12:32:36.403465

from itertools import permutations
n = int(input())
lst = [int(input()) for _ in range(n)]
for p in sorted(permutations(lst)):
    print(' '.join(str(x) for x in p))