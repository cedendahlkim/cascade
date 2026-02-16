# Task: gen-comb-subsets-1594 | Score: 100% | 2026-02-13T19:24:27.574264

from itertools import combinations
n = int(input())
lst = [int(input()) for _ in range(n)]
print()
for r in range(1, n+1):
    for c in sorted(combinations(lst, r)):
        print(' '.join(str(x) for x in c))