# Task: gen-comb-permutations-8177 | Score: 100% | 2026-02-13T12:53:16.049241

from itertools import permutations
n = int(input())
lst = [int(input()) for _ in range(n)]
for p in sorted(permutations(lst)):
    print(' '.join(str(x) for x in p))