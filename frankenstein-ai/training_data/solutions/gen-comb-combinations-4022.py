# Task: gen-comb-combinations-4022 | Score: 100% | 2026-02-11T10:18:37.589597

from itertools import combinations

n = int(input())
numbers = []
for _ in range(n):
  numbers.append(int(input()))
k = int(input())

for combo in combinations(numbers, k):
  print(*combo)