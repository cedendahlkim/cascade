# Task: gen-comb-combinations-1041 | Score: 100% | 2026-02-10T17:49:29.799382

from itertools import combinations

n = int(input())
numbers = []
for _ in range(n):
  numbers.append(int(input()))
k = int(input())

for combination in combinations(numbers, k):
  print(*combination)