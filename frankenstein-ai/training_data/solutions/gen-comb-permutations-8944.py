# Task: gen-comb-permutations-8944 | Score: 100% | 2026-02-13T10:56:23.665074

from itertools import permutations
n = int(input())
lst = [int(input()) for _ in range(n)]
for p in sorted(permutations(lst)):
    print(' '.join(str(x) for x in p))