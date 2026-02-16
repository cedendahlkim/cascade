# Task: gen-comb-permutations-3559 | Score: 100% | 2026-02-13T11:10:32.563770

from itertools import permutations
n = int(input())
lst = [int(input()) for _ in range(n)]
for p in sorted(permutations(lst)):
    print(' '.join(str(x) for x in p))