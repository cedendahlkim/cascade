# Task: gen-comb-combinations-6187 | Score: 100% | 2026-02-11T10:08:35.427508

from itertools import combinations

N = int(input())
numbers = []
for _ in range(N):
    numbers.append(int(input()))
K = int(input())

for combination in combinations(numbers, K):
    print(*combination)