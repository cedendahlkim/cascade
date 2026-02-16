# Task: gen-comb-permutations-2771 | Score: 100% | 2026-02-13T18:01:11.808587

from itertools import permutations
n = int(input())
lst = [int(input()) for _ in range(n)]
for p in sorted(permutations(lst)):
    print(' '.join(str(x) for x in p))