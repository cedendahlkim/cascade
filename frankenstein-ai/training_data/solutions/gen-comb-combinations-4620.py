# Task: gen-comb-combinations-4620 | Score: 100% | 2026-02-11T09:05:07.849903

from itertools import combinations

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(int(input()))
k = int(input())

for combination in combinations(numbers, k):
    print(*combination)