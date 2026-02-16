# Task: gen-comb-permutations-6598 | Score: 100% | 2026-02-13T10:40:35.310346

from itertools import permutations
n = int(input())
lst = [int(input()) for _ in range(n)]
for p in sorted(permutations(lst)):
    print(' '.join(str(x) for x in p))