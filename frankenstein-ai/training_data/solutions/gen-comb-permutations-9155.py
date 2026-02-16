# Task: gen-comb-permutations-9155 | Score: 100% | 2026-02-13T13:47:19.335662

from itertools import permutations
n = int(input())
lst = [int(input()) for _ in range(n)]
for p in sorted(permutations(lst)):
    print(' '.join(str(x) for x in p))