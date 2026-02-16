# Task: gen-comb-combinations-9111 | Score: 100% | 2026-02-14T13:26:25.945797

from itertools import combinations
n = int(input())
lst = [int(input()) for _ in range(n)]
k = int(input())
for c in sorted(combinations(lst, k)):
    print(' '.join(str(x) for x in c))