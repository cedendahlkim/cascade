# Task: gen-comb-combinations-4108 | Score: 100% | 2026-02-10T17:49:28.458103

from itertools import combinations

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(int(input()))
k = int(input())

for combination in combinations(numbers, k):
    print(*combination)