# Task: gen-comb-permutations-3865 | Score: 100% | 2026-02-13T11:53:02.222701

from itertools import permutations
n = int(input())
lst = [int(input()) for _ in range(n)]
for p in sorted(permutations(lst)):
    print(' '.join(str(x) for x in p))