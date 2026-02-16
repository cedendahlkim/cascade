# Task: gen-comb-permutations-5953 | Score: 100% | 2026-02-13T12:41:02.243204

from itertools import permutations
n = int(input())
lst = [int(input()) for _ in range(n)]
for p in sorted(permutations(lst)):
    print(' '.join(str(x) for x in p))