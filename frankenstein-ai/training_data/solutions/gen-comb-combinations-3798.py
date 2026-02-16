# Task: gen-comb-combinations-3798 | Score: 100% | 2026-02-11T09:58:28.416574

from itertools import combinations

N = int(input())
numbers = []
for _ in range(N):
    numbers.append(int(input()))
K = int(input())

for combination in combinations(numbers, K):
    print(*combination)