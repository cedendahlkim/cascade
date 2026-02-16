# Task: gen-comb-combinations-6587 | Score: 100% | 2026-02-11T10:49:00.759216

from itertools import combinations

n = int(input())
numbers = []
for _ in range(n):
  numbers.append(int(input()))
k = int(input())

for combination in combinations(numbers, k):
  print(*combination)