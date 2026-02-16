# Task: gen-comb-combinations-6963 | Score: 100% | 2026-02-10T18:35:43.251032

from itertools import combinations

N = int(input())
numbers = []
for _ in range(N):
    numbers.append(int(input()))
K = int(input())

for combination in combinations(numbers, K):
    print(*combination)