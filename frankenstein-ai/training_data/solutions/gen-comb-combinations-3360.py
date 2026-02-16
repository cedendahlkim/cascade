# Task: gen-comb-combinations-3360 | Score: 100% | 2026-02-11T11:19:10.085098

from itertools import combinations

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(int(input()))
k = int(input())

for combination in combinations(numbers, k):
    print(*combination)