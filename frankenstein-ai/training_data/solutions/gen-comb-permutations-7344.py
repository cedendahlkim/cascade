# Task: gen-comb-permutations-7344 | Score: 100% | 2026-02-13T12:42:59.841966

from itertools import permutations
n = int(input())
lst = [int(input()) for _ in range(n)]
for p in sorted(permutations(lst)):
    print(' '.join(str(x) for x in p))