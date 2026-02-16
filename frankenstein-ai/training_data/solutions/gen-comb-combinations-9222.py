# Task: gen-comb-combinations-9222 | Score: 100% | 2026-02-11T08:45:47.660999

from itertools import combinations

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(int(input()))
k = int(input())

for combination in combinations(numbers, k):
    print(*combination)