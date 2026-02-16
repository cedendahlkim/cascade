# Task: gen-comb-permutations-8312 | Score: 100% | 2026-02-15T09:17:30.203278

from itertools import permutations
n = int(input())
lst = [int(input()) for _ in range(n)]
for p in sorted(permutations(lst)):
    print(' '.join(str(x) for x in p))