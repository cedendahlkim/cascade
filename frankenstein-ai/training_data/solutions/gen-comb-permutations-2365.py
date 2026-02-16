# Task: gen-comb-permutations-2365 | Score: 100% | 2026-02-11T07:31:34.690405

import itertools

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(int(input()))

permutations = list(itertools.permutations(numbers))
permutations.sort()

for perm in permutations:
    print(*perm)