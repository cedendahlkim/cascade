# Task: gen-comb-subsets-8051 | Score: 100% | 2026-02-14T13:40:57.240838

from itertools import combinations
n = int(input())
lst = [int(input()) for _ in range(n)]
print()
for r in range(1, n+1):
    for c in sorted(combinations(lst, r)):
        print(' '.join(str(x) for x in c))