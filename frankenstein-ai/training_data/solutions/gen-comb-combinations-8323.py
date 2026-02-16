# Task: gen-comb-combinations-8323 | Score: 100% | 2026-02-11T10:26:26.718483

from itertools import combinations

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(int(input()))
k = int(input())

for combination in combinations(numbers, k):
    print(*combination)