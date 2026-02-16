# Task: gen-comb-combinations-9316 | Score: 100% | 2026-02-11T12:04:47.201592

from itertools import combinations

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(int(input()))
k = int(input())

for combination in combinations(numbers, k):
    print(*combination)