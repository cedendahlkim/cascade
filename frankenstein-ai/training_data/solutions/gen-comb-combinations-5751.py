# Task: gen-comb-combinations-5751 | Score: 100% | 2026-02-11T11:40:19.967770

from itertools import combinations

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(int(input()))
k = int(input())

for combination in combinations(numbers, k):
    print(*combination)