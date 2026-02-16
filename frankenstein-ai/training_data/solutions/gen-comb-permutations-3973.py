# Task: gen-comb-permutations-3973 | Score: 100% | 2026-02-11T10:33:36.655024

import itertools

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(int(input()))

permutations = list(itertools.permutations(numbers))
permutations.sort()

for perm in permutations:
    print(*perm)