# Task: gen-comb-combinations-8028 | Score: 100% | 2026-02-13T10:53:18.373680

from itertools import combinations
n = int(input())
lst = [int(input()) for _ in range(n)]
k = int(input())
for c in sorted(combinations(lst, k)):
    print(' '.join(str(x) for x in c))