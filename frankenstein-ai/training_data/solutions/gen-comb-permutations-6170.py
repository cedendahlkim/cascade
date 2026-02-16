# Task: gen-comb-permutations-6170 | Score: 100% | 2026-02-13T12:53:14.998396

from itertools import permutations
n = int(input())
lst = [int(input()) for _ in range(n)]
for p in sorted(permutations(lst)):
    print(' '.join(str(x) for x in p))