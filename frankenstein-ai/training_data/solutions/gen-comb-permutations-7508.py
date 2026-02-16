# Task: gen-comb-permutations-7508 | Score: 100% | 2026-02-13T13:53:30.224116

from itertools import permutations
n = int(input())
lst = [int(input()) for _ in range(n)]
for p in sorted(permutations(lst)):
    print(' '.join(str(x) for x in p))