# Task: gen-comb-permutations-7968 | Score: 100% | 2026-02-15T12:03:22.957199

from itertools import permutations
n = int(input())
lst = [int(input()) for _ in range(n)]
for p in sorted(permutations(lst)):
    print(' '.join(str(x) for x in p))