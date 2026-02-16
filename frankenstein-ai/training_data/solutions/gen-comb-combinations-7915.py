# Task: gen-comb-combinations-7915 | Score: 100% | 2026-02-11T07:35:53.261589

from itertools import combinations

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(int(input()))
k = int(input())

for combination in combinations(numbers, k):
    print(*combination)