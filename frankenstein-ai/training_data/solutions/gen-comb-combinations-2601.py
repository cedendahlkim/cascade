# Task: gen-comb-combinations-2601 | Score: 100% | 2026-02-11T11:39:45.891618

from itertools import combinations

n = int(input())
elements = []
for _ in range(n):
    elements.append(int(input()))
k = int(input())

for combination in combinations(elements, k):
    print(*combination)