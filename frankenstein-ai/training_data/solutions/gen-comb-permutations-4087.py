# Task: gen-comb-permutations-4087 | Score: 100% | 2026-02-13T15:28:39.337607

from itertools import permutations
n = int(input())
lst = [int(input()) for _ in range(n)]
for p in sorted(permutations(lst)):
    print(' '.join(str(x) for x in p))