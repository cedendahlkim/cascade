# Task: gen-comb-permutations-7120 | Score: 100% | 2026-02-10T19:04:49.858361

from itertools import permutations

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(int(input()))

for permutation in permutations(numbers):
    print(*permutation)