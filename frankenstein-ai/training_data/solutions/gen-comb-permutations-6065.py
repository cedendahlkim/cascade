# Task: gen-comb-permutations-6065 | Score: 100% | 2026-02-11T10:39:41.389432

import itertools

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(int(input()))

permutations = list(itertools.permutations(numbers))

for perm in permutations:
    print(*perm)