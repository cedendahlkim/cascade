# Task: gen-comb-combinations-4284 | Score: 100% | 2026-02-11T10:00:56.336924

from itertools import combinations

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(int(input()))
k = int(input())

for combination in combinations(numbers, k):
    print(*combination)