# Task: gen-comb-combinations-1970 | Score: 100% | 2026-02-11T11:53:36.668922

from itertools import combinations

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(int(input()))
k = int(input())

for combination in combinations(numbers, k):
    print(*combination)