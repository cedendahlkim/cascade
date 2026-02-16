# Task: gen-comb-permutations-7516 | Score: 100% | 2026-02-13T10:27:30.976957

from itertools import permutations
n = int(input())
lst = [int(input()) for _ in range(n)]
for p in sorted(permutations(lst)):
    print(' '.join(str(x) for x in p))