# Task: gen-comb-combinations-4323 | Score: 100% | 2026-02-11T12:03:11.018517

from itertools import combinations

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(int(input()))
k = int(input())

for combination in combinations(numbers, k):
    print(*combination)