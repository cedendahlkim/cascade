# Task: gen-comb-permutations-1864 | Score: 100% | 2026-02-13T21:27:33.800710

from itertools import permutations
n = int(input())
lst = [int(input()) for _ in range(n)]
for p in sorted(permutations(lst)):
    print(' '.join(str(x) for x in p))