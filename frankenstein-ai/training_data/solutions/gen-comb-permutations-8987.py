# Task: gen-comb-permutations-8987 | Score: 100% | 2026-02-10T18:31:08.050417

import itertools

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(input())

permutations = list(itertools.permutations(numbers))

for permutation in permutations:
    print(*permutation)