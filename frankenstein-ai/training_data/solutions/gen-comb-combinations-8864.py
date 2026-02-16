# Task: gen-comb-combinations-8864 | Score: 100% | 2026-02-12T18:47:29.093273

from itertools import combinations

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(int(input()))
k = int(input())

for combination in combinations(numbers, k):
    print(*combination)