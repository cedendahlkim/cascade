# Task: gen-comb-combinations-3588 | Score: 100% | 2026-02-11T11:28:23.967941

from itertools import combinations

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(int(input()))
k = int(input())

for combination in combinations(numbers, k):
    print(*combination)