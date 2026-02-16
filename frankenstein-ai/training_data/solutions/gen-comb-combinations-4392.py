# Task: gen-comb-combinations-4392 | Score: 100% | 2026-02-13T08:56:32.170786

from itertools import combinations

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(int(input()))
k = int(input())

for combination in combinations(numbers, k):
    print(*combination)