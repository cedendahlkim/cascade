# Task: gen-comb-permutations-2958 | Score: 100% | 2026-02-15T10:08:59.889308

from itertools import permutations
n = int(input())
lst = [int(input()) for _ in range(n)]
for p in sorted(permutations(lst)):
    print(' '.join(str(x) for x in p))