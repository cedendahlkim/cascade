# Task: gen-comb-combinations-7745 | Score: 100% | 2026-02-14T12:59:31.594035

from itertools import combinations
n = int(input())
lst = [int(input()) for _ in range(n)]
k = int(input())
for c in sorted(combinations(lst, k)):
    print(' '.join(str(x) for x in c))