# Task: gen-comb-permutations-5943 | Score: 100% | 2026-02-13T09:27:21.749492

from itertools import permutations
n = int(input())
lst = [int(input()) for _ in range(n)]
for p in sorted(permutations(lst)):
    print(' '.join(str(x) for x in p))