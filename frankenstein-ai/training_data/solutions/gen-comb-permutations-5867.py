# Task: gen-comb-permutations-5867 | Score: 100% | 2026-02-11T09:44:52.929434

import itertools

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(int(input()))

permutations = list(itertools.permutations(numbers))

for perm in permutations:
    print(*perm)