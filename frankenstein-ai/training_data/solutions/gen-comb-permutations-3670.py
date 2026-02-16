# Task: gen-comb-permutations-3670 | Score: 100% | 2026-02-15T08:35:24.371510

from itertools import permutations
n = int(input())
lst = [int(input()) for _ in range(n)]
for p in sorted(permutations(lst)):
    print(' '.join(str(x) for x in p))