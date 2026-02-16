# Task: gen-comb-permutations-2931 | Score: 100% | 2026-02-13T10:25:49.517398

from itertools import permutations
n = int(input())
lst = [int(input()) for _ in range(n)]
for p in sorted(permutations(lst)):
    print(' '.join(str(x) for x in p))