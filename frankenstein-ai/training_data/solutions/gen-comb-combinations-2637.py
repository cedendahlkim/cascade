# Task: gen-comb-combinations-2637 | Score: 100% | 2026-02-12T20:21:55.615648

from itertools import combinations

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(int(input()))
k = int(input())

for combination in combinations(numbers, k):
    print(*combination)