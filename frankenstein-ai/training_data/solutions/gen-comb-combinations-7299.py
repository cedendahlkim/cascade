# Task: gen-comb-combinations-7299 | Score: 100% | 2026-02-11T10:41:36.549835

from itertools import combinations

n = int(input())
numbers = []
for _ in range(n):
  numbers.append(int(input()))
k = int(input())

for combination in combinations(numbers, k):
  print(*combination)