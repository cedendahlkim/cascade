# Task: gen-comb-permutations-9020 | Score: 100% | 2026-02-10T17:42:18.267391

import itertools

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(int(input()))

permutations = list(itertools.permutations(numbers))

for perm in permutations:
    print(*perm)