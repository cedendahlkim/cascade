# Task: gen-comb-combinations-5620 | Score: 100% | 2026-02-12T13:51:22.843877

from itertools import combinations

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(int(input()))
k = int(input())

for combination in combinations(numbers, k):
    print(*combination)