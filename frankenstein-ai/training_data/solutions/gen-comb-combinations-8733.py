# Task: gen-comb-combinations-8733 | Score: 100% | 2026-02-11T11:30:26.364821

from itertools import combinations

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(int(input()))
k = int(input())

for combination in combinations(numbers, k):
    print(*combination)