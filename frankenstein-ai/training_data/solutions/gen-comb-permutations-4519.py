# Task: gen-comb-permutations-4519 | Score: 100% | 2026-02-11T10:37:54.034971

import itertools

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(int(input()))

permutations = list(itertools.permutations(numbers))
permutations.sort()

for perm in permutations:
    print(*perm)