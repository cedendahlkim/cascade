# Task: gen-comb-permutations-5212 | Score: 100% | 2026-02-11T08:42:23.099339

import itertools

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(int(input()))

permutations = list(itertools.permutations(numbers))
permutations.sort()

for perm in permutations:
    print(*perm)