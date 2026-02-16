# Task: gen-comb-permutations-1430 | Score: 100% | 2026-02-15T11:12:51.833791

from itertools import permutations
n = int(input())
lst = [int(input()) for _ in range(n)]
for p in sorted(permutations(lst)):
    print(' '.join(str(x) for x in p))