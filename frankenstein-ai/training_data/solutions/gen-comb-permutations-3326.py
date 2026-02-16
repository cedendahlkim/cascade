# Task: gen-comb-permutations-3326 | Score: 100% | 2026-02-15T07:45:56.649969

from itertools import permutations
n = int(input())
lst = [int(input()) for _ in range(n)]
for p in sorted(permutations(lst)):
    print(' '.join(str(x) for x in p))