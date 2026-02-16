# Task: gen-comb-permutations-9164 | Score: 100% | 2026-02-11T09:17:30.685862

import itertools

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(int(input()))

permutations = list(itertools.permutations(numbers))

for perm in permutations:
    print(*perm)