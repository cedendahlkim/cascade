# Task: gen-comb-permutations-8815 | Score: 100% | 2026-02-11T10:04:23.133257

import itertools

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(input())

permutations = list(itertools.permutations(numbers))

for perm in permutations:
    print(' '.join(perm))