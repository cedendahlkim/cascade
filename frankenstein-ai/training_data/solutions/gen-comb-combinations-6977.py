# Task: gen-comb-combinations-6977 | Score: 100% | 2026-02-11T09:10:17.358469

from itertools import combinations

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(int(input()))
k = int(input())

for combination in combinations(numbers, k):
    print(*combination)