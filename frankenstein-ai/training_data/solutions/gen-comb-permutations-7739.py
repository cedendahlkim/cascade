# Task: gen-comb-permutations-7739 | Score: 100% | 2026-02-13T09:42:28.115069

from itertools import permutations
n = int(input())
lst = [int(input()) for _ in range(n)]
for p in sorted(permutations(lst)):
    print(' '.join(str(x) for x in p))