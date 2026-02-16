# Task: gen-comb-permutations-9649 | Score: 100% | 2026-02-11T12:07:39.997965

import itertools

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(int(input()))

permutations = list(itertools.permutations(numbers))

for perm in permutations:
    print(*perm)