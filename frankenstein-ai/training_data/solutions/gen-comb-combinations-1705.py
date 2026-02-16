# Task: gen-comb-combinations-1705 | Score: 100% | 2026-02-10T19:04:39.885521

from itertools import combinations

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(int(input()))
k = int(input())

for combination in combinations(numbers, k):
    print(*combination)