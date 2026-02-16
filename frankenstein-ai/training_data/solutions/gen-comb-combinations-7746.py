# Task: gen-comb-combinations-7746 | Score: 100% | 2026-02-13T13:53:54.519492

from itertools import combinations
n = int(input())
lst = [int(input()) for _ in range(n)]
k = int(input())
for c in sorted(combinations(lst, k)):
    print(' '.join(str(x) for x in c))