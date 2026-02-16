# Task: gen-comb-permutations-6217 | Score: 100% | 2026-02-11T10:16:02.686526

import itertools

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(int(input()))

permutations = list(itertools.permutations(numbers))

for perm in permutations:
    print(*perm)