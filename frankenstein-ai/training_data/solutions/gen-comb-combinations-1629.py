# Task: gen-comb-combinations-1629 | Score: 100% | 2026-02-11T11:35:14.582377

from itertools import combinations

n = int(input())
elements = []
for _ in range(n):
    elements.append(int(input()))
k = int(input())

for combo in combinations(elements, k):
    print(*combo)