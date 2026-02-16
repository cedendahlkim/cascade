# Task: gen-comb-permutations-6897 | Score: 100% | 2026-02-11T11:00:15.523520

import itertools

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(input())

permutations = list(itertools.permutations(numbers))

for perm in permutations:
    print(' '.join(perm))