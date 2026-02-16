# Task: gen-comb-permutations-9407 | Score: 100% | 2026-02-12T14:55:46.068858

import itertools

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(int(input()))

permutations = list(itertools.permutations(numbers))

for perm in permutations:
    print(*perm)