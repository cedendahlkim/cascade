# Task: gen-comb-combinations-2355 | Score: 100% | 2026-02-11T07:47:32.093550

from itertools import combinations

n = int(input())
elements = []
for _ in range(n):
    elements.append(int(input()))
k = int(input())

for combo in combinations(elements, k):
    print(*combo)