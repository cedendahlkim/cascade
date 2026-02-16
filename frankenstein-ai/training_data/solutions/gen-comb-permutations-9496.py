# Task: gen-comb-permutations-9496 | Score: 100% | 2026-02-13T13:42:36.587505

from itertools import permutations
n = int(input())
lst = [int(input()) for _ in range(n)]
for p in sorted(permutations(lst)):
    print(' '.join(str(x) for x in p))