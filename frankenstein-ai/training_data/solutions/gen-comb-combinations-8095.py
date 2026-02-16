# Task: gen-comb-combinations-8095 | Score: 100% | 2026-02-12T17:09:36.241107

from itertools import combinations

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(int(input()))
k = int(input())

for combination in combinations(numbers, k):
    print(*combination)