# Task: gen-comb-combinations-2783 | Score: 100% | 2026-02-10T19:03:46.859281

from itertools import combinations

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(int(input()))
k = int(input())

for combination in combinations(numbers, k):
    print(*combination)