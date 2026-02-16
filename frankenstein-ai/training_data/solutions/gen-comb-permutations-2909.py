# Task: gen-comb-permutations-2909 | Score: 100% | 2026-02-15T07:46:34.068304

from itertools import permutations
n = int(input())
lst = [int(input()) for _ in range(n)]
for p in sorted(permutations(lst)):
    print(' '.join(str(x) for x in p))