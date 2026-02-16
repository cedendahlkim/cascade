# Task: gen-comb-permutations-7455 | Score: 100% | 2026-02-13T09:20:31.486407

from itertools import permutations
n = int(input())
lst = [int(input()) for _ in range(n)]
for p in sorted(permutations(lst)):
    print(' '.join(str(x) for x in p))