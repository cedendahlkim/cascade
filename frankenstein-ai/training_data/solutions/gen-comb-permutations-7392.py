# Task: gen-comb-permutations-7392 | Score: 100% | 2026-02-15T08:06:34.344391

from itertools import permutations
n = int(input())
lst = [int(input()) for _ in range(n)]
for p in sorted(permutations(lst)):
    print(' '.join(str(x) for x in p))