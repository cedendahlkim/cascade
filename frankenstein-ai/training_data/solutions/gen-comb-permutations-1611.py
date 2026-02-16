# Task: gen-comb-permutations-1611 | Score: 100% | 2026-02-11T10:48:43.151886

import itertools

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(int(input()))

permutations = list(itertools.permutations(numbers))

for permutation in permutations:
    print(*permutation)