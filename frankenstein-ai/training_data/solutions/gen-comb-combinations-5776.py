# Task: gen-comb-combinations-5776 | Score: 100% | 2026-02-11T11:59:41.627276

from itertools import combinations

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(int(input()))
k = int(input())

for combination in combinations(numbers, k):
    print(*combination)