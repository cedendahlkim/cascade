# Task: gen-comb-combinations-7655 | Score: 100% | 2026-02-15T10:28:07.049618

from itertools import combinations
n = int(input())
lst = [int(input()) for _ in range(n)]
k = int(input())
for c in sorted(combinations(lst, k)):
    print(' '.join(str(x) for x in c))