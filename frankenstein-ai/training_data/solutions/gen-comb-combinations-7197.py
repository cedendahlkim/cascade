# Task: gen-comb-combinations-7197 | Score: 100% | 2026-02-15T07:46:35.413452

from itertools import combinations
n = int(input())
lst = [int(input()) for _ in range(n)]
k = int(input())
for c in sorted(combinations(lst, k)):
    print(' '.join(str(x) for x in c))