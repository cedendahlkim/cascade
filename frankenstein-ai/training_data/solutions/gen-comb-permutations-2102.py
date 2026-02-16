# Task: gen-comb-permutations-2102 | Score: 100% | 2026-02-15T08:06:21.681684

from itertools import permutations
n = int(input())
lst = [int(input()) for _ in range(n)]
for p in sorted(permutations(lst)):
    print(' '.join(str(x) for x in p))