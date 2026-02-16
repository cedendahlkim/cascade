# Task: gen-comb-combinations-5478 | Score: 100% | 2026-02-13T13:53:52.806745

from itertools import combinations
n = int(input())
lst = [int(input()) for _ in range(n)]
k = int(input())
for c in sorted(combinations(lst, k)):
    print(' '.join(str(x) for x in c))