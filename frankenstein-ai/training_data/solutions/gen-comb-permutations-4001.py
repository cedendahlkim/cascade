# Task: gen-comb-permutations-4001 | Score: 100% | 2026-02-13T18:01:06.526384

from itertools import permutations
n = int(input())
lst = [int(input()) for _ in range(n)]
for p in sorted(permutations(lst)):
    print(' '.join(str(x) for x in p))