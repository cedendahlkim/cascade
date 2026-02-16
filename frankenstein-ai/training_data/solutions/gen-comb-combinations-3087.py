# Task: gen-comb-combinations-3087 | Score: 100% | 2026-02-13T09:15:54.349807

from itertools import combinations
n = int(input())
lst = [int(input()) for _ in range(n)]
k = int(input())
for c in sorted(combinations(lst, k)):
    print(' '.join(str(x) for x in c))