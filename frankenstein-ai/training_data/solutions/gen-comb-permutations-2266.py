# Task: gen-comb-permutations-2266 | Score: 100% | 2026-02-13T10:27:26.089094

from itertools import permutations
n = int(input())
lst = [int(input()) for _ in range(n)]
for p in sorted(permutations(lst)):
    print(' '.join(str(x) for x in p))