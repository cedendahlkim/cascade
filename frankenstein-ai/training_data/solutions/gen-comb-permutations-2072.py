# Task: gen-comb-permutations-2072 | Score: 100% | 2026-02-10T18:50:42.034818

import itertools

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(int(input()))

permutations = list(itertools.permutations(numbers))

for perm in permutations:
    print(*perm)