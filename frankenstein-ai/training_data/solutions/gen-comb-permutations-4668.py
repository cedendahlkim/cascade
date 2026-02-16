# Task: gen-comb-permutations-4668 | Score: 100% | 2026-02-13T14:42:11.108715

from itertools import permutations
n = int(input())
lst = [int(input()) for _ in range(n)]
for p in sorted(permutations(lst)):
    print(' '.join(str(x) for x in p))