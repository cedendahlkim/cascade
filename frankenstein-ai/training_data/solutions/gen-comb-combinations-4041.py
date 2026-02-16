# Task: gen-comb-combinations-4041 | Score: 100% | 2026-02-11T11:32:19.983480

from itertools import combinations

n = int(input())
numbers = []
for _ in range(n):
  numbers.append(int(input()))
k = int(input())

for combination in combinations(numbers, k):
  print(*combination)