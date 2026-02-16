# Task: gen-comb-combinations-5186 | Score: 100% | 2026-02-13T14:42:08.843184

from itertools import combinations
n = int(input())
lst = [int(input()) for _ in range(n)]
k = int(input())
for c in sorted(combinations(lst, k)):
    print(' '.join(str(x) for x in c))