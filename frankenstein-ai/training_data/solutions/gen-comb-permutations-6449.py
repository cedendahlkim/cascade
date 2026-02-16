# Task: gen-comb-permutations-6449 | Score: 100% | 2026-02-11T10:09:57.244968

import itertools

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(int(input()))

permutations = list(itertools.permutations(numbers))

for perm in permutations:
    print(*perm)