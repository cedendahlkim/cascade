# Task: gen-comb-combinations-6862 | Score: 100% | 2026-02-11T11:44:34.362175

from itertools import combinations

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(int(input()))
k = int(input())

for combination in combinations(numbers, k):
    print(*combination)