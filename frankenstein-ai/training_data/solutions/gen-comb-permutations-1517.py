# Task: gen-comb-permutations-1517 | Score: 100% | 2026-02-13T16:47:08.468018

from itertools import permutations
n = int(input())
lst = [int(input()) for _ in range(n)]
for p in sorted(permutations(lst)):
    print(' '.join(str(x) for x in p))