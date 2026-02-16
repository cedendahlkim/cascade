# Task: gen-comb-combinations-1233 | Score: 100% | 2026-02-10T18:56:27.099508

from itertools import combinations

N = int(input())
numbers = []
for _ in range(N):
    numbers.append(int(input()))
K = int(input())

for combination in combinations(numbers, K):
    print(*combination)