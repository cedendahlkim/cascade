# Task: gen-comb-permutations-2002 | Score: 100% | 2026-02-13T14:19:20.867201

from itertools import permutations
n = int(input())
lst = [int(input()) for _ in range(n)]
for p in sorted(permutations(lst)):
    print(' '.join(str(x) for x in p))