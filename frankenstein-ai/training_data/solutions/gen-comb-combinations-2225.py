# Task: gen-comb-combinations-2225 | Score: 100% | 2026-02-11T08:53:51.502361

from itertools import combinations

n = int(input())
numbers = []
for _ in range(n):
  numbers.append(int(input()))
k = int(input())

for combination in combinations(numbers, k):
  print(*combination)