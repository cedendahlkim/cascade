# Task: gen-comb-permutations-3199 | Score: 100% | 2026-02-13T11:17:10.558991

from itertools import permutations
n = int(input())
lst = [int(input()) for _ in range(n)]
for p in sorted(permutations(lst)):
    print(' '.join(str(x) for x in p))