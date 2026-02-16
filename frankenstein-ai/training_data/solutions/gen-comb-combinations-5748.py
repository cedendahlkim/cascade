# Task: gen-comb-combinations-5748 | Score: 100% | 2026-02-11T07:46:53.686615

from itertools import combinations

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(int(input()))
k = int(input())

for combination in combinations(numbers, k):
    print(*combination)