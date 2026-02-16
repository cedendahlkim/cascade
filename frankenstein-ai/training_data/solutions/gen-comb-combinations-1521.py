# Task: gen-comb-combinations-1521 | Score: 100% | 2026-02-11T10:31:51.375416

from itertools import combinations

N = int(input())
numbers = []
for _ in range(N):
    numbers.append(int(input()))
K = int(input())

for combo in combinations(numbers, K):
    print(*combo)