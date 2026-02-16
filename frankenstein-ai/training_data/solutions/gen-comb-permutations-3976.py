# Task: gen-comb-permutations-3976 | Score: 100% | 2026-02-13T10:11:48.535735

from itertools import permutations
n = int(input())
lst = [int(input()) for _ in range(n)]
for p in sorted(permutations(lst)):
    print(' '.join(str(x) for x in p))