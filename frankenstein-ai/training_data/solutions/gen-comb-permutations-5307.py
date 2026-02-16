# Task: gen-comb-permutations-5307 | Score: 100% | 2026-02-10T17:49:25.672821

import itertools

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(int(input()))

permutations = list(itertools.permutations(numbers))

for permutation in permutations:
    print(*permutation)