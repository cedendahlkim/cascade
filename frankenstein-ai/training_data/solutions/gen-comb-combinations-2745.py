# Task: gen-comb-combinations-2745 | Score: 100% | 2026-02-11T11:59:29.361689

from itertools import combinations

n = int(input())
numbers = []
for _ in range(n):
  numbers.append(int(input()))
k = int(input())

for combination in combinations(numbers, k):
  print(*combination)