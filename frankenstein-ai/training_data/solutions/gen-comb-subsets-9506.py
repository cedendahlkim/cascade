# Task: gen-comb-subsets-9506 | Score: 100% | 2026-02-13T14:55:45.444102

from itertools import combinations
n = int(input())
lst = [int(input()) for _ in range(n)]
print()
for r in range(1, n+1):
    for c in sorted(combinations(lst, r)):
        print(' '.join(str(x) for x in c))