# Task: gen-comb-combinations-3734 | Score: 100% | 2026-02-13T08:56:31.821852

from itertools import combinations

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(int(input()))
k = int(input())

for combination in combinations(numbers, k):
    print(*combination)