# Task: gen-comb-permutations-8018 | Score: 100% | 2026-02-13T14:56:19.083719

from itertools import permutations
n = int(input())
lst = [int(input()) for _ in range(n)]
for p in sorted(permutations(lst)):
    print(' '.join(str(x) for x in p))