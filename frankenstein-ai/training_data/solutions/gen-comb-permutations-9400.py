# Task: gen-comb-permutations-9400 | Score: 100% | 2026-02-15T14:00:03.221487

from itertools import permutations
n = int(input())
lst = [int(input()) for _ in range(n)]
for p in sorted(permutations(lst)):
    print(' '.join(str(x) for x in p))