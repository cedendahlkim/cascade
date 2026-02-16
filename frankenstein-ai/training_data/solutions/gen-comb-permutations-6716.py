# Task: gen-comb-permutations-6716 | Score: 100% | 2026-02-13T10:25:48.350801

from itertools import permutations
n = int(input())
lst = [int(input()) for _ in range(n)]
for p in sorted(permutations(lst)):
    print(' '.join(str(x) for x in p))