# Task: gen-comb-permutations-6332 | Score: 100% | 2026-02-13T18:00:48.138576

from itertools import permutations
n = int(input())
lst = [int(input()) for _ in range(n)]
for p in sorted(permutations(lst)):
    print(' '.join(str(x) for x in p))