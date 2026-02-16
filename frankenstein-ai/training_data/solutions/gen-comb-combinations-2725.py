# Task: gen-comb-combinations-2725 | Score: 100% | 2026-02-11T08:51:59.074647

from itertools import combinations

N = int(input())
numbers = []
for _ in range(N):
  numbers.append(int(input()))
K = int(input())

for combination in combinations(numbers, K):
  print(*combination)