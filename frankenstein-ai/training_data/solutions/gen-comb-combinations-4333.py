# Task: gen-comb-combinations-4333 | Score: 100% | 2026-02-10T18:08:48.128277

from itertools import combinations

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(int(input()))
k = int(input())

for combination in combinations(numbers, k):
    print(*combination)