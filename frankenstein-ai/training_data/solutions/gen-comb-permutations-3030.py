# Task: gen-comb-permutations-3030 | Score: 100% | 2026-02-17T20:10:02.877035

from itertools import permutations
n = int(input())
lst = [int(input()) for _ in range(n)]
for p in sorted(permutations(lst)):
    print(' '.join(str(x) for x in p))