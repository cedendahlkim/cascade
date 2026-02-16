# Task: gen-comb-combinations-3856 | Score: 100% | 2026-02-11T10:05:58.338667

from itertools import combinations

n = int(input())
numbers = []
for _ in range(n):
  numbers.append(int(input()))
k = int(input())

for combination in combinations(numbers, k):
  print(*combination)