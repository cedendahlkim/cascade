# Task: gen-comb-permutations-5284 | Score: 100% | 2026-02-13T11:00:46.023896

from itertools import permutations
n = int(input())
lst = [int(input()) for _ in range(n)]
for p in sorted(permutations(lst)):
    print(' '.join(str(x) for x in p))