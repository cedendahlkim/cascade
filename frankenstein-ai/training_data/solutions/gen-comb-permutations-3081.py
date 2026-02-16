# Task: gen-comb-permutations-3081 | Score: 100% | 2026-02-13T12:13:29.585083

from itertools import permutations
n = int(input())
lst = [int(input()) for _ in range(n)]
for p in sorted(permutations(lst)):
    print(' '.join(str(x) for x in p))