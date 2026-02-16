# Task: gen-comb-permutations-7863 | Score: 100% | 2026-02-14T12:13:17.948693

from itertools import permutations
n = int(input())
lst = [int(input()) for _ in range(n)]
for p in sorted(permutations(lst)):
    print(' '.join(str(x) for x in p))