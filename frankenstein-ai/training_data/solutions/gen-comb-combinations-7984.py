# Task: gen-comb-combinations-7984 | Score: 100% | 2026-02-10T17:53:11.753849

from itertools import combinations

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(int(input()))
k = int(input())

for combination in combinations(numbers, k):
    print(*combination)