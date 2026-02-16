# Task: gen-comb-subsets-8203 | Score: 100% | 2026-02-15T08:05:21.162802

from itertools import combinations
n = int(input())
lst = [int(input()) for _ in range(n)]
print()
for r in range(1, n+1):
    for c in sorted(combinations(lst, r)):
        print(' '.join(str(x) for x in c))