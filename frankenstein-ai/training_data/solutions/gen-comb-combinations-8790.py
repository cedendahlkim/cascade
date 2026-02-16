# Task: gen-comb-combinations-8790 | Score: 100% | 2026-02-11T10:38:56.163257

from itertools import combinations

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(int(input()))
k = int(input())

for combination in combinations(numbers, k):
    print(*combination)