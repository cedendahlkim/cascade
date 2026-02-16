# Task: gen-comb-permutations-2386 | Score: 100% | 2026-02-11T10:39:06.370119

import itertools

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(input())

permutations = list(itertools.permutations(numbers))

for perm in permutations:
    print(' '.join(perm))