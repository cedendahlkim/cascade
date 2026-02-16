# Task: gen-comb-permutations-4605 | Score: 100% | 2026-02-13T14:55:58.856534

from itertools import permutations
n = int(input())
lst = [int(input()) for _ in range(n)]
for p in sorted(permutations(lst)):
    print(' '.join(str(x) for x in p))