# Task: gen-comb-permutations-6395 | Score: 100% | 2026-02-13T14:29:59.325770

from itertools import permutations
n = int(input())
lst = [int(input()) for _ in range(n)]
for p in sorted(permutations(lst)):
    print(' '.join(str(x) for x in p))