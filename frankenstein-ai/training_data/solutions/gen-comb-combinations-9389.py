# Task: gen-comb-combinations-9389 | Score: 100% | 2026-02-11T07:41:07.920600

from itertools import combinations

N = int(input())
numbers = []
for _ in range(N):
    numbers.append(int(input()))
K = int(input())

for combination in combinations(numbers, K):
    print(*combination)