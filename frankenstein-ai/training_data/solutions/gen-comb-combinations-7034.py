# Task: gen-comb-combinations-7034 | Score: 100% | 2026-02-13T09:15:38.796279

from itertools import combinations
n = int(input())
lst = [int(input()) for _ in range(n)]
k = int(input())
for c in sorted(combinations(lst, k)):
    print(' '.join(str(x) for x in c))