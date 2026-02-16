# Task: gen-comb-permutations-1636 | Score: 100% | 2026-02-10T18:35:49.982211

import itertools

N = int(input())
numbers = []
for _ in range(N):
    numbers.append(int(input()))

permutations = list(itertools.permutations(numbers))

for permutation in permutations:
    print(*permutation)