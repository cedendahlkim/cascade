# Task: gen-comb-permutations-2219 | Score: 100% | 2026-02-13T21:27:43.760663

from itertools import permutations
n = int(input())
lst = [int(input()) for _ in range(n)]
for p in sorted(permutations(lst)):
    print(' '.join(str(x) for x in p))