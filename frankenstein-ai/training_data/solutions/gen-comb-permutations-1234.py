# Task: gen-comb-permutations-1234 | Score: 100% | 2026-02-13T16:47:30.235894

from itertools import permutations
n = int(input())
lst = [int(input()) for _ in range(n)]
for p in sorted(permutations(lst)):
    print(' '.join(str(x) for x in p))