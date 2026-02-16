# Task: gen-comb-permutations-6741 | Score: 100% | 2026-02-13T16:27:21.397622

from itertools import permutations
n = int(input())
lst = [int(input()) for _ in range(n)]
for p in sorted(permutations(lst)):
    print(' '.join(str(x) for x in p))