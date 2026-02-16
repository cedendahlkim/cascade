# Task: gen-comb-combinations-8025 | Score: 100% | 2026-02-11T11:36:51.181406

from itertools import combinations

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(int(input()))
k = int(input())

for combination in combinations(numbers, k):
    print(*combination)