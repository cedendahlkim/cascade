# Task: gen-comb-combinations-1531 | Score: 100% | 2026-02-11T07:47:30.158271

from itertools import combinations

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(int(input()))
k = int(input())

for combination in combinations(numbers, k):
    print(*combination)