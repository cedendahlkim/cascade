# Task: gen-comb-combinations-9342 | Score: 100% | 2026-02-11T10:43:38.384630

from itertools import combinations

n = int(input())
numbers = []
for _ in range(n):
  numbers.append(int(input()))
k = int(input())

for combination in combinations(numbers, k):
  print(*combination)