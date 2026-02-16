# Task: gen-comb-permutations-6403 | Score: 100% | 2026-02-11T09:26:17.787882

import itertools

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(input())

permutations = list(itertools.permutations(numbers))

for perm in permutations:
    print(' '.join(perm))