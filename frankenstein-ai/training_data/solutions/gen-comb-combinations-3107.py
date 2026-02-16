# Task: gen-comb-combinations-3107 | Score: 100% | 2026-02-13T18:00:41.840656

from itertools import combinations
n = int(input())
lst = [int(input()) for _ in range(n)]
k = int(input())
for c in sorted(combinations(lst, k)):
    print(' '.join(str(x) for x in c))