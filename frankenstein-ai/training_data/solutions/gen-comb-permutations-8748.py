# Task: gen-comb-permutations-8748 | Score: 100% | 2026-02-10T17:52:25.478847

import itertools

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(int(input()))

permutations = list(itertools.permutations(numbers))
permutations.sort()

for perm in permutations:
    print(*perm)