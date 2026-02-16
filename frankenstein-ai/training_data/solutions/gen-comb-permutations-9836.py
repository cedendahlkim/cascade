# Task: gen-comb-permutations-9836 | Score: 100% | 2026-02-13T14:56:53.446706

from itertools import permutations
n = int(input())
lst = [int(input()) for _ in range(n)]
for p in sorted(permutations(lst)):
    print(' '.join(str(x) for x in p))