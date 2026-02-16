# Task: gen-comb-combinations-5394 | Score: 100% | 2026-02-11T08:55:53.327755

from itertools import combinations

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(int(input()))
k = int(input())

for combination in combinations(numbers, k):
    print(*combination)