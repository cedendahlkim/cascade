# Task: gen-comb-permutations-2522 | Score: 100% | 2026-02-14T12:13:26.863022

from itertools import permutations
n = int(input())
lst = [int(input()) for _ in range(n)]
for p in sorted(permutations(lst)):
    print(' '.join(str(x) for x in p))