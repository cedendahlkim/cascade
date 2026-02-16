# Task: gen-comb-permutations-4135 | Score: 100% | 2026-02-13T13:52:44.279655

from itertools import permutations
n = int(input())
lst = [int(input()) for _ in range(n)]
for p in sorted(permutations(lst)):
    print(' '.join(str(x) for x in p))