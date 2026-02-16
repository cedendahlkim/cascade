# Task: gen-comb-permutations-2703 | Score: 100% | 2026-02-11T10:21:08.704246

import itertools

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(int(input()))

permutations = list(itertools.permutations(numbers))

for permutation in permutations:
    print(*permutation)