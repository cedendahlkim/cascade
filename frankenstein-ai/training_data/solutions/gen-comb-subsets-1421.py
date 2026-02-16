# Task: gen-comb-subsets-1421 | Score: 100% | 2026-02-15T08:06:31.798200

from itertools import combinations
n = int(input())
lst = [int(input()) for _ in range(n)]
print()
for r in range(1, n+1):
    for c in sorted(combinations(lst, r)):
        print(' '.join(str(x) for x in c))