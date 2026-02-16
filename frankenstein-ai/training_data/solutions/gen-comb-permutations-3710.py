# Task: gen-comb-permutations-3710 | Score: 100% | 2026-02-13T14:56:55.009702

from itertools import permutations
n = int(input())
lst = [int(input()) for _ in range(n)]
for p in sorted(permutations(lst)):
    print(' '.join(str(x) for x in p))