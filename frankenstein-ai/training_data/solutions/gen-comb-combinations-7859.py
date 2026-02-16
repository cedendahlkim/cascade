# Task: gen-comb-combinations-7859 | Score: 100% | 2026-02-11T09:02:04.638504

from itertools import combinations

n = int(input())
elements = []
for _ in range(n):
  elements.append(int(input()))
k = int(input())

for combo in combinations(elements, k):
  print(*combo)