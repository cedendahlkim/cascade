# Task: gen-comb-permutations-6364 | Score: 100% | 2026-02-13T11:10:36.582575

from itertools import permutations
n = int(input())
lst = [int(input()) for _ in range(n)]
for p in sorted(permutations(lst)):
    print(' '.join(str(x) for x in p))