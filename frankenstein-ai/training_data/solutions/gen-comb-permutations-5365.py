# Task: gen-comb-permutations-5365 | Score: 100% | 2026-02-10T19:04:57.220125

import itertools

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(input())

permutations = list(itertools.permutations(numbers))

for permutation in permutations:
    print(' '.join(permutation))