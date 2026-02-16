# Task: gen-comb-subsets-3862 | Score: 100% | 2026-02-15T09:50:45.975708

from itertools import combinations
n = int(input())
lst = [int(input()) for _ in range(n)]
print()
for r in range(1, n+1):
    for c in sorted(combinations(lst, r)):
        print(' '.join(str(x) for x in c))