# Task: gen-comb-permutations-8787 | Score: 100% | 2026-02-13T16:07:31.043555

from itertools import permutations
n = int(input())
lst = [int(input()) for _ in range(n)]
for p in sorted(permutations(lst)):
    print(' '.join(str(x) for x in p))