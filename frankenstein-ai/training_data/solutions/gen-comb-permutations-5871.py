# Task: gen-comb-permutations-5871 | Score: 100% | 2026-02-13T15:28:59.633991

from itertools import permutations
n = int(input())
lst = [int(input()) for _ in range(n)]
for p in sorted(permutations(lst)):
    print(' '.join(str(x) for x in p))