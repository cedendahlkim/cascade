# Task: gen-comb-permutations-3187 | Score: 100% | 2026-02-13T11:17:17.269040

from itertools import permutations
n = int(input())
lst = [int(input()) for _ in range(n)]
for p in sorted(permutations(lst)):
    print(' '.join(str(x) for x in p))