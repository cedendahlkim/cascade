# Task: gen-comb-permutations-2608 | Score: 100% | 2026-02-13T10:02:51.006915

from itertools import permutations
n = int(input())
lst = [int(input()) for _ in range(n)]
for p in sorted(permutations(lst)):
    print(' '.join(str(x) for x in p))