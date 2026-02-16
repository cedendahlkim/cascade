# Task: gen-comb-combinations-6774 | Score: 100% | 2026-02-14T13:25:55.046666

from itertools import combinations
n = int(input())
lst = [int(input()) for _ in range(n)]
k = int(input())
for c in sorted(combinations(lst, k)):
    print(' '.join(str(x) for x in c))