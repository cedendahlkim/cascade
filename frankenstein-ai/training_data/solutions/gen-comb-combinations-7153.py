# Task: gen-comb-combinations-7153 | Score: 100% | 2026-02-13T14:56:55.735377

from itertools import combinations
n = int(input())
lst = [int(input()) for _ in range(n)]
k = int(input())
for c in sorted(combinations(lst, k)):
    print(' '.join(str(x) for x in c))