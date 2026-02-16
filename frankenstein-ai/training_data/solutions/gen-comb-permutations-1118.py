# Task: gen-comb-permutations-1118 | Score: 100% | 2026-02-15T11:12:59.519553

from itertools import permutations
n = int(input())
lst = [int(input()) for _ in range(n)]
for p in sorted(permutations(lst)):
    print(' '.join(str(x) for x in p))