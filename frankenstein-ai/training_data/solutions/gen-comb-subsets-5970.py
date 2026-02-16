# Task: gen-comb-subsets-5970 | Score: 100% | 2026-02-14T12:59:30.509606

from itertools import combinations
n = int(input())
lst = [int(input()) for _ in range(n)]
print()
for r in range(1, n+1):
    for c in sorted(combinations(lst, r)):
        print(' '.join(str(x) for x in c))