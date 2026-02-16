# Task: gen-comb-permutations-4608 | Score: 100% | 2026-02-15T08:49:12.553629

from itertools import permutations
n = int(input())
lst = [int(input()) for _ in range(n)]
for p in sorted(permutations(lst)):
    print(' '.join(str(x) for x in p))