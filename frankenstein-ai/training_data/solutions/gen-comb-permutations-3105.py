# Task: gen-comb-permutations-3105 | Score: 100% | 2026-02-15T08:48:11.484813

from itertools import permutations
n = int(input())
lst = [int(input()) for _ in range(n)]
for p in sorted(permutations(lst)):
    print(' '.join(str(x) for x in p))