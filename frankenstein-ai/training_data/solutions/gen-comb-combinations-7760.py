# Task: gen-comb-combinations-7760 | Score: 100% | 2026-02-11T09:29:23.859621

from itertools import combinations

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(int(input()))
k = int(input())

for combination in combinations(numbers, k):
    print(*combination)