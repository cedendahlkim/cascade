# Task: gen-comb-combinations-6328 | Score: 100% | 2026-02-11T11:40:59.364803

from itertools import combinations

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(int(input()))
k = int(input())

for combination in combinations(numbers, k):
    print(*combination)