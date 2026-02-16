# Task: gen-comb-permutations-8400 | Score: 100% | 2026-02-13T12:51:28.228182

from itertools import permutations
n = int(input())
lst = [int(input()) for _ in range(n)]
for p in sorted(permutations(lst)):
    print(' '.join(str(x) for x in p))