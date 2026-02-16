# Task: gen-comb-combinations-7943 | Score: 100% | 2026-02-10T18:00:18.105469

from itertools import combinations

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(int(input()))
k = int(input())

for combination in combinations(numbers, k):
    print(*combination)