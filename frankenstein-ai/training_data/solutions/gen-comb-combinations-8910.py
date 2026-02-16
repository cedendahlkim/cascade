# Task: gen-comb-combinations-8910 | Score: 100% | 2026-02-11T09:25:44.773102

from itertools import combinations

n = int(input())
numbers = []
for _ in range(n):
  numbers.append(int(input()))
k = int(input())

for combination in combinations(numbers, k):
  print(*combination)