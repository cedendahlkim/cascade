# Task: gen-comb-permutations-9106 | Score: 100% | 2026-02-13T13:47:02.613279

from itertools import permutations
n = int(input())
lst = [int(input()) for _ in range(n)]
for p in sorted(permutations(lst)):
    print(' '.join(str(x) for x in p))