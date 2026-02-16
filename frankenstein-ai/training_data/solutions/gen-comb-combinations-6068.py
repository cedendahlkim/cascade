# Task: gen-comb-combinations-6068 | Score: 100% | 2026-02-13T09:26:09.625161

from itertools import combinations
n = int(input())
lst = [int(input()) for _ in range(n)]
k = int(input())
for c in sorted(combinations(lst, k)):
    print(' '.join(str(x) for x in c))