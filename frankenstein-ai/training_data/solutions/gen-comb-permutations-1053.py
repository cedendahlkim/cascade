# Task: gen-comb-permutations-1053 | Score: 100% | 2026-02-13T20:02:25.062718

from itertools import permutations
n = int(input())
lst = [int(input()) for _ in range(n)]
for p in sorted(permutations(lst)):
    print(' '.join(str(x) for x in p))