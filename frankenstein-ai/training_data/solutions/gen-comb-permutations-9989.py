# Task: gen-comb-permutations-9989 | Score: 100% | 2026-02-11T09:23:15.775103

import itertools

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(int(input()))

permutations = list(itertools.permutations(numbers))

for perm in permutations:
    print(*perm)