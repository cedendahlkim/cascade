# Task: gen-comb-combinations-7557 | Score: 100% | 2026-02-11T09:24:29.251116

from itertools import combinations

n = int(input())
numbers = []
for _ in range(n):
  numbers.append(int(input()))
k = int(input())

for combination in combinations(numbers, k):
  print(*combination)