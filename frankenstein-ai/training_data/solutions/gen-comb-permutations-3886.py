# Task: gen-comb-permutations-3886 | Score: 100% | 2026-02-13T09:42:27.579464

from itertools import permutations
n = int(input())
lst = [int(input()) for _ in range(n)]
for p in sorted(permutations(lst)):
    print(' '.join(str(x) for x in p))