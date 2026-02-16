# Task: gen-comb-combinations-4992 | Score: 100% | 2026-02-10T19:13:47.581425

from itertools import combinations

n = int(input())
numbers = []
for _ in range(n):
  numbers.append(int(input()))
k = int(input())

for combination in combinations(numbers, k):
  print(*combination)