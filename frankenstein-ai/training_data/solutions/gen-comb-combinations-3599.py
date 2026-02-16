# Task: gen-comb-combinations-3599 | Score: 100% | 2026-02-11T10:56:14.873283

from itertools import combinations

N = int(input())
numbers = []
for _ in range(N):
  numbers.append(int(input()))
K = int(input())

for combination in combinations(numbers, K):
  print(*combination)