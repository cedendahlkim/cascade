# Task: gen-comb-permutations-9081 | Score: 100% | 2026-02-13T14:09:43.466313

from itertools import permutations
n = int(input())
lst = [int(input()) for _ in range(n)]
for p in sorted(permutations(lst)):
    print(' '.join(str(x) for x in p))