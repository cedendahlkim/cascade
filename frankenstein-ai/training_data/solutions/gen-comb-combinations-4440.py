# Task: gen-comb-combinations-4440 | Score: 100% | 2026-02-12T20:08:23.733786

from itertools import combinations

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(int(input()))
k = int(input())

for combination in combinations(numbers, k):
    print(*combination)