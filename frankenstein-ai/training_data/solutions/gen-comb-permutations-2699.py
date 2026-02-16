# Task: gen-comb-permutations-2699 | Score: 100% | 2026-02-10T18:31:11.671842

import itertools

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(input())

permutations = list(itertools.permutations(numbers))

for permutation in permutations:
    print(*permutation)