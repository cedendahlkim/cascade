# Task: gen-comb-combinations-9283 | Score: 100% | 2026-02-14T12:04:39.649428

from itertools import combinations
n = int(input())
lst = [int(input()) for _ in range(n)]
k = int(input())
for c in sorted(combinations(lst, k)):
    print(' '.join(str(x) for x in c))