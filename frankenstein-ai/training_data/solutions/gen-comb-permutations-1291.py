# Task: gen-comb-permutations-1291 | Score: 100% | 2026-02-13T19:15:11.559320

from itertools import permutations
n = int(input())
lst = [int(input()) for _ in range(n)]
for p in sorted(permutations(lst)):
    print(' '.join(str(x) for x in p))