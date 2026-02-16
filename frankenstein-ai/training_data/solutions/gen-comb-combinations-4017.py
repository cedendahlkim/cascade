# Task: gen-comb-combinations-4017 | Score: 100% | 2026-02-11T12:05:28.351399

from itertools import combinations

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(int(input()))
k = int(input())

for combination in combinations(numbers, k):
    print(*combination)