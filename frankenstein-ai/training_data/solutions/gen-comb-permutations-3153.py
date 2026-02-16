# Task: gen-comb-permutations-3153 | Score: 100% | 2026-02-11T09:18:38.068487

import itertools

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(int(input()))

permutations = list(itertools.permutations(numbers))
permutations.sort()

for perm in permutations:
    print(*perm)