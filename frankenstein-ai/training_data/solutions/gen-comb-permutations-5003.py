# Task: gen-comb-permutations-5003 | Score: 100% | 2026-02-10T18:56:41.819472

import itertools

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(input())

permutations = list(itertools.permutations(numbers))

for perm in permutations:
    print(*perm)