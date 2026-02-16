# Task: gen-comb-permutations-6245 | Score: 100% | 2026-02-13T19:14:41.394661

from itertools import permutations
n = int(input())
lst = [int(input()) for _ in range(n)]
for p in sorted(permutations(lst)):
    print(' '.join(str(x) for x in p))