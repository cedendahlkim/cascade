# Task: gen-comb-combinations-3533 | Score: 100% | 2026-02-11T07:26:35.525806

from itertools import combinations

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(int(input()))
k = int(input())

for combo in combinations(numbers, k):
    print(*combo)