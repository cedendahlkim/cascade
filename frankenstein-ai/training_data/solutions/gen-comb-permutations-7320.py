# Task: gen-comb-permutations-7320 | Score: 100% | 2026-02-13T09:15:47.269908

from itertools import permutations
n = int(input())
lst = [int(input()) for _ in range(n)]
for p in sorted(permutations(lst)):
    print(' '.join(str(x) for x in p))