# Task: gen-comb-permutations-5560 | Score: 100% | 2026-02-13T18:45:49.772295

from itertools import permutations
n = int(input())
lst = [int(input()) for _ in range(n)]
for p in sorted(permutations(lst)):
    print(' '.join(str(x) for x in p))