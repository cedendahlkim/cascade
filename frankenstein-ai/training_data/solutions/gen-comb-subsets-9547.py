# Task: gen-comb-subsets-9547 | Score: 100% | 2026-02-13T13:01:29.913564

from itertools import combinations
n = int(input())
lst = [int(input()) for _ in range(n)]
print()
for r in range(1, n+1):
    for c in sorted(combinations(lst, r)):
        print(' '.join(str(x) for x in c))