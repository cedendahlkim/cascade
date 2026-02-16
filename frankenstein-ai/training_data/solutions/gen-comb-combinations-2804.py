# Task: gen-comb-combinations-2804 | Score: 100% | 2026-02-11T09:49:12.469764

from itertools import combinations

n = int(input())
numbers = []
for _ in range(n):
  numbers.append(int(input()))
k = int(input())

for combination in combinations(numbers, k):
  print(*combination)