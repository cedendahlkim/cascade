# Task: gen-comb-permutations-9137 | Score: 100% | 2026-02-11T09:24:09.238507

import itertools

N = int(input())
numbers = []
for _ in range(N):
    numbers.append(int(input()))

permutations = list(itertools.permutations(numbers))
permutations.sort()

for perm in permutations:
    print(*perm)