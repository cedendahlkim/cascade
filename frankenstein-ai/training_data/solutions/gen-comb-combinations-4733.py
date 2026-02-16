# Task: gen-comb-combinations-4733 | Score: 100% | 2026-02-11T10:24:57.415002

from itertools import combinations

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(int(input()))
k = int(input())

for combination in combinations(numbers, k):
    print(*combination)