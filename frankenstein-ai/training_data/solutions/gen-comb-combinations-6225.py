# Task: gen-comb-combinations-6225 | Score: 100% | 2026-02-11T09:13:57.948000

from itertools import combinations

N = int(input())
numbers = []
for _ in range(N):
  numbers.append(int(input()))
K = int(input())

for combination in combinations(numbers, K):
  print(*combination)