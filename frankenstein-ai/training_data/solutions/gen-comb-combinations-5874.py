# Task: gen-comb-combinations-5874 | Score: 100% | 2026-02-11T09:31:36.872881

from itertools import combinations

N = int(input())
numbers = []
for _ in range(N):
    numbers.append(int(input()))
K = int(input())

for combination in combinations(numbers, K):
    print(*combination)