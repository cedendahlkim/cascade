# Task: gen-comb-permutations-5754 | Score: 100% | 2026-02-13T14:10:22.517058

from itertools import permutations
n = int(input())
lst = [int(input()) for _ in range(n)]
for p in sorted(permutations(lst)):
    print(' '.join(str(x) for x in p))