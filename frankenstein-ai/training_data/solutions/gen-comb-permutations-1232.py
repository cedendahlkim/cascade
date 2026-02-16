# Task: gen-comb-permutations-1232 | Score: 100% | 2026-02-10T18:33:44.718544

import itertools

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(int(input()))

permutations = list(itertools.permutations(numbers))

for perm in permutations:
    print(*perm)