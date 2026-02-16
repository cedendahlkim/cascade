# Task: gen-comb-combinations-6066 | Score: 100% | 2026-02-11T09:41:04.286350

from itertools import combinations

N = int(input())
numbers = []
for _ in range(N):
    numbers.append(int(input()))
K = int(input())

for combination in combinations(numbers, K):
    print(*combination)