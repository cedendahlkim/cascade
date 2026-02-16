# Task: gen-comb-permutations-6982 | Score: 100% | 2026-02-14T13:26:18.592907

from itertools import permutations
n = int(input())
lst = [int(input()) for _ in range(n)]
for p in sorted(permutations(lst)):
    print(' '.join(str(x) for x in p))